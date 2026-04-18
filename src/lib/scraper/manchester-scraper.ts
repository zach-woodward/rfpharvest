import * as cheerio from "cheerio";
import type { ScraperAdapter, ScraperConfig, ScrapedRfp } from "./types";

/**
 * Manchester, NH bids table.
 * Source: manchesternh.gov/Departments/Purchasing/Bid-Opportunities-and-Results
 *
 * Structure: table with header (Bid # | Description | Download PDF | Bid Opening | Addenda | Results)
 *   td[0] = bid number (e.g. "FY26-500-25")
 *   td[1] = description; often prefixed with "Department: title" and followed by a contact line
 *   td[2] = "Download PDF" cell with one or more links
 *   td[3] = "Bids Due: March 5, 2025 by 2:00 PM"
 *   td[5] = Results cell (awarded info if present)
 */
export class ManchesterScraper implements ScraperAdapter {
  name = "manchester";

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

      const bidNumber = tds.eq(0).text().trim();
      const descriptionCell = tds.eq(1);
      const rawDescription = descriptionCell.text().replace(/\s+/g, " ").trim();
      const deadlineText = tds.eq(3).text().replace(/\s+/g, " ").trim();
      const resultsText = tds.length > 5 ? tds.eq(5).text().replace(/\s+/g, " ").trim() : "";

      // Skip header row
      if (/^bid\s*#?$/i.test(bidNumber)) return;
      if (!bidNumber && !rawDescription) return;

      // Strip trailing "Questions: email@domain" from description
      const description = rawDescription.replace(/\s*Questions:\s*\S+@\S+.*$/i, "").trim();
      if (!description) return;

      // Pick first PDF link from the "Download PDF" cell as the source
      let sourceUrl = "";
      const documentUrls: string[] = [];
      tds.eq(2)
        .find("a")
        .each((_i, a) => {
          const href = $(a).attr("href") || "";
          if (!href) return;
          const abs = href.startsWith("http") ? href : new URL(href, origin).toString();
          if (!sourceUrl) sourceUrl = abs;
          else documentUrls.push(abs);
        });

      const fullTitle = bidNumber ? `${bidNumber} ${description}` : description;
      const deadline = parseManchesterDeadline(deadlineText);
      const status = resultsText && /awarded/i.test(resultsText)
        ? "awarded"
        : deadline && new Date(deadline).getTime() < Date.now()
        ? "closed"
        : undefined;

      rfps.push({
        title: fullTitle,
        source_url: sourceUrl || undefined,
        deadline_date: deadline,
        status,
        document_urls: documentUrls.length ? documentUrls : undefined,
        raw_data: {
          platform: "manchester-custom",
          list_url: url,
          bid_number: bidNumber || null,
          results_text: resultsText || null,
        },
      });
    });

    return rfps;
  }
}

function parseManchesterDeadline(text: string): string | undefined {
  if (!text) return undefined;
  // Matches "Bids Due: March 5, 2025 by 2:00 PM" or "Bids Due: March 10, 2026 by 2:15 PM"
  const match = text.match(/([A-Z][a-z]+\s+\d{1,2},?\s*\d{4})(?:\s*by\s*(\d{1,2}:\d{2}\s*[AP]M))?/i);
  if (!match) return undefined;
  const dateStr = match[2] ? `${match[1]} ${match[2]}` : match[1];
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}
