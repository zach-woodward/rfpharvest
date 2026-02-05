import { createServiceSupabase } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import {
  Activity,
  Users,
  FileText,
  MapPin,
  AlertCircle,
  Clock,
  Shield,
  RefreshCw,
  Mail,
} from "lucide-react";
import { ScrapeButton } from "./scrape-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createServiceSupabase();

  const now = new Date();
  const h72ago = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();
  const h48ago = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const d7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: rfpCount },
    { count: openRfpCount },
    { count: userCount },
    { count: payingUserCount },
    { count: muniCount },
    { data: municipalities },
    { data: recentLogs },
    { data: recentErrors },
    { data: recentSignups },
    { data: recentAlerts },
    { count: totalAlertCount },
    { count: totalNotificationCount },
    { count: recentNewRfpCount },
    { data: lastScrapeLog },
    { data: lastDigestLog },
  ] = await Promise.all([
    supabase.from("rfps").select("*", { count: "exact", head: true }),
    supabase.from("rfps").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("subscription_tier", ["pro", "enterprise"]),
    supabase.from("municipalities").select("*", { count: "exact", head: true }).eq("active", true),
    supabase
      .from("municipalities")
      .select("*")
      .eq("active", true)
      .order("last_scraped_at", { ascending: true, nullsFirst: true }),
    supabase
      .from("scrape_logs")
      .select("*, municipality:municipalities(name)")
      .order("started_at", { ascending: false })
      .limit(10),
    supabase
      .from("scrape_logs")
      .select("*, municipality:municipalities(name)")
      .eq("status", "error")
      .order("started_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("user_alerts")
      .select("id, name, user_id, created_at, profiles(email)")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("user_alerts").select("*", { count: "exact", head: true }),
    supabase.from("notification_history").select("*", { count: "exact", head: true }),
    supabase
      .from("rfps")
      .select("*", { count: "exact", head: true })
      .gte("created_at", d7ago),
    // Last scrape run (any municipality)
    supabase
      .from("scrape_logs")
      .select("started_at, completed_at, status")
      .order("started_at", { ascending: false })
      .limit(1)
      .single(),
    // Last digest run (from notification_history)
    supabase
      .from("notification_history")
      .select("email_sent_at")
      .order("email_sent_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  // Compute stale municipalities (active, last_scraped_at > 48hrs ago or null)
  const staleMunis = (municipalities || []).filter((m: any) => {
    if (!m.last_scraped_at) return true;
    return new Date(m.last_scraped_at) < new Date(h48ago);
  });

  // Warning conditions
  const hasStaleWarning = (municipalities || []).some((m: any) => {
    if (!m.last_scraped_at) return true;
    return new Date(m.last_scraped_at) < new Date(h72ago);
  });
  const hasRecentErrors = (recentErrors?.length || 0) > 0;
  const noNewRfps = (recentNewRfpCount || 0) === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
        <ScrapeButton />
      </div>

      {/* Warning Banner */}
      {(hasStaleWarning || hasRecentErrors || noNewRfps) && (
        <div className="mb-6 space-y-2">
          {hasStaleWarning && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>One or more municipalities have not been scraped in 72+ hours.</span>
            </div>
          )}
          {hasRecentErrors && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Recent scrape errors detected. Check logs for details.</span>
            </div>
          )}
          {noNewRfps && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Zero new RFPs found across all municipalities in the last 7 days.</span>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard icon={<FileText className="w-5 h-5" />} label="Total RFPs" value={rfpCount || 0} />
        <StatCard icon={<Activity className="w-5 h-5" />} label="Open RFPs" value={openRfpCount || 0} />
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Users" value={userCount || 0} />
        <StatCard icon={<Shield className="w-5 h-5" />} label="Pro/Enterprise" value={payingUserCount || 0} />
        <StatCard icon={<MapPin className="w-5 h-5" />} label="Active Municipalities" value={muniCount || 0} />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Stale Municipalities"
          value={staleMunis.length}
          alert={staleMunis.length > 0}
        />
      </div>

      {/* System Status */}
      <section className="bg-white border border-slate-200 mb-8">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Scheduled Jobs</h2>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-forest-50 border border-forest-200 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-forest-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">RFP Scraper</div>
                <div className="text-xs text-slate-500">Every 6 hours (12am, 6am, 12pm, 6pm ET)</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Last run</div>
              <div className="text-sm text-slate-700">
                {lastScrapeLog?.started_at ? (
                  <span title={new Date(lastScrapeLog.started_at).toLocaleString()}>
                    {formatRelativeTime(lastScrapeLog.started_at)}
                  </span>
                ) : (
                  <span className="text-slate-400">Never</span>
                )}
              </div>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 border border-blue-200 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">Daily Email Digest</div>
                <div className="text-xs text-slate-500">7:00 AM ET daily</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Last sent</div>
              <div className="text-sm text-slate-700">
                {lastDigestLog?.email_sent_at ? (
                  <span title={new Date(lastDigestLog.email_sent_at).toLocaleString()}>
                    {formatRelativeTime(lastDigestLog.email_sent_at)}
                  </span>
                ) : (
                  <span className="text-slate-400">Never</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <div className="flex gap-4 mb-8">
        <Link
          href="/admin/scrapers"
          className="text-sm font-medium text-forest-600 hover:text-forest-700"
        >
          Manage scrapers
        </Link>
        <Link
          href="/admin/users"
          className="text-sm font-medium text-forest-600 hover:text-forest-700"
        >
          View users
        </Link>
        <Link
          href="/admin/logs"
          className="text-sm font-medium text-forest-600 hover:text-forest-700"
        >
          View all logs
        </Link>
        <Link
          href="/admin/requests"
          className="text-sm font-medium text-forest-600 hover:text-forest-700"
        >
          Town requests
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent User Activity */}
        <section className="bg-white border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent Signups</h2>
            <div className="text-xs text-slate-500">
              {totalAlertCount || 0} alerts &middot; {totalNotificationCount || 0} notifications sent
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {recentSignups?.map((user: any) => (
              <div key={user.id} className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-900">
                    {user.full_name || user.email}
                  </span>
                  {user.full_name && (
                    <div className="text-xs text-slate-500">{user.email}</div>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {formatDateTime(user.created_at)}
                </span>
              </div>
            ))}
            {!recentSignups?.length && (
              <div className="px-4 py-6 text-center text-sm text-slate-500">No users yet.</div>
            )}
          </div>
        </section>

        {/* Recent Alerts Created */}
        <section className="bg-white border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Recent Alerts Created</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentAlerts?.map((alert: any) => (
              <div key={alert.id} className="px-4 py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-900">{alert.name}</span>
                  <div className="text-xs text-slate-500">
                    {(alert.profiles as any)?.email || "Unknown user"}
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {formatDateTime(alert.created_at)}
                </span>
              </div>
            ))}
            {!recentAlerts?.length && (
              <div className="px-4 py-6 text-center text-sm text-slate-500">No alerts yet.</div>
            )}
          </div>
        </section>
      </div>

      {/* Recent scrape logs */}
      <section className="bg-white border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Recent Scrape Logs</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentLogs?.map((log: any) => (
            <div key={log.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-slate-900">
                  {log.municipality?.name || "Unknown"}
                </span>
                <div className="text-xs text-slate-500 mt-0.5">
                  {new Date(log.started_at).toLocaleString()} — {log.rfps_found || 0} found,{" "}
                  {log.rfps_new || 0} new
                </div>
              </div>
              <LogStatusBadge status={log.status} />
            </div>
          ))}
          {!recentLogs?.length && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No scrape logs yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 p-4">
      <div className={`mb-2 ${alert ? "text-red-500" : "text-slate-400"}`}>{icon}</div>
      <div className={`text-2xl font-bold ${alert ? "text-red-600" : "text-slate-900"}`}>
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function LogStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: "bg-green-50 text-green-700 border-green-200",
    running: "bg-blue-50 text-blue-700 border-blue-200",
    partial: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 border ${styles[status] || styles.error}`}>
      {status}
    </span>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}
