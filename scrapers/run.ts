import { createClient } from "@supabase/supabase-js";
import { getScraper, registerScraper } from "./lib/scraper-registry";
import { CivicPlusScraper } from "./adapters/civicplus";
import { upsertRfp } from "./lib/upsert";
import type { ScraperConfig } from "./lib/types";

// Register platform-level scrapers. CivicPlus covers 8 NH towns today
// (Concord, Nashua, Laconia, Hampton, Hanover, Londonderry, Berlin, Bedford).
registerScraper("civicplus", new CivicPlusScraper());

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const targetId = process.argv[2]; // Optional: specific municipality ID

  console.log("[scraper] Starting scrape run...");

  let query = supabase.from("municipalities").select("*").eq("active", true);
  if (targetId) {
    query = query.eq("id", targetId);
  }

  const { data: municipalities, error } = await query;

  if (error || !municipalities?.length) {
    console.error("[scraper] No municipalities found:", error);
    process.exit(1);
  }

  console.log(`[scraper] Found ${municipalities.length} municipalities to scrape`);

  for (const muni of municipalities) {
    console.log(`\n[scraper] Scraping: ${muni.name} (${muni.scraper_type})`);

    // Create log entry
    const { data: log } = await supabase
      .from("scrape_logs")
      .insert({ municipality_id: muni.id, status: "running" })
      .select()
      .single();

    const logId = log?.id;

    try {
      const scraper = getScraper(muni.scraper_type);
      const config: ScraperConfig = {
        rfp_page_url: muni.rfp_page_url || muni.website_url || "",
        ...muni.scraper_config,
      };

      if (!config.rfp_page_url) {
        throw new Error("No RFP page URL configured");
      }

      const scrapedRfps = await scraper.scrape(config);
      console.log(`[scraper] Found ${scrapedRfps.length} RFPs from ${muni.name}`);

      let newCount = 0;
      let updatedCount = 0;
      let spamCount = 0;
      let errorCount = 0;
      const errorReasons: string[] = [];

      for (const rfp of scrapedRfps) {
        const result = await upsertRfp(supabase, muni.id, rfp);
        if (result.outcome === "new") newCount++;
        else if (result.outcome === "updated") updatedCount++;
        else if (result.outcome === "spam") spamCount++;
        else if (result.outcome === "error") {
          errorCount++;
          if (result.reason) errorReasons.push(result.reason);
        }
      }

      const status = errorCount > 0 && newCount + updatedCount === 0 ? "error" : errorCount > 0 ? "partial" : "success";

      if (logId) {
        await supabase
          .from("scrape_logs")
          .update({
            status,
            completed_at: new Date().toISOString(),
            rfps_found: scrapedRfps.length,
            rfps_new: newCount,
            rfps_updated: updatedCount,
            error_message: errorReasons.length ? errorReasons.slice(0, 5).join(" | ") : null,
            details: { spam_rejected: spamCount, row_errors: errorCount },
          })
          .eq("id", logId);
      }

      // Update municipality last scraped
      await supabase
        .from("municipalities")
        .update({ last_scraped_at: new Date().toISOString() })
        .eq("id", muni.id);

      console.log(
        `[scraper] ${muni.name}: ${newCount} new, ${updatedCount} updated, ${spamCount} spam, ${errorCount} errors`
      );
    } catch (error) {
      console.error(`[scraper] Error scraping ${muni.name}:`, error);

      if (logId) {
        await supabase
          .from("scrape_logs")
          .update({
            status: "error",
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : String(error),
          })
          .eq("id", logId);
      }
    }
  }

  console.log("\n[scraper] Scrape run complete.");
}

main().catch(console.error);
