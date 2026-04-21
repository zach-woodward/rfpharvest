import { NextRequest, NextResponse } from "next/server";
import { runSummarize } from "../../../../../workers/summarize";

// POST /api/cron/summarize — run one batch of AI summarization.
// Secured by CRON_SECRET.
export async function POST(request: NextRequest) {
  const secret =
    new URL(request.url).searchParams.get("secret") ||
    request.headers.get("x-cron-secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  runSummarize().catch((err) => console.error("[cron/summarize] error:", err));

  return NextResponse.json({ message: "Summarize initiated" });
}
