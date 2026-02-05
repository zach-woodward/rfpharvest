import * as cheerio from "cheerio";
import type { ScraperAdapter, ScraperConfig, ScrapedRfp } from "./types";

export class GenericHtmlScraper implements ScraperAdapter {
  name = "generic";

  async scrape(config: ScraperConfig): Promise<ScrapedRfp[]> {
    const rfps: ScrapedRfp[] = [];
    const pages = config.pagination?.max_pages || 1;

    for (let page = 1; page <= pages; page++) {
      let url = config.rfp_page_url;
      if (config.pagination?.type === "page_param" && config.pagination.param_name) {
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}${config.pagination.param_name}=${page}`;
      }

      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "RFP-Harvest/1.0 (Government RFP aggregator)",
            ...config.custom_headers,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const sel = config.selectors || {};

        const container = sel.listing_container ? $(sel.listing_container) : $("body");
        const items = sel.listing_item
          ? container.find(sel.listing_item)
          : container.find("tr, .rfp-item, .bid-item, article");

        items.each((_, el) => {
          const $el = $(el);

          const title = sel.title
            ? $el.find(sel.title).text().trim()
            : $el.find("a, h2, h3, .title").first().text().trim();

          if (!title) return;

          const linkEl = sel.link ? $el.find(sel.link) : $el.find("a").first();
          let sourceUrl = linkEl.attr("href") || "";
          if (sourceUrl && !sourceUrl.startsWith("http")) {
            const base = new URL(config.rfp_page_url);
            sourceUrl = new URL(sourceUrl, base.origin).toString();
          }

          const rfp: ScrapedRfp = {
            title,
            source_url: sourceUrl || undefined,
            description: sel.description
              ? $el.find(sel.description).text().trim() || undefined
              : undefined,
            deadline_date: sel.deadline
              ? this.parseDate($el.find(sel.deadline).text().trim())
              : undefined,
            posted_date: sel.posted_date
              ? this.parseDate($el.find(sel.posted_date).text().trim())
              : undefined,
            category: sel.category
              ? $el.find(sel.category).text().trim() || undefined
              : undefined,
          };

          rfps.push(rfp);
        });

        // If no items found on this page, stop paginating
        if (items.length === 0) break;
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        break;
      }
    }

    return rfps;
  }

  private parseDate(dateStr: string): string | undefined {
    if (!dateStr) return undefined;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return undefined;
      return d.toISOString();
    } catch {
      return undefined;
    }
  }
}
