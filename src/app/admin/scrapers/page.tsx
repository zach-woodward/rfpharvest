import { createServiceSupabase } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import type { Municipality } from "@/types/database";
import { ScrapeButton } from "../scrape-button";
import {
  getPlatformInfo,
  accessibilityStyles,
} from "@/lib/scraper/platform-metadata";

export const dynamic = "force-dynamic";

async function checkFlareSolverr(): Promise<{
  online: boolean;
  version?: string;
  error?: string;
}> {
  const url = process.env.FLARESOLVERR_URL || "http://flaresolverr:8191";
  try {
    const res = await fetch(`${url}/health`, { next: { revalidate: 0 } });
    if (res.ok) {
      return { online: true };
    }
    const res2 = await fetch(`${url}/v1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: "sessions.list" }),
    });
    const data = await res2.json();
    return { online: true, version: data.version || "unknown" };
  } catch (e: any) {
    return { online: false, error: e.message || "Connection refused" };
  }
}

export default async function ScrapersPage() {
  const supabase = createServiceSupabase();
  const flareSolverr = await checkFlareSolverr();

  const now = new Date();
  const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const h72ago = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();

  const [{ data: municipalities }, { data: rfps }, { data: latestLogs }] =
    await Promise.all([
      supabase
        .from("municipalities")
        .select("*")
        .order("state")
        .order("name"),
      supabase.from("rfps").select("municipality_id"),
      supabase
        .from("scrape_logs")
        .select(
          "municipality_id, status, started_at, completed_at, rfps_found, rfps_new, error_message"
        )
        .order("started_at", { ascending: false }),
    ]);

  // Build RFP count map
  const rfpCountMap: Record<string, number> = {};
  (rfps || []).forEach((r: any) => {
    rfpCountMap[r.municipality_id] = (rfpCountMap[r.municipality_id] || 0) + 1;
  });

  // Get latest log per municipality
  const latestLogMap: Record<string, any> = {};
  (latestLogs || []).forEach((log: any) => {
    if (log.municipality_id && !latestLogMap[log.municipality_id]) {
      latestLogMap[log.municipality_id] = log;
    }
  });

  function getFreshness(
    lastScrapedAt: string | null
  ): "green" | "yellow" | "red" {
    if (!lastScrapedAt) return "red";
    if (lastScrapedAt >= h24ago) return "green";
    if (lastScrapedAt >= h72ago) return "yellow";
    return "red";
  }

  const freshnessConfig = {
    green: {
      label: "Fresh",
      cls: "bg-green-50 text-green-700 border-green-200",
    },
    yellow: {
      label: "Aging",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    red: { label: "Stale", cls: "bg-red-50 text-red-600 border-red-200" },
  };

  const statusStyles: Record<string, string> = {
    success: "bg-green-50 text-green-700 border-green-200",
    running: "bg-blue-50 text-blue-700 border-blue-200",
    partial: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-red-50 text-red-600 border-red-200",
  };

  const munis = (municipalities as Municipality[]) || [];

  // Counts by accessibility
  const accessCounts = { direct: 0, cloudflare: 0, portal: 0, unstructured: 0 };
  munis.forEach((m) => {
    const info = getPlatformInfo(m.name);
    accessCounts[info.accessibility]++;
  });

  // Count towns actually using FlareSolverr (has requires_js in config)
  const flareSolverrTowns = munis.filter(
    (m) => (m.scraper_config as any)?.requires_js === true
  );

  // Towns with issues (non-direct access and 0 RFPs)
  const townsNeedingAttention = munis.filter((m) => {
    const info = getPlatformInfo(m.name);
    const rfpTotal = rfpCountMap[m.id] || 0;
    return info.accessibility !== "direct" && rfpTotal === 0;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">
          Scrapers & Data Pipeline
        </h1>
        <ScrapeButton />
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-green-50 border border-green-200 p-3">
          <div className="text-2xl font-bold text-green-700">
            {accessCounts.direct}
          </div>
          <div className="text-xs text-green-600">Direct Scrape</div>
        </div>
        <div className="bg-red-50 border border-red-200 p-3">
          <div className="text-2xl font-bold text-red-600">
            {accessCounts.cloudflare}
          </div>
          <div className="text-xs text-red-500">Cloudflare (via FlareSolverr)</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-3">
          <div className="text-2xl font-bold text-purple-700">
            {accessCounts.portal}
          </div>
          <div className="text-xs text-purple-600">External Portal</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-3">
          <div className="text-2xl font-bold text-amber-700">
            {accessCounts.unstructured}
          </div>
          <div className="text-xs text-amber-600">Unstructured</div>
        </div>
        <div
          className={`border p-3 ${
            flareSolverr.online
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                flareSolverr.online ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span
              className={`text-sm font-bold ${
                flareSolverr.online ? "text-green-700" : "text-red-600"
              }`}
            >
              {flareSolverr.online ? "Online" : "Offline"}
            </span>
          </div>
          <div className="text-xs text-slate-600 mt-1">
            FlareSolverr &middot; {flareSolverrTowns.length} towns routed
          </div>
        </div>
      </div>

      {/* Attention needed */}
      {townsNeedingAttention.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 mb-6">
          <div className="text-sm font-medium text-amber-900 mb-1">
            {townsNeedingAttention.length} town{townsNeedingAttention.length > 1 ? "s" : ""} with 0 RFPs need attention
          </div>
          <div className="text-xs text-amber-700">
            {townsNeedingAttention.map((m) => m.name).join(", ")} — see suggested fixes below
          </div>
        </div>
      )}

      {/* Municipality Table */}
      <div className="bg-white border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                Municipality
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                Access
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                RFPs
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">
                Last Scraped
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">
                Suggested Fix
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {munis.map((muni) => {
              const freshness = getFreshness(muni.last_scraped_at);
              const fc = freshnessConfig[freshness];
              const latestLog = latestLogMap[muni.id];
              const rfpTotal = rfpCountMap[muni.id] || 0;
              const platformInfo = getPlatformInfo(muni.name);
              const accessStyle =
                accessibilityStyles[platformInfo.accessibility];
              const hasIssue =
                platformInfo.accessibility !== "direct" && rfpTotal === 0;
              const usesFlare = (muni.scraper_config as any)?.requires_js === true;

              return (
                <tr
                  key={muni.id}
                  className={hasIssue ? "bg-red-50/30 hover:bg-red-50/50" : "hover:bg-slate-50"}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {muni.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {platformInfo.platform}
                      {usesFlare && (
                        <span className="text-blue-600 ml-1">&middot; FlareSolverr</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 border ${accessStyle.cls}`}
                      title={platformInfo.notes}
                    >
                      {platformInfo.accessibilityLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-medium ${
                        rfpTotal === 0 ? "text-red-500" : "text-slate-900"
                      }`}
                    >
                      {rfpTotal}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {latestLog ? (
                      <div>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 border ${
                            statusStyles[latestLog.status] || statusStyles.error
                          }`}
                        >
                          {latestLog.status}
                        </span>
                        {latestLog.status === "error" &&
                          latestLog.error_message && (
                            <div
                              className="text-xs text-red-500 mt-1 max-w-[200px] truncate"
                              title={latestLog.error_message}
                            >
                              {latestLog.error_message}
                            </div>
                          )}
                      </div>
                    ) : (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 border ${fc.cls}`}
                      >
                        {fc.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                    {muni.last_scraped_at
                      ? formatDateTime(muni.last_scraped_at)
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {platformInfo.suggestedFix ? (
                      <div className="text-xs text-slate-600 max-w-[250px]">
                        {platformInfo.suggestedFix}
                      </div>
                    ) : rfpTotal === 0 && !muni.rfp_page_url ? (
                      <div className="text-xs text-red-500">
                        Configure RFP page URL
                      </div>
                    ) : rfpTotal > 0 ? (
                      <span className="text-xs text-green-600">Working</span>
                    ) : (
                      <span className="text-xs text-slate-400">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {muni.active && <ScrapeButton municipalityId={muni.id} />}
                      {!muni.active && (
                        <span className="text-xs text-slate-400">Inactive</span>
                      )}
                      {muni.rfp_page_url && (
                        <a
                          href={muni.rfp_page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-forest-600 hover:underline"
                        >
                          URL
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pipeline Notes */}
      <div className="mt-6 bg-slate-50 border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Pipeline Notes
        </h2>
        <ul className="text-xs text-slate-600 space-y-1">
          <li>
            <strong>Direct scrape:</strong> HTML fetched and parsed with cheerio.
            Runs every 6 hours via cron.
          </li>
          <li>
            <strong>Cloudflare blocked:</strong> Routed through FlareSolverr
            (Docker sidecar) which uses a headless browser to bypass challenges.{" "}
            {flareSolverr.online
              ? `Online — ${flareSolverrTowns.length} towns configured.`
              : "Offline — these towns will fail to scrape."}
          </li>
          <li>
            <strong>External portal:</strong> RFPs hosted on third-party
            procurement platform. Requires credentials or API access.
          </li>
          <li>
            <strong>Unstructured:</strong> RFPs posted as free-form HTML content
            without consistent structure. Extraction is best-effort.
          </li>
        </ul>
      </div>
    </div>
  );
}
