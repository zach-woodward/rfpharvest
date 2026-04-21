import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/cron/mark-expired — freshness sweep.
// Transitions bids out of status='open' when:
//   (a) deadline_date has passed (~80% of rows have a deadline), OR
//   (b) we haven't re-seen the bid's source_url for 36+ hours, which
//       means the source site pulled it (likely awarded).
// Closed rows are still served from /rfp/[id] with a Closed badge,
// they just stop appearing in open-bid listings.
// Secured by CRON_SECRET.
export async function POST(request: NextRequest) {
  const secret =
    new URL(request.url).searchParams.get("secret") ||
    request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const startedAt = new Date().toISOString();
  const { data: qaRun } = await supabase
    .from("qa_run_results")
    .insert({ layer: "freshness", status: "running", started_at: startedAt })
    .select()
    .single();
  const qaRunId = qaRun?.id as string | undefined;

  const thirtySixHoursAgo = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // Pass 1: past-deadline → closed
  const pass1 = await supabase
    .from("rfps")
    .update({ status: "closed" })
    .eq("status", "open")
    .not("deadline_date", "is", null)
    .lt("deadline_date", now)
    .select("id");
  const pastDeadlineCount = pass1.data?.length || 0;
  const e1 = pass1.error;

  // Pass 2: stale scraped_at → closed (source pulled the listing)
  const pass2 = await supabase
    .from("rfps")
    .update({ status: "closed" })
    .eq("status", "open")
    .lt("scraped_at", thirtySixHoursAgo)
    .select("id");
  const staleCount = pass2.data?.length || 0;
  const e2 = pass2.error;

  const errored = (e1 ? 1 : 0) + (e2 ? 1 : 0);
  const totalClosed = pastDeadlineCount + staleCount;
  const message = `${pastDeadlineCount} past-deadline + ${staleCount} stale-source = ${totalClosed} closed`;

  if (qaRunId) {
    await supabase
      .from("qa_run_results")
      .update({
        status: errored > 0 ? "error" : "success",
        completed_at: new Date().toISOString(),
        checked: totalClosed,
        auto_fixed: totalClosed,
        issues_found: errored,
        message,
        details: {
          past_deadline_closed: pastDeadlineCount,
          stale_source_closed: staleCount,
          errors: [e1?.message, e2?.message].filter(Boolean),
        },
      })
      .eq("id", qaRunId);
  }

  return NextResponse.json({ message, past_deadline: pastDeadlineCount, stale: staleCount });
}
