"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STATUSES = ["success", "error", "partial", "running"] as const;

export function LogFilters({
  municipalities,
  currentStatus,
  currentMunicipality,
}: {
  municipalities: { id: string; name: string }[];
  currentStatus?: string;
  currentMunicipality?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset to page 1 on filter change
    router.push(`/admin/logs?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <select
        value={currentStatus || ""}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="text-sm border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-forest-500"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={currentMunicipality || ""}
        onChange={(e) => updateFilter("municipality", e.target.value)}
        className="text-sm border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-forest-500"
      >
        <option value="">All municipalities</option>
        {municipalities.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      {(currentStatus || currentMunicipality) && (
        <button
          onClick={() => router.push("/admin/logs")}
          className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
