import * as cheerio from "cheerio";
import type { ScraperAdapter, ScraperConfig, ScrapedRfp } from "./types";
import { fetchWithBrowser } from "./browser-fetch";

/**
 * Scraper for CivicPlus/CivicEngage bids.aspx pages.
 * Used by: Concord, Nashua, Laconia, Hampton, Hanover, Londonderry, Berlin, Bedford
 *
 * Structure:
 *   div.bidItems.listItems
 *     div.bidsHeader.listHeader  (category header)
 *     div.listItemsRow.bid
 *       div.bidTitle > span > a[href="bids.aspx?bidID=NNN"]
 *       div.bidStatus (contains status + closing date)
 */
export class CivicPlusScraper implements ScraperAdapter {
  name = "civicplus";

  async scrape(config: ScraperConfig): Promise<ScrapedRfp[]> {
    const rfps: ScrapedRfp[] = [];
    const url = config.rfp_page_url;

    try {
      let html: string;
      if (config.requires_js) {
        console.log(`[civicplus] Using browser fetch for ${url} (requires_js)`);
        html = await fetchWithBrowser(url);
      } else {
        // Plain fetch first. CivicPlus sites often share a Cloudflare
        // front and rate-limit server IPs aggressively; on any fetch
        // failure, fall back to stealth Puppeteer which carries a
        // realistic browser TLS fingerprint that passes where plain
        // fetch doesn't.
        try {
          const response = await fetch(url, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          html = await response.text();
        } catch (fetchErr) {
          const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
          console.log(`[civicplus] plain fetch failed for ${url} (${msg}); falling back to stealth browser`);
          html = await fetchWithBrowser(url);
        }
      }
      const $ = cheerio.load(html);

      let currentCategory = "";

      $("div.bidItems div.bidsHeader, div.bidItems div.listItemsRow.bid").each(
        (_, el) => {
          const $el = $(el);

          // Track category headers
          if ($el.hasClass("bidsHeader")) {
            currentCategory = $el.find("span").first().text().trim();
            return;
          }

          // Parse bid row
          const titleLink = $el.find("div.bidTitle span a").first();
          const title = titleLink.text().trim();
          if (!title) return;

          // Skip archive/awarded entries — some agencies (e.g. Natick MA)
          // publish their full historical archive in /bids.aspx with an
          // "Award -" prefix. Ingesting those as open bids would pollute
          // the index. Proper current-open bids never start that way.
          if (/^(award\s*[-–]|awarded\b)/i.test(title)) return;

          let sourceUrl = titleLink.attr("href") || "";
          if (sourceUrl && !sourceUrl.startsWith("http")) {
            const base = new URL(url);
            sourceUrl = new URL(sourceUrl, base.origin + base.pathname.replace(/[^/]*$/, "")).toString();
          }

          // Parse status and closing date from bidStatus div
          const statusDiv = $el.find("div.bidStatus");
          const statusSpans = statusDiv.find("span");
          let deadlineDate: string | undefined;
          let status = "";

          statusSpans.each((i, span) => {
            const text = $(span).text().trim();
            if (text === "Status:" || text === "Closes:") return;
            if (text === "Open" || text === "Closed" || text === "Awarded") {
              status = text;
            } else if (text.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
              deadlineDate = parseDate(text);
            }
          });

          // Description from the second span in bidTitle
          const descSpan = $el.find("div.bidTitle > span").eq(1);
          const description = descSpan.length
            ? descSpan.text().replace(/\[Read\s+on\]/, "").trim()
            : undefined;

          const seenUrls = new Set<string>();
          if (sourceUrl && seenUrls.has(sourceUrl)) return;
          if (sourceUrl) seenUrls.add(sourceUrl);

          rfps.push({
            title,
            source_url: sourceUrl || undefined,
            description: description || undefined,
            category: currentCategory || undefined,
            deadline_date: deadlineDate,
            status: status || undefined,
          });
        }
      );
    } catch (error) {
      console.error(`[civicplus] Scrape error for ${url}:`, error);
      throw error;
    }

    // Deduplicate by source_url (CivicPlus can show same bid under multiple categories)
    const seen = new Set<string>();
    return rfps.filter((rfp) => {
      if (!rfp.source_url) return true;
      if (seen.has(rfp.source_url)) return false;
      seen.add(rfp.source_url);
      return true;
    });
  }
}

function parseDate(str: string): string | undefined {
  if (!str) return undefined;
  try {
    const d = new Date(str);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  } catch {
    return undefined;
  }
}
