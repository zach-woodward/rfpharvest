import { createClient } from "@supabase/supabase-js";
import { getScraper, registerScraper } from "./lib/scraper-registry";
import { ConcordNhScraper } from "./adapters/concord-nh";
import type { ScraperConfig, ScrapedRfp } from "./lib/types";

// Register municipality-specific scrapers
registerScraper("concord-nh", new ConcordNhScraper());

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

      for (const rfp of scrapedRfps) {
        const record = {
          municipality_id: muni.id,
          title: rfp.title,
          description: rfp.description || null,
          category: rfp.category || null,
          status: "open" as const,
          posted_date: rfp.posted_date || null,
          deadline_date: rfp.deadline_date || null,
          pre_bid_date: rfp.pre_bid_date || null,
          qa_deadline: rfp.qa_deadline || null,
          source_url: rfp.source_url || null,
          document_urls: rfp.document_urls || [],
          contact_name: rfp.contact_name || null,
          contact_email: rfp.contact_email || null,
          contact_phone: rfp.contact_phone || null,
          estimated_value: rfp.estimated_value || null,
          requires_signup: rfp.requires_signup || false,
          raw_data: rfp.raw_data || {},
          scraped_at: new Date().toISOString(),
        };

        // Upsert by source_url (dedup)
        if (record.source_url) {
          const { data: existing } = await supabase
            .from("rfps")
            .select("id")
            .eq("source_url", record.source_url)
            .single();

          if (existing) {
            await supabase.from("rfps").update(record).eq("id", existing.id);
            updatedCount++;
          } else {
            await supabase.from("rfps").insert(record);
            newCount++;
          }
        } else {
          // No source_url — insert and hope for no dups
          await supabase.from("rfps").insert(record);
          newCount++;
        }
      }

      // Update log
      if (logId) {
        await supabase
          .from("scrape_logs")
          .update({
            status: "success",
            completed_at: new Date().toISOString(),
            rfps_found: scrapedRfps.length,
            rfps_new: newCount,
            rfps_updated: updatedCount,
          })
          .eq("id", logId);
      }

      // Update municipality last scraped
      await supabase
        .from("municipalities")
        .update({ last_scraped_at: new Date().toISOString() })
        .eq("id", muni.id);

      console.log(`[scraper] ${muni.name}: ${newCount} new, ${updatedCount} updated`);
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
