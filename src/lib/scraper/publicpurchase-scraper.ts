import * as cheerio from "cheerio";
import type { ScraperAdapter, ScraperConfig, ScrapedRfp } from "./types";
import { fetchWithBrowser } from "./browser-fetch";

/**
 * Public Purchase public agency view.
 * Used by: Keene, NH (publicpurchase.com/gems/keene,nh/buyer/public/publicInfo)
 *
 * Public Purchase serves a login-less "publicInfo" page per agency that
 * lists current open solicitations. It obfuscates scraped content by
 * interleaving display:none spans with random chaff between the visible
 * pieces of the title. Stripping hidden elements restores clean text.
 *
 * Table layout (the one whose header row contains "Title Start Date"):
 *   td[0] = <a href="/gems/.../bid/bidView?bidId=NNNNNN"> with spans.
 *           Description is in <div id="desc_NNNNNN" class="balloonstyle">
 *           elsewhere in the document, referenced via rel="desc_NNNNNN".
 *   td[1] = start / posted date
 *   td[2] = end / deadline date
 *   td[3] = time-remaining text (discarded)
 *   td[4] = addendum timestamps
 */
export class PublicPurchaseScraper implements ScraperAdapter {
  name = "publicpurchase";

  async scrape(config: ScraperConfig): Promise<ScrapedRfp[]> {
    const url = config.rfp_page_url;
    const html = await fetchWithBrowser(url);
    const $ = cheerio.load(html);
    const origin = new URL(url).origin;
    const rfps: ScrapedRfp[] = [];

    const cleanText = (node: ReturnType<typeof $>): string => {
      const clone = node.clone();
      clone.find('[style*="display:none"], [style*="display: none"], [hidden]').remove();
      return clone.text().replace(/\s+/g, " ").trim();
    };

    // Find the bids table by its header row signature
    let bidsTable: ReturnType<typeof $> | null = null;
    $("table").each((_i, t) => {
      const header = $(t).find("tr").first().text().replace(/\s+/g, " ").trim();
      if (/title/i.test(header) && /(start|end)\s*date/i.test(header)) {
        bidsTable = $(t);
      }
    });
    if (!bidsTable) return rfps;
    const table = bidsTable as ReturnType<typeof $>;

    table.find("tbody tr").each((_i, tr) => {
      const $tr = $(tr);
      const tds = $tr.find("td");
      if (tds.length < 3) return;

      const titleAnchor = tds.eq(0).find("a").first();
      const title = cleanText(titleAnchor);
      if (!title) return;

      let sourceUrl = titleAnchor.attr("href") || "";
      if (sourceUrl && !sourceUrl.startsWith("http")) {
        sourceUrl = new URL(sourceUrl, origin).toString();
      }

      // Description sits in a sibling div keyed off the anchor's rel attribute
      const descId = titleAnchor.attr("rel");
      let description: string | undefined;
      if (descId && /^[A-Za-z0-9_-]+$/.test(descId)) {
        const descNode = $(`#${descId}`);
        if (descNode.length) description = cleanText(descNode);
      }

      const postedText = cleanText(tds.eq(1));
      const deadlineText = tds.length > 2 ? cleanText(tds.eq(2)) : "";

      rfps.push({
        title,
        description: description && description !== title ? description : undefined,
        source_url: sourceUrl || undefined,
        posted_date: parsePPDate(postedText),
        deadline_date: parsePPDate(deadlineText),
        raw_data: {
          platform: "publicpurchase",
          list_url: url,
          raw_start: postedText || null,
          raw_end: deadlineText || null,
        },
      });
    });

    return rfps;
  }
}

function parsePPDate(input: string): string | undefined {
  if (!input) return undefined;
  // Form: "Apr 20, 2026 2:00:00 PM EDT" — JS Date handles this directly.
  // Drop trailing "EDT"/"EST" which Node accepts on some versions but not all.
  const cleaned = input.replace(/\s*(EDT|EST|PDT|PST|CDT|CST|MDT|MST)\s*$/i, "").trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}
