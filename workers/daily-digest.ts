import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Lazy-init: module-level `createClient` fails during `next build`
// because SUPABASE_SERVICE_ROLE_KEY isn't a build-time env var.
let _supabase: SupabaseClient | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}
let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

interface AlertMatch {
  alertId: string;
  alertName: string;
  rfps: any[];
}

export interface DigestRunSummary {
  users_processed: number;
  emails_sent: number;
  emails_failed: number;
  total_rfps_sent: number;
}

export async function runDailyDigest(): Promise<DigestRunSummary> {
  const summary: DigestRunSummary = {
    users_processed: 0,
    emails_sent: 0,
    emails_failed: 0,
    total_rfps_sent: 0,
  };

  const supabase = getSupabase();
  const resend = getResend();

  const qaStartedAt = new Date().toISOString();
  const { data: qaRun } = await supabase
    .from("qa_run_results")
    .insert({ layer: "daily-digest", status: "running", started_at: qaStartedAt })
    .select()
    .single();
  const qaRunId = qaRun?.id;

  console.log("[digest] Starting daily digest...");

  const finish = async (status: "success" | "partial" | "error", message: string) => {
    if (!qaRunId) return;
    await supabase
      .from("qa_run_results")
      .update({
        status,
        completed_at: new Date().toISOString(),
        checked: summary.users_processed,
        issues_found: summary.emails_failed,
        auto_fixed: summary.emails_sent,
        message,
        details: summary,
      })
      .eq("id", qaRunId);
  };

  // Get all active daily alerts
  const { data: alerts, error } = await supabase
    .from("user_alerts")
    .select("*, profile:profiles(email, full_name, subscription_tier)")
    .eq("active", true)
    .eq("email_enabled", true)
    .eq("frequency", "daily");

  if (error || !alerts?.length) {
    console.log("[digest] No active daily alerts");
    await finish("success", "no active daily alerts");
    return summary;
  }

  console.log(`[digest] Processing ${alerts.length} alerts`);

  // Get RFPs posted in the last 24 hours
  const since = new Date();
  since.setDate(since.getDate() - 1);

  const { data: recentRfps } = await supabase
    .from("rfps")
    .select("*, municipality:municipalities(name)")
    .gte("created_at", since.toISOString())
    .eq("status", "open")
    .order("posted_date", { ascending: false });

  if (!recentRfps?.length) {
    console.log("[digest] No new RFPs in the last 24 hours");
    await finish("success", "no new RFPs in last 24h");
    return summary;
  }

  // Group alerts by user
  const userAlerts: Record<string, { profile: any; alerts: typeof alerts }> = {};

  for (const alert of alerts) {
    const profile = (alert as any).profile;
    if (!profile) continue;
    // Free tier is capped at 1 alert at creation time (see /api/signup/digest
    // and the dashboard save-alert flow). Any active alert a free user has is
    // therefore deliverable. Gate on the active flag, not on tier.

    if (!userAlerts[alert.user_id]) {
      userAlerts[alert.user_id] = { profile, alerts: [] };
    }
    userAlerts[alert.user_id].alerts.push(alert);
  }

  // Process each user
  for (const [userId, { profile, alerts: userAlertList }] of Object.entries(userAlerts)) {
    const alertMatches: AlertMatch[] = [];
    const allMatchedRfpIds = new Set<string>();

    // Check each alert for matching RFPs
    for (const alert of userAlertList) {
      const filters = alert.filters || {};
      let matchingRfps = [...recentRfps];

      if (filters.keywords?.length) {
        const keywords = filters.keywords.map((k: string) => k.toLowerCase());
        matchingRfps = matchingRfps.filter((rfp) => {
          const text = `${rfp.title} ${rfp.description || ""} ${rfp.category || ""}`.toLowerCase();
          return keywords.some((kw: string) => text.includes(kw));
        });
      }

      if (filters.categories?.length) {
        matchingRfps = matchingRfps.filter(
          (rfp) => rfp.category && filters.categories.includes(rfp.category)
        );
      }

      if (filters.municipalities?.length) {
        matchingRfps = matchingRfps.filter((rfp) =>
          filters.municipalities.includes(rfp.municipality_id)
        );
      }

      if (filters.status?.length) {
        matchingRfps = matchingRfps.filter((rfp) =>
          filters.status.includes(rfp.status)
        );
      }

      if (matchingRfps.length > 0) {
        alertMatches.push({
          alertId: alert.id,
          alertName: alert.name,
          rfps: matchingRfps.slice(0, 10), // Cap at 10 per alert
        });
        matchingRfps.forEach((r) => allMatchedRfpIds.add(r.id));
      }
    }

    if (alertMatches.length === 0) continue;

    // Build consolidated email with sections per alert
    const totalRfps = alertMatches.reduce((sum, a) => sum + a.rfps.length, 0);

    const alertSectionsHtml = alertMatches
      .map((match) => {
        const rfpRowsHtml = match.rfps
          .map(
            (rfp) => `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f3f4;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/rfp/${rfp.id}" style="color: #245524; font-weight: 600; text-decoration: none; font-size: 14px;">
                  ${rfp.title}
                </a>
                <div style="color: #868e96; font-size: 12px; margin-top: 3px;">
                  ${(rfp as any).municipality?.name || "Unknown"}${rfp.category ? ` · ${rfp.category}` : ""}${rfp.deadline_date ? ` · Due: ${new Date(rfp.deadline_date).toLocaleDateString()}` : ""}
                </div>
              </td>
            </tr>`
          )
          .join("");

        return `
          <div style="margin-bottom: 24px;">
            <div style="background: #f8f9fa; padding: 10px 14px; border-left: 3px solid #245524; margin-bottom: 8px;">
              <span style="font-size: 13px; font-weight: 600; color: #343a40;">${match.alertName}</span>
              <span style="font-size: 12px; color: #868e96; margin-left: 8px;">${match.rfps.length} new</span>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              ${rfpRowsHtml}
            </table>
          </div>`;
      })
      .join("");

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #245524; padding: 20px 24px;">
          <h1 style="color: white; font-size: 18px; margin: 0;">RFP Harvest</h1>
        </div>
        <div style="padding: 24px;">
          <p style="color: #343a40; font-size: 15px; margin: 0 0 8px 0;">
            Hi ${profile.full_name || "there"},
          </p>
          <p style="color: #495057; font-size: 14px; margin: 0 0 20px 0;">
            ${totalRfps} new RFP${totalRfps !== 1 ? "s" : ""} matched ${alertMatches.length} of your saved alert${alertMatches.length !== 1 ? "s" : ""}:
          </p>
          ${alertSectionsHtml}
          <div style="margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #245524; color: white; padding: 10px 20px; text-decoration: none; font-size: 14px; font-weight: 600;">
              View all RFPs
            </a>
          </div>
        </div>
        <div style="padding: 16px 24px; border-top: 1px solid #e9ecef; color: #adb5bd; font-size: 12px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #868e96;">Manage your alerts</a>
        </div>
      </div>
    `;

    // Build subject line
    const subject = alertMatches.length === 1
      ? `${alertMatches[0].rfps.length} new RFP${alertMatches[0].rfps.length !== 1 ? "s" : ""} — ${alertMatches[0].alertName}`
      : `${totalRfps} new RFPs matching ${alertMatches.length} alerts`;

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "RFP Harvest <alerts@rfpharvest.com>",
        to: profile.email,
        subject,
        html: emailHtml,
      });

      // Log notification for each alert
      for (const match of alertMatches) {
        await supabase.from("notification_history").insert({
          user_id: userId,
          alert_id: match.alertId,
          rfp_ids: match.rfps.map((r) => r.id),
          email_sent_at: new Date().toISOString(),
          email_status: "sent",
        });

        await supabase
          .from("user_alerts")
          .update({ last_notified_at: new Date().toISOString() })
          .eq("id", match.alertId);
      }

      summary.emails_sent++;
      summary.total_rfps_sent += totalRfps;
      console.log(`[digest] Sent ${totalRfps} RFPs (${alertMatches.length} alerts) to ${profile.email}`);
    } catch (err) {
      console.error(`[digest] Error sending to ${profile.email}:`, err);
      summary.emails_failed++;

      for (const match of alertMatches) {
        await supabase.from("notification_history").insert({
          user_id: userId,
          alert_id: match.alertId,
          rfp_ids: match.rfps.map((r) => r.id),
          email_status: "failed",
        });
      }
    }
    summary.users_processed++;
  }

  const status = summary.emails_failed === 0 ? "success" : summary.emails_sent === 0 ? "error" : "partial";
  await finish(
    status,
    `${summary.emails_sent} sent, ${summary.emails_failed} failed, ${summary.total_rfps_sent} RFPs delivered`
  );
  console.log("[digest] Daily digest complete.");
  return summary;
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  runDailyDigest().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
