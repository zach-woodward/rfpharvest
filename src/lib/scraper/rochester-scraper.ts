import * as cheerio from "cheerio";
import type { ScraperAdapter, ScraperConfig, ScrapedRfp } from "./types";
import { fetchWithBrowser } from "./browser-fetch";

/**
 * Rochester, NH open bids table (sits behind Cloudflare → always uses
 * browser fetch).
 * Source: rochesternh.gov/rochester-new-hampshire/links/bids
 *
 * Structure:
 *   td[0] = title with <a> to detail page (/bids/bids/bid-NN-NN-...)
 *   td[1] = bid number (e.g. "BID 26-02")
 *   td[2] = posted date/time ("04/06/2026 - 9:30am")
 *   td[3] = deadline date/time ("05/06/2026 - 5:00pm")
 *
 * The list view only shows currently-open bids by default — acceptable;
 * dedup by source_url means closed ones simply age out.
 */
export class RochesterScraper implements ScraperAdapter {
  name = "rochester";

  async scrape(config: ScraperConfig): Promise<ScrapedRfp[]> {
    const url = config.rfp_page_url;
    const html = await fetchWithBrowser(url);
    const $ = cheerio.load(html);
    const origin = new URL(url).origin;
    const rfps: ScrapedRfp[] = [];

    $("table tbody tr").each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length < 4) return;

      const titleCell = tds.eq(0);
      const title = titleCell.text().replace(/\s+/g, " ").trim();
      if (!title) return;

      const titleLink = titleCell.find("a").first();
      let sourceUrl = titleLink.attr("href") || "";
      if (sourceUrl && !sourceUrl.startsWith("http")) {
        sourceUrl = new URL(sourceUrl, origin).toString();
      }

      const bidNumber = tds.eq(1).text().trim();
      const postedText = tds.eq(2).text().replace(/\s+/g, " ").trim();
      const deadlineText = tds.eq(3).text().replace(/\s+/g, " ").trim();

      rfps.push({
        title,
        source_url: sourceUrl || undefined,
        posted_date: parseRochesterDate(postedText),
        deadline_date: parseRochesterDate(deadlineText),
        raw_data: {
          platform: "rochester-custom",
          list_url: url,
          bid_number: bidNumber || null,
        },
      });
    });

    return rfps;
  }
}

function parseRochesterDate(input: string): string | undefined {
  if (!input) return undefined;
  // Form: "05/06/2026 - 5:00pm" or "04/06/2026 - 9:30am". JS's Date
  // parser rejects "5:00pm" without a space before am/pm, so split the
  // pieces and re-compose with a space + uppercase meridiem.
  const match = input.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})(?:\s*-\s*(\d{1,2}):(\d{2})\s*([ap]m))?/i);
  if (!match) return undefined;
  const datePart = match[1];
  const composed = match[2]
    ? `${datePart} ${match[2]}:${match[3]} ${match[4].toUpperCase()}`
    : datePart;
  const d = new Date(composed);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}
