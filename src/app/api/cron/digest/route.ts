import { NextRequest, NextResponse } from "next/server";
import { runDailyDigest } from "../../../../../workers/daily-digest";

// POST /api/cron/digest — run the daily alert digest.
// Secured by CRON_SECRET, same as /api/scrape.
export async function POST(request: NextRequest) {
  const secret =
    new URL(request.url).searchParams.get("secret") ||
    request.headers.get("x-cron-secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fire-and-forget so the request returns immediately. The worker writes
  // its own qa_run_results row, so progress is observable from /admin.
  runDailyDigest().catch((err) => console.error("[cron/digest] error:", err));

  return NextResponse.json({ message: "Digest initiated" });
}
