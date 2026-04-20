import * as cheerio from "cheerio";
import type { ScraperAdapter, ScraperConfig, ScrapedRfp } from "./types";
import { fetchWithBrowser } from "./browser-fetch";

/**
 * BidNet Direct public agency view.
 * Used by: Providence RI (and other agencies on bidnetdirect.com).
 *
 * Each open solicitation is a <div class="sol-info-container"> with
 * predictable child classes:
 *   .sol-num           — "PVD26-42"
 *   .sol-title > a     — title + detail page href
 *   .sol-region        — state/location
 *   .sol-publication-date — "CalendarPublished MM/DD/YYYY"
 *   .sol-closing-date     — "ClockClosing MM/DD/YYYY"
 *
 * BidNet sits behind Cloudflare so the adapter always uses browser fetch.
 */
export class BidNetScraper implements ScraperAdapter {
  name = "bidnet";

  async scrape(config: ScraperConfig): Promise<ScrapedRfp[]> {
    const url = config.rfp_page_url;
    const html = await fetchWithBrowser(url);
    const $ = cheerio.load(html);
    const origin = new URL(url).origin;
    const rfps: ScrapedRfp[] = [];

    $(".sol-info-container").each((_, el) => {
      const $el = $(el);
      const titleLink = $el.find(".sol-title a").first();
      const title = titleLink.text().replace(/\s+/g, " ").trim();
      if (!title) return;

      let sourceUrl = titleLink.attr("href") || "";
      if (sourceUrl && !sourceUrl.startsWith("http")) {
        sourceUrl = new URL(sourceUrl, origin).toString();
      }

      const bidNumber = $el.find(".sol-num").text().replace(/\s+/g, " ").trim();
      const region = $el.find(".sol-region-item").first().text().replace(/\s+/g, " ").trim();

      const pubText = $el.find(".sol-publication-date").text().replace(/\s+/g, " ").trim();
      const closeText = $el.find(".sol-closing-date").text().replace(/\s+/g, " ").trim();

      const postedDate = extractDate(pubText);
      const deadlineDate = extractDate(closeText);

      const fullTitle = bidNumber ? `${bidNumber} ${title}` : title;

      rfps.push({
        title: fullTitle,
        source_url: sourceUrl || undefined,
        posted_date: postedDate,
        deadline_date: deadlineDate,
        raw_data: {
          platform: "bidnet",
          list_url: url,
          bid_number: bidNumber || null,
          region: region || null,
          raw_posted: pubText || null,
          raw_closing: closeText || null,
        },
      });
    });

    return rfps;
  }
}

function extractDate(input: string): string | undefined {
  if (!input) return undefined;
  const match = input.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  if (!match) return undefined;
  const d = new Date(match[1]);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}
