import * as cheerio from "cheerio";
import type { ScraperAdapter, ScraperConfig, ScrapedRfp } from "./types";
import { fetchWithBrowser } from "./browser-fetch";

/**
 * Derry, NH bids table (sits behind Cloudflare → always uses browser fetch).
 * Source: derrynh.gov/bids-rfps
 *
 * Structure: single large table (~200+ historical rows)
 *   td[0] = title, with <a> link to PDF
 *   td[1] = status ("Open" / "Closed" / etc)
 *   td[2] = department
 *   td[3] = deadline text ("Monday, May 4, 2026, by 5pm")
 *
 * Rows without an "Open" status are still scraped but normalized to closed
 * downstream; we keep them so the admin UI / historical search stays rich.
 */
export class DerryScraper implements ScraperAdapter {
  name = "derry";

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
      const rawTitle = titleCell.text().replace(/\s+/g, " ").trim();
      if (!rawTitle) return;
      if (/^title$/i.test(rawTitle)) return;

      const titleLink = titleCell.find("a").first();
      let sourceUrl = titleLink.attr("href") || "";
      if (sourceUrl && !sourceUrl.startsWith("http")) {
        sourceUrl = new URL(sourceUrl, origin).toString();
      }

      const status = tds.eq(1).text().trim();
      const department = tds.eq(2).text().trim();
      const deadlineText = tds.eq(3).text().replace(/\s+/g, " ").trim();

      rfps.push({
        title: rawTitle,
        source_url: sourceUrl || undefined,
        category: department || undefined,
        status: status || undefined,
        deadline_date: parseDerryDate(deadlineText),
        raw_data: { platform: "derry-custom", list_url: url, raw_deadline: deadlineText || null },
      });
    });

    return rfps;
  }
}

function parseDerryDate(input: string): string | undefined {
  if (!input) return undefined;
  // Typical form: "Monday, May 4, 2026, by 5pm" or "April 24, 2026 by 4pm"
  const dateMatch = input.match(/([A-Z][a-z]+\s+\d{1,2},?\s*\d{4})/);
  if (!dateMatch) return undefined;
  const timeMatch = input.match(/by\s*(\d{1,2})(?::(\d{2}))?\s*([ap]m)/i);
  let composed = dateMatch[1];
  if (timeMatch) {
    const hh = timeMatch[1];
    const mm = timeMatch[2] || "00";
    const ampm = timeMatch[3].toUpperCase();
    composed += ` ${hh}:${mm} ${ampm}`;
  }
  const d = new Date(composed);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}
