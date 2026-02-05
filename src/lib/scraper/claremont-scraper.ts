import * as cheerio from "cheerio";
import type { ScraperAdapter, ScraperConfig, ScrapedRfp } from "./types";

/**
 * Scraper for Claremont NH's custom CMS procurement page.
 * URL: claremontnh.com/index.php?section=procurement
 *
 * Structure:
 *   div.resources_page div.event-section
 *     div.event-box
 *       div.event > a[href="index.php?section=procurement&docid=NNN"]
 *       inline text: "| Due Date: YYYY-MM-DD"
 */
export class ClaremontScraper implements ScraperAdapter {
  name = "claremont";

  async scrape(config: ScraperConfig): Promise<ScrapedRfp[]> {
    const rfps: ScrapedRfp[] = [];
    const url = config.rfp_page_url;

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

      const html = await response.text();
      const $ = cheerio.load(html);

      // Primary: div.event-box structure
      $("div.event-box").each((_, el) => {
        const $el = $(el);
        const link = $el.find("div.event a").first();
        const title = link.text().trim();
        if (!title) return;

        let sourceUrl = link.attr("href") || "";
        if (sourceUrl && !sourceUrl.startsWith("http")) {
          const base = new URL(url);
          sourceUrl = new URL(sourceUrl, base.origin).toString();
        }

        // Extract due date from inline text like "| Due Date: 2026-02-15"
        const fullText = $el.text();
        const dateMatch = fullText.match(/Due\s*Date:\s*(\d{4}-\d{2}-\d{2})/i)
          || fullText.match(/Due\s*Date:\s*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i);
        const deadlineDate = dateMatch ? parseDate(dateMatch[1]) : undefined;

        rfps.push({
          title,
          source_url: sourceUrl || undefined,
          deadline_date: deadlineDate,
        });
      });

      // Fallback: try links in the content area if no event-box structure found
      if (rfps.length === 0) {
        $("div.resources_page a, div.event-section a, main a").each((_, el) => {
          const $a = $(el);
          const title = $a.text().trim();
          if (!title || title.length < 5) return;
          if (title.match(/^(home|about|contact|back|menu|login|search|awarded)/i)) return;

          let sourceUrl = $a.attr("href") || "";
          if (sourceUrl && !sourceUrl.startsWith("http")) {
            const base = new URL(url);
            sourceUrl = new URL(sourceUrl, base.origin).toString();
          }

          if (
            sourceUrl.includes("procurement") ||
            sourceUrl.includes("bid") ||
            sourceUrl.includes("rfp") ||
            sourceUrl.match(/\.(pdf|doc|docx)$/i)
          ) {
            rfps.push({
              title,
              source_url: sourceUrl || undefined,
            });
          }
        });
      }
    } catch (error) {
      console.error(`[claremont] Scrape error for ${url}:`, error);
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
