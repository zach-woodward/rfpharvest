/**
 * Fetch a page's HTML using FlareSolverr to bypass Cloudflare challenges.
 * FlareSolverr runs as a separate Docker service with its own browser.
 * Falls back to simple fetch if FlareSolverr is unavailable.
 */
export async function fetchWithBrowser(url: string): Promise<string> {
  const flareSolverrUrl =
    process.env.FLARESOLVERR_URL || "http://flaresolverr:8191";

  try {
    console.log(`[browser-fetch] Requesting ${url} via FlareSolverr`);

    const response = await fetch(`${flareSolverrUrl}/v1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cmd: "request.get",
        url,
        maxTimeout: 60000,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `FlareSolverr returned ${response.status}: ${response.statusText}`
      );
    }

    const data = (await response.json()) as {
      status: string;
      message: string;
      solution?: {
        url: string;
        status: number;
        response: string;
      };
    };

    if (data.status !== "ok" || !data.solution) {
      throw new Error(
        `FlareSolverr failed: ${data.message || "Unknown error"}`
      );
    }

    console.log(
      `[browser-fetch] FlareSolverr success for ${url} (status ${data.solution.status}, ${data.solution.response.length} chars)`
    );

    return data.solution.response;
  } catch (error) {
    console.error(`[browser-fetch] FlareSolverr error for ${url}:`, error);
    throw error;
  }
}
