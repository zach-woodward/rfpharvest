/**
 * Browser-based HTML fetch for Cloudflare-protected pages.
 *
 * Strategy:
 *   1) Try FlareSolverr if FLARESOLVERR_URL is reachable — cheap, uses its
 *      own long-running browser.
 *   2) Fall back to local Puppeteer with the stealth plugin. Slower, but
 *      bypasses sites where FlareSolverr's old Chromium fingerprint gets
 *      caught (Londonderry, Rochester, Merrimack per platform-metadata).
 *
 * In prod this runs inside the worker container, which must ship with
 * a Chromium binary (see Dockerfile — node:20-alpine needs chromium +
 * nss packages added, or switch to node:20-slim).
 */

const FLARESOLVERR_TIMEOUT_MS = 60000;
// Bumped from 45s: the 2GB-RAM droplet swaps heavily when Chromium is
// active and Cloudflare JS challenges can take 20-40s on their own.
const PUPPETEER_NAV_TIMEOUT_MS = 90000;
const INITIAL_WAIT_MS = 4000;
const CLOUDFLARE_POLL_INTERVAL_MS = 2000;
const CLOUDFLARE_MAX_WAIT_MS = 45000;

export async function fetchWithBrowser(url: string): Promise<string> {
  // Prior behavior was: try FlareSolverr first, then stealth. In practice
  // FlareSolverr was failing on the CivicPlus/Cloudflare pages we need
  // and burning a 60s timeout before stealth even got its turn. Stealth
  // succeeds where FlareSolverr doesn't, so go straight there. Opt back
  // in via USE_FLARESOLVERR=1 if we find sites where it helps.
  if (process.env.USE_FLARESOLVERR === "1" && process.env.FLARESOLVERR_URL) {
    try {
      return await fetchViaFlareSolverr(url, process.env.FLARESOLVERR_URL);
    } catch (err) {
      console.warn(
        `[browser-fetch] FlareSolverr failed for ${url}, falling back to stealth:`,
        err instanceof Error ? err.message : err
      );
    }
  }
  return fetchViaStealth(url);
}

async function fetchViaFlareSolverr(url: string, endpoint: string): Promise<string> {
  console.log(`[browser-fetch] FlareSolverr request for ${url}`);
  const response = await fetch(`${endpoint}/v1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cmd: "request.get", url, maxTimeout: FLARESOLVERR_TIMEOUT_MS }),
  });

  if (!response.ok) {
    throw new Error(`FlareSolverr HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    status: string;
    message: string;
    solution?: { url: string; status: number; response: string };
  };

  if (data.status !== "ok" || !data.solution) {
    throw new Error(`FlareSolverr not ok: ${data.message || "unknown"}`);
  }

  console.log(
    `[browser-fetch] FlareSolverr ok for ${url} (${data.solution.status}, ${data.solution.response.length} chars)`
  );
  return data.solution.response;
}

async function fetchViaStealth(url: string): Promise<string> {
  console.log(`[browser-fetch] Stealth Puppeteer request for ${url}`);
  const puppeteerExtra = (await import("puppeteer-extra")).default;
  const stealth = (await import("puppeteer-extra-plugin-stealth")).default;
  puppeteerExtra.use(stealth());

  const browser = await puppeteerExtra.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1366, height: 900 });

    // Fire-and-forget navigation: Cloudflare JS challenges make
    // `waitUntil: "load"` / "domcontentloaded" never resolve — the page
    // keeps running challenge JS and Puppeteer throws a timeout even
    // though the DOM is fine. Instead, kick off the navigation with a
    // short commit timeout and just swallow any error; we'll read the
    // document after polling for Cloudflare to clear.
    await page
      .goto(url, { waitUntil: "commit", timeout: PUPPETEER_NAV_TIMEOUT_MS })
      .catch(() => {
        // Common for Cloudflare-gated pages — not fatal.
      });
    await new Promise((r) => setTimeout(r, INITIAL_WAIT_MS));

    // Poll the title until it stops saying "Just a moment" or we hit
    // the max wait. Works even if the goto above threw.
    const deadline = Date.now() + CLOUDFLARE_MAX_WAIT_MS;
    let title = await page.title().catch(() => "");
    while (Date.now() < deadline && /just a moment|attention required|cloudflare/i.test(title)) {
      await new Promise((r) => setTimeout(r, CLOUDFLARE_POLL_INTERVAL_MS));
      title = await page.title().catch(() => "");
    }

    const html = await page.content();
    console.log(`[browser-fetch] Stealth ok for ${url} (${html.length} chars, title="${title.slice(0, 60)}")`);
    return html;
  } finally {
    await browser.close();
  }
}
