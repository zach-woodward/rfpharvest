import * as cheerio from "cheerio";
import type { ScraperAdapter, ScraperConfig, ScrapedRfp } from "./types";

/**
 * Portsmouth, NH custom bids table.
 * Source: portsmouthnh.gov/finance/purchasing-bids-and-proposals
 *
 * Structure: one <table> with header row + data rows.
 *   td[0] = title + PDF link (e.g. "BID # 23-25 Traffic Signal Replacement")
 *   td[1] = deadline date ("February 24, 2025 2:00 p.m.")
 *   td[2..5] = supplementary links (plans, addenda, bid tab)
 */
export class PortsmouthScraper implements ScraperAdapter {
  name = "portsmouth";

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
      if (tds.length < 2) return;

      const titleCell = tds.eq(0);
      const titleLink = titleCell.find("a").first();
      const title = (titleLink.text() || titleCell.text()).trim();
      if (!title) return;
      if (/^(bid\s*#?|rfp\s*#?|description|title|service)/i.test(title) && title.length < 25) return;

      let sourceUrl = titleLink.attr("href") || "";
      if (sourceUrl && !sourceUrl.startsWith("http")) {
        sourceUrl = new URL(sourceUrl, origin).toString();
      }

      const deadlineText = tds.eq(1).text().trim();
      const deadline = parseFlexibleDate(deadlineText);

      const documentUrls: string[] = [];
      tds.each((_i, td) => {
        $(td)
          .find("a")
          .each((_j, a) => {
            const href = $(a).attr("href") || "";
            if (!href) return;
            const abs = href.startsWith("http") ? href : new URL(href, origin).toString();
            if (abs !== sourceUrl && /\.(pdf|docx?|xlsx?)/i.test(abs)) documentUrls.push(abs);
          });
      });

      const inferredStatus = inferStatus(deadlineText, tds);

      rfps.push({
        title,
        source_url: sourceUrl || undefined,
        deadline_date: deadline,
        status: inferredStatus,
        document_urls: documentUrls.length ? Array.from(new Set(documentUrls)) : undefined,
        raw_data: { platform: "portsmouth-custom", list_url: url },
      });
    });

    return rfps;
  }
}

function parseFlexibleDate(input: string): string | undefined {
  if (!input) return undefined;
  const cleaned = input.replace(/\s+/g, " ").replace(/\./g, "").trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

function inferStatus(deadlineText: string, tds: ReturnType<cheerio.CheerioAPI>): string | undefined {
  const allText = tds.text().toLowerCase();
  if (allText.includes("awarded")) return "awarded";
  if (allText.includes("cancel")) return "canceled";
  const d = parseFlexibleDate(deadlineText);
  if (d && new Date(d).getTime() < Date.now()) return "closed";
  return undefined;
}
