import { createServiceSupabase } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { MessageSquare, MapPin, Mail, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const supabase = createServiceSupabase();

  const { data: requests } = await supabase
    .from("town_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const allRequests = requests || [];
  const totalCount = allRequests.length;

  // Group by town_name + state, count requests per town
  const townMap = new Map<
    string,
    {
      town_name: string;
      state: string;
      count: number;
      emails: string[];
      latestNotes: string | null;
      latestDate: string;
      status: string;
    }
  >();

  for (const req of allRequests) {
    const key = `${req.town_name.toLowerCase()}|${req.state}`;
    const existing = townMap.get(key);
    if (existing) {
      existing.count++;
      if (req.email) existing.emails.push(req.email);
      if (req.notes && !existing.latestNotes) existing.latestNotes = req.notes;
      if (req.created_at > existing.latestDate) existing.latestDate = req.created_at;
    } else {
      townMap.set(key, {
        town_name: req.town_name,
        state: req.state,
        count: 1,
        emails: req.email ? [req.email] : [],
        latestNotes: req.notes || null,
        latestDate: req.created_at,
        status: req.status,
      });
    }
  }

  // Sort by request count descending
  const grouped = Array.from(townMap.values()).sort((a, b) => b.count - a.count);
  const uniqueTowns = grouped.length;

  const statusStyles: Record<string, string> = {
    pending: "bg-slate-50 text-slate-600 border-slate-200",
    planned: "bg-blue-50 text-blue-700 border-blue-200",
    live: "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">Town Requests</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 p-4">
          <div className="text-slate-400 mb-2">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
          <div className="text-xs text-slate-500 mt-1">Total requests</div>
        </div>
        <div className="bg-white border border-slate-200 p-4">
          <div className="text-slate-400 mb-2">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{uniqueTowns}</div>
          <div className="text-xs text-slate-500 mt-1">Unique towns</div>
        </div>
        <div className="bg-white border border-slate-200 p-4">
          <div className="text-slate-400 mb-2">
            <Mail className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {grouped.reduce((sum, g) => sum + g.emails.length, 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">With email</div>
        </div>
      </div>

      {/* Requests table grouped by town */}
      <section className="bg-white border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">
            Requests by demand
          </h2>
        </div>

        {grouped.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            No town requests yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Town
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    State
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Requests
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">
                    Emails
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">
                    Latest notes
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs uppercase tracking-wider hidden sm:table-cell">
                    Latest
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-slate-500 text-xs uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grouped.map((town) => (
                  <tr key={`${town.town_name}|${town.state}`} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      {town.town_name}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{town.state}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-semibold text-slate-900">
                        {town.count}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      {town.emails.length > 0 ? (
                        <span className="text-xs text-slate-600">
                          {town.emails.slice(0, 2).join(", ")}
                          {town.emails.length > 2 && ` +${town.emails.length - 2}`}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      {town.latestNotes ? (
                        <span className="text-xs text-slate-600 line-clamp-1">
                          {town.latestNotes}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className="text-xs text-slate-500">
                        {formatDateTime(town.latestDate)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 border ${
                          statusStyles[town.status] || statusStyles.pending
                        }`}
                      >
                        {town.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
