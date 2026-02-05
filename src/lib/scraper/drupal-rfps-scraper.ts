import * as cheerio from "cheerio";
import type { ScraperAdapter, ScraperConfig, ScrapedRfp } from "./types";
import { fetchWithBrowser } from "./browser-fetch";

/**
 * Scraper for Drupal 7 Virtual Town Hall RFP views.
 * Used by: Exeter, Hudson
 *
 * Structure:
 *   div.view-rfps .view-content table.views-table tbody
 *     tr
 *       td.views-field-title a
 *       td.views-field-field-bid-rfp-due-date
 *       td.views-field-field-bid-rfp-status
 */
export class DrupalRfpsScraper implements ScraperAdapter {
  name = "drupal-rfps";

  async scrape(config: ScraperConfig): Promise<ScrapedRfp[]> {
    const rfps: ScrapedRfp[] = [];
    // Fetch all statuses, not just open
    let url = config.rfp_page_url;
    if (!url.includes("field_bid_rfp_status")) {
      const sep = url.includes("?") ? "&" : "?";
      url = `${url}${sep}field_bid_rfp_status_value_1=All`;
    }

    try {
      let html: string;
      if (config.requires_js) {
        console.log(`[drupal-rfps] Using browser fetch for ${url}`);
        html = await fetchWithBrowser(url);
      } else {
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
      }
      const $ = cheerio.load(html);

      // Check if the view has content
      if ($("div.view-rfps div.view-empty").length) {
        console.log(`[drupal-rfps] No bids found at ${url}`);
        return rfps;
      }

      $("div.view-rfps table.views-table tbody tr").each((_, el) => {
        const $el = $(el);

        const titleCell = $el.find("td.views-field-title");
        const titleLink = titleCell.find("a").first();
        const title = titleLink.text().trim();
        if (!title) return;

        let sourceUrl = titleLink.attr("href") || "";
        if (sourceUrl && !sourceUrl.startsWith("http")) {
          const base = new URL(config.rfp_page_url);
          sourceUrl = new URL(sourceUrl, base.origin).toString();
        }

        const dueDateText = $el
          .find("td.views-field-field-bid-rfp-due-date")
          .text()
          .trim();
        const statusText = $el
          .find("td.views-field-field-bid-rfp-status")
          .text()
          .trim();

        rfps.push({
          title,
          source_url: sourceUrl || undefined,
          deadline_date: parseDate(dueDateText),
          category: statusText || undefined,
        });
      });
    } catch (error) {
      console.error(`[drupal-rfps] Scrape error for ${url}:`, error);
      throw error;
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
