import { NextRequest, NextResponse } from "next/server";
import { runAllScrapers } from "@/lib/scraper/runner";

// POST /api/scrape — trigger a scrape run (secured by CRON_SECRET)
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") || request.headers.get("x-cron-secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const municipalityId = body.municipality_id as string | undefined;

  // Fire and forget — the runner writes its own qa_run_results row
  // so progress is visible on the admin dashboard.
  runAllScrapers(municipalityId).catch((err) =>
    console.error("[scrape] Background scrape error:", err)
  );

  return NextResponse.json({
    message: `Scrape initiated${municipalityId ? ` for municipality ${municipalityId}` : ""}`,
  });
}
