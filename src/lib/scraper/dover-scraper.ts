import * as cheerio from "cheerio";
import type { ScraperAdapter, ScraperConfig, ScrapedRfp } from "./types";

/**
 * Dover, NH bids table.
 * Source: dover.nh.gov/government/city-operations/finance/bids
 *
 * Structure: table with header row (Department | Bid # | Service Needed | Date Due)
 *   td[0] = department (category)
 *   td[1] = bid # (may include "RFP" suffix)
 *   td[2] = title ("Service Needed")
 *   td[3] = deadline ("4/8/26 2:00 PM")
 */
export class DoverScraper implements ScraperAdapter {
  name = "dover";

  async scrape(config: ScraperConfig): Promise<ScrapedRfp[]> {
    const url = config.rfp_page_url;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const html = await response.text();
    const $ = cheerio.load(html);
    const rfps: ScrapedRfp[] = [];
    const origin = new URL(url).origin;

    $("table tbody tr").each((_, tr) => {
      const $tr = $(tr);
      const tds = $tr.find("td");
      if (tds.length < 4) return;

      const department = tds.eq(0).text().trim();
      const bidNumber = tds.eq(1).text().trim();
      const titleCell = tds.eq(2);
      const title = titleCell.text().replace(/\s+/g, " ").trim();
      const deadlineText = tds.eq(3).text().replace(/\s+/g, " ").trim();

      // Skip header row
      if (/^(department|bid|service|date)\s*:?$/i.test(department)) return;
      if (!title) return;

      const titleLink = titleCell.find("a").first();
      let sourceUrl = titleLink.attr("href") || "";
      if (sourceUrl && !sourceUrl.startsWith("http")) {
        sourceUrl = new URL(sourceUrl, origin).toString();
      }
      // Fallback: link anywhere in row (often a PDF)
      if (!sourceUrl) {
        const anyLink = $tr.find("a").first().attr("href") || "";
        if (anyLink) {
          sourceUrl = anyLink.startsWith("http") ? anyLink : new URL(anyLink, origin).toString();
        }
      }

      const fullTitle = bidNumber ? `${bidNumber} ${title}` : title;
      const deadline = parseDoverDate(deadlineText);

      rfps.push({
        title: fullTitle,
        category: department || undefined,
        source_url: sourceUrl || undefined,
        deadline_date: deadline,
        raw_data: { platform: "dover-custom", list_url: url, bid_number: bidNumber || null },
      });
    });

    return rfps;
  }
}

function parseDoverDate(text: string): string | undefined {
  if (!text) return undefined;
  // Normalize "4/8/262:00 PM" → "4/8/26 2:00 PM"
  const normalized = text.replace(/(\d)(\d{1,2}:\d{2})/, "$1 $2");
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}
