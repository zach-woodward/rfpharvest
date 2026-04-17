import * as cheerio from "cheerio";
import type { ScraperAdapter, ScraperConfig, ScrapedRfp } from "../lib/types";

const USER_AGENT = "RFP-Harvest/1.0 (Government RFP aggregator)";

export class CivicPlusScraper implements ScraperAdapter {
  name = "civicplus";

  async scrape(config: ScraperConfig): Promise<ScrapedRfp[]> {
    const listUrl = config.rfp_page_url;
    const origin = new URL(listUrl).origin;

    const response = await fetch(listUrl, {
      headers: { "User-Agent": USER_AGENT, ...config.custom_headers },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} fetching ${listUrl}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const rfps: ScrapedRfp[] = [];

    $(".listItemsRow.bid").each((_, el) => {
      const $el = $(el);

      const titleSpan = $el.find(".bidTitle > span").first();
      const title = titleSpan.text().trim();
      if (!title) return;

      let sourceUrl = titleSpan.find("a").attr("href") || "";
      if (sourceUrl && !sourceUrl.startsWith("http")) {
        sourceUrl = new URL(sourceUrl, origin).toString();
      }

      const descSpan = $el.find(".bidTitle > span").eq(1).clone();
      descSpan.find("a").remove();
      const description = descSpan
        .text()
        .trim()
        .replace(/\[\s*\]\s*$/, "")
        .replace(/\.\.\.$/, "")
        .trim();

      const statusValues = $el
        .find(".bidStatus > div")
        .eq(1)
        .find("span")
        .map((_i, s) => $(s).text().trim())
        .get();

      const [statusLabel, deadlineText] = statusValues;
      const deadline = parseDate(deadlineText);

      const statusLower = (statusLabel || "").toLowerCase();
      if (statusLower && statusLower !== "open") {
        return;
      }

      rfps.push({
        title,
        description: description || undefined,
        source_url: sourceUrl || undefined,
        deadline_date: deadline,
        raw_data: {
          platform: "civicplus",
          list_url: listUrl,
          status_label: statusLabel || null,
          raw_deadline: deadlineText || null,
        },
      });
    });

    return rfps;
  }
}

function parseDate(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}
