import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { getScraper } from "@/lib/scraper";
import type { ScraperConfig } from "@/lib/scraper";

// POST /api/scrape — trigger a scrape run (secured by CRON_SECRET)
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") || request.headers.get("x-cron-secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const municipalityId = body.municipality_id;

  const supabase = createServiceSupabase();

  // Get active municipalities
  let query = supabase.from("municipalities").select("*").eq("active", true);
  if (municipalityId) {
    query = query.eq("id", municipalityId);
  }

  const { data: municipalities, error } = await query;

  if (error || !municipalities?.length) {
    return NextResponse.json(
      { error: "No municipalities found", details: error },
      { status: 404 }
    );
  }

  // Return response immediately, run scraping in background
  const responseData = {
    message: `Scrape initiated for ${municipalities.length} municipalities`,
    municipalities: municipalities.map((m) => m.name),
  };

  // Fire off the scraping work without awaiting (runs in background)
  runScrapes(municipalities).catch((err) =>
    console.error("[scrape] Background scrape error:", err)
  );

  return NextResponse.json(responseData);
}

async function runScrapes(municipalities: any[]) {
  const supabase = createServiceSupabase();

  for (const muni of municipalities) {
    console.log(`[scrape] Scraping: ${muni.name} (${muni.scraper_type})`);

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
        ...((muni.scraper_config as object) || {}),
      };

      if (!config.rfp_page_url) {
        throw new Error("No RFP page URL configured");
      }

      const scrapedRfps = await scraper.scrape(config);
      console.log(`[scrape] Found ${scrapedRfps.length} RFPs from ${muni.name}`);

      let newCount = 0;
      let updatedCount = 0;

      for (const rfp of scrapedRfps) {
        const record = {
          municipality_id: muni.id,
          title: rfp.title,
          description: rfp.description || null,
          category: rfp.category || null,
          status: normalizeStatus(rfp.status),
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
          // No source_url — insert (may create dups)
          await supabase.from("rfps").insert(record);
          newCount++;
        }
      }

      // Update log to success
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

      console.log(`[scrape] ${muni.name}: ${newCount} new, ${updatedCount} updated`);
    } catch (error) {
      console.error(`[scrape] Error scraping ${muni.name}:`, error);

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

    // Small delay between municipalities to be polite
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("[scrape] Scrape run complete.");
}

function normalizeStatus(raw?: string): "open" | "closed" | "awarded" | "cancelled" {
  if (!raw) return "open";
  const s = raw.toLowerCase().trim();
  if (s.includes("closed") || s.includes("no longer accepting")) return "closed";
  if (s.includes("awarded") || s.includes("under review")) return "awarded";
  if (s.includes("cancelled") || s.includes("canceled")) return "cancelled";
  return "open";
}
