import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getScraper, registerScraper } from "./lib/scraper-registry";
import { CivicPlusScraper } from "./adapters/civicplus";
import { upsertRfp } from "./lib/upsert";
import type { ScraperConfig } from "./lib/types";

// Register platform-level scrapers. CivicPlus covers 8 NH towns today
// (Concord, Nashua, Laconia, Hampton, Hanover, Londonderry, Berlin, Bedford).
registerScraper("civicplus", new CivicPlusScraper());

export interface ScrapeRunSummary {
  municipalities_scraped: number;
  total_found: number;
  total_new: number;
  total_updated: number;
  total_spam: number;
  total_errors: number;
  municipality_errors: number;
  per_muni: Array<{
    name: string;
    scraper_type: string;
    found: number;
    new: number;
    updated: number;
    spam: number;
    errors: number;
    error_message?: string;
  }>;
}

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function runAllScrapers(targetId?: string): Promise<ScrapeRunSummary> {
  const supabase = getSupabase();
  const qaStartedAt = new Date().toISOString();
  const { data: qaRun } = await supabase
    .from("qa_run_results")
    .insert({ layer: "scrape", status: "running", started_at: qaStartedAt })
    .select()
    .single();
  const qaRunId = qaRun?.id;

  console.log("[scraper] Starting scrape run...");

  let query = supabase.from("municipalities").select("*").eq("active", true);
  if (targetId) query = query.eq("id", targetId);

  const { data: municipalities, error } = await query;

  if (error || !municipalities?.length) {
    const msg = `No municipalities found: ${error?.message || "empty result"}`;
    console.error("[scraper]", msg);
    if (qaRunId) {
      await supabase
        .from("qa_run_results")
        .update({ status: "error", completed_at: new Date().toISOString(), message: msg })
        .eq("id", qaRunId);
    }
    throw new Error(msg);
  }

  console.log(`[scraper] Found ${municipalities.length} municipalities to scrape`);

  const summary: ScrapeRunSummary = {
    municipalities_scraped: municipalities.length,
    total_found: 0,
    total_new: 0,
    total_updated: 0,
    total_spam: 0,
    total_errors: 0,
    municipality_errors: 0,
    per_muni: [],
  };

  for (const muni of municipalities) {
    console.log(`\n[scraper] Scraping: ${muni.name} (${muni.scraper_type})`);

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

      if (!config.rfp_page_url) throw new Error("No RFP page URL configured");

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

      const status =
        errorCount > 0 && newCount + updatedCount === 0
          ? "error"
          : errorCount > 0
          ? "partial"
          : "success";

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

      await supabase
        .from("municipalities")
        .update({ last_scraped_at: new Date().toISOString() })
        .eq("id", muni.id);

      summary.total_found += scrapedRfps.length;
      summary.total_new += newCount;
      summary.total_updated += updatedCount;
      summary.total_spam += spamCount;
      summary.total_errors += errorCount;
      summary.per_muni.push({
        name: muni.name,
        scraper_type: muni.scraper_type,
        found: scrapedRfps.length,
        new: newCount,
        updated: updatedCount,
        spam: spamCount,
        errors: errorCount,
      });

      console.log(
        `[scraper] ${muni.name}: ${newCount} new, ${updatedCount} updated, ${spamCount} spam, ${errorCount} errors`
      );
    } catch (err) {
      console.error(`[scraper] Error scraping ${muni.name}:`, err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      summary.municipality_errors++;
      summary.per_muni.push({
        name: muni.name,
        scraper_type: muni.scraper_type,
        found: 0,
        new: 0,
        updated: 0,
        spam: 0,
        errors: 0,
        error_message: errorMessage,
      });

      if (logId) {
        await supabase
          .from("scrape_logs")
          .update({
            status: "error",
            completed_at: new Date().toISOString(),
            error_message: errorMessage,
          })
          .eq("id", logId);
      }
    }
  }

  const overallStatus =
    summary.municipality_errors >= municipalities.length
      ? "error"
      : summary.municipality_errors > 0 || summary.total_errors > 0
      ? "partial"
      : "success";

  if (qaRunId) {
    await supabase
      .from("qa_run_results")
      .update({
        status: overallStatus,
        completed_at: new Date().toISOString(),
        checked: summary.total_found,
        issues_found: summary.total_spam + summary.total_errors + summary.municipality_errors,
        auto_fixed: summary.total_updated,
        message: `${summary.total_new} new, ${summary.total_updated} updated, ${summary.total_spam} spam, ${summary.municipality_errors}/${municipalities.length} towns errored`,
        details: summary,
      })
      .eq("id", qaRunId);
  }

  console.log("\n[scraper] Scrape run complete.");
  return summary;
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  const targetId = process.argv[2];
  runAllScrapers(targetId).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
