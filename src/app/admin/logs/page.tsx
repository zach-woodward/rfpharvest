import { createServiceSupabase } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { LogFilters } from "./log-filters";

export const dynamic = "force-dynamic";

export default async function LogsPage({
  searchParams,
}: {
  searchParams: { status?: string; municipality?: string; page?: string };
}) {
  const supabase = createServiceSupabase();
  const perPage = 50;
  const currentPage = Math.max(1, parseInt(searchParams.page || "1", 10));
  const from = (currentPage - 1) * perPage;

  let query = supabase
    .from("scrape_logs")
    .select("*, municipality:municipalities(name)", { count: "exact" })
    .order("started_at", { ascending: false })
    .range(from, from + perPage - 1);

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  if (searchParams.municipality) {
    query = query.eq("municipality_id", searchParams.municipality);
  }

  const [{ data: logs, count }, { data: municipalities }] = await Promise.all([
    query,
    supabase
      .from("municipalities")
      .select("id, name")
      .order("name"),
  ]);

  const totalLogs = count || 0;
  const totalPages = Math.ceil(totalLogs / perPage);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Scrape Logs</h1>
        <span className="text-sm text-slate-500">
          {totalLogs} total log{totalLogs !== 1 ? "s" : ""}
        </span>
      </div>

      <LogFilters
        municipalities={municipalities || []}
        currentStatus={searchParams.status}
        currentMunicipality={searchParams.municipality}
      />

      <div className="bg-white border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                Municipality
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden sm:table-cell">
                Found / New
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">
                Started
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">
                Duration
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">
                Error
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs?.map((log: any) => {
              const duration = getDuration(log.started_at, log.completed_at);
              const isError = log.status === "error";

              return (
                <tr
                  key={log.id}
                  className={`hover:bg-slate-50 ${isError ? "bg-red-50/30" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {log.municipality?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <LogStatusBadge status={log.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                    {log.rfps_found ?? 0} / {log.rfps_new ?? 0}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                    {formatDateTime(log.started_at)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                    {duration}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell max-w-xs">
                    {log.error_message && (
                      <details>
                        <summary className="text-xs text-red-600 cursor-pointer truncate">
                          {log.error_message.slice(0, 60)}
                          {log.error_message.length > 60 ? "..." : ""}
                        </summary>
                        <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                          {log.error_message}
                        </pre>
                      </details>
                    )}
                  </td>
                </tr>
              );
            })}
            {!logs?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  No logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <LogPagination
          currentPage={currentPage}
          totalPages={totalPages}
          searchParams={searchParams}
        />
      )}
    </div>
  );
}

function LogPagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: { status?: string; municipality?: string; page?: string };
}) {
  function buildUrl(page: number) {
    const params = new URLSearchParams();
    if (searchParams.status) params.set("status", searchParams.status);
    if (searchParams.municipality) params.set("municipality", searchParams.municipality);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return `/admin/logs${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-slate-500">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex gap-2">
        {currentPage > 1 && (
          <a
            href={buildUrl(currentPage - 1)}
            className="text-sm px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Previous
          </a>
        )}
        {currentPage < totalPages && (
          <a
            href={buildUrl(currentPage + 1)}
            className="text-sm px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Next
          </a>
        )}
      </div>
    </div>
  );
}

function getDuration(started: string | null, completed: string | null): string {
  if (!started || !completed) return "—";
  const ms = new Date(completed).getTime() - new Date(started).getTime();
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
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
