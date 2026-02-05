import * as cheerio from "cheerio";
import type { ScraperAdapter, ScraperConfig, ScrapedRfp } from "./types";

export class ConcordNhScraper implements ScraperAdapter {
  name = "concord-nh";

  async scrape(config: ScraperConfig): Promise<ScrapedRfp[]> {
    const rfps: ScrapedRfp[] = [];
    const url = config.rfp_page_url;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "RFP-Harvest/1.0 (Government RFP aggregator)",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      $("table.bids-table tbody tr, .rfp-listing .rfp-item").each((_, el) => {
        const $el = $(el);
        const title = $el.find("td:first-child a, .rfp-title a").text().trim();
        if (!title) return;

        const link = $el.find("td:first-child a, .rfp-title a").attr("href");
        const deadlineText = $el.find("td:nth-child(3), .rfp-deadline").text().trim();
        const postedText = $el.find("td:nth-child(2), .rfp-posted").text().trim();

        let sourceUrl = link || "";
        if (sourceUrl && !sourceUrl.startsWith("http")) {
          sourceUrl = new URL(sourceUrl, new URL(url).origin).toString();
        }

        rfps.push({
          title,
          source_url: sourceUrl || undefined,
          deadline_date: parseDate(deadlineText),
          posted_date: parseDate(postedText),
          category: $el.find("td:nth-child(4), .rfp-category").text().trim() || undefined,
        });
      });
    } catch (error) {
      console.error(`[concord-nh] Scrape error:`, error);
    }

    return rfps;
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
