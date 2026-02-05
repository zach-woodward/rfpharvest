"use client";

import { Search, SlidersHorizontal, X, Bell } from "lucide-react";
import { useState } from "react";
import { RFP_CATEGORIES } from "@/lib/utils";
import type { Municipality } from "@/types/database";

interface RfpFiltersProps {
  municipalities: Pick<Municipality, "id" | "name" | "state">[];
  comingSoon?: Pick<Municipality, "id" | "name" | "state">[];
  categories: string[];
  filters: {
    search: string;
    categories: string[];
    municipalities: string[];
    status: string[];
    sortBy: string;
  };
  onFiltersChange: (filters: RfpFiltersProps["filters"]) => void;
  onSaveAsAlert?: () => void;
  canSaveAlert?: boolean;
  isAuthenticated?: boolean;
}

export default function RfpFilters({
  municipalities,
  comingSoon = [],
  categories,
  filters,
  onFiltersChange,
  onSaveAsAlert,
  canSaveAlert,
  isAuthenticated,
}: RfpFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilterCount =
    filters.categories.length +
    filters.municipalities.length +
    filters.status.length;

  function updateFilter<K extends keyof RfpFiltersProps["filters"]>(
    key: K,
    value: RfpFiltersProps["filters"][K]
  ) {
    onFiltersChange({ ...filters, [key]: value });
  }

  function toggleArrayFilter(
    key: "categories" | "municipalities" | "status",
    value: string
  ) {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, next);
  }

  function clearFilters() {
    onFiltersChange({
      search: "",
      categories: [],
      municipalities: [],
      status: [],
      sortBy: "posted_date",
    });
  }

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Search RFPs by keyword..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent bg-white"
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-2 border text-sm font-medium transition-colors ${
            showAdvanced || activeFilterCount > 0
              ? "border-forest-600 text-forest-700 bg-forest-50"
              : "border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-forest-600 text-white text-xs w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter("sortBy", e.target.value)}
          className="border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-500"
        >
          <option value="posted_date">Newest first</option>
          <option value="deadline_date">Deadline soonest</option>
        </select>
      </div>

      {/* Active filter pills */}
      {(activeFilterCount > 0 || filters.search) && (
        <div className="flex flex-wrap gap-1.5">
          {filters.search && (
            <FilterPill
              label={`Search: "${filters.search}"`}
              onRemove={() => updateFilter("search", "")}
            />
          )}
          {filters.categories.map((c) => (
            <FilterPill key={c} label={c} onRemove={() => toggleArrayFilter("categories", c)} />
          ))}
          {filters.municipalities.map((m) => {
            const muni = municipalities.find((mu) => mu.id === m);
            return (
              <FilterPill
                key={m}
                label={muni?.name || m}
                onRemove={() => toggleArrayFilter("municipalities", m)}
              />
            );
          })}
          {filters.status.map((s) => (
            <FilterPill key={s} label={s} onRemove={() => toggleArrayFilter("status", s)} />
          ))}
          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
          >
            Clear all
          </button>
          {onSaveAsAlert && isAuthenticated && canSaveAlert && (
            <button
              onClick={onSaveAsAlert}
              className="flex items-center gap-1 text-xs font-medium text-forest-600 hover:text-forest-700 px-2 py-1 ml-auto"
            >
              <Bell className="w-3 h-3" />
              Save as alert
            </button>
          )}
          {!isAuthenticated && (
            <a
              href="/auth/signup"
              className="flex items-center gap-1 text-xs font-medium text-forest-600 hover:text-forest-700 px-2 py-1 ml-auto"
            >
              <Bell className="w-3 h-3" />
              Sign up to save alerts
            </a>
          )}
          {isAuthenticated && !canSaveAlert && (
            <a
              href="/api/stripe/checkout"
              className="flex items-center gap-1 text-xs font-medium text-slate-400 px-2 py-1 ml-auto"
            >
              <Bell className="w-3 h-3" />
              Pro: Save as alert
            </a>
          )}
        </div>
      )}

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="border border-slate-200 bg-white p-4 space-y-4">
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {["open", "closed", "awarded"].map((s) => (
                <button
                  key={s}
                  onClick={() => toggleArrayFilter("status", s)}
                  className={`px-3 py-1 text-xs font-medium border transition-colors capitalize ${
                    filters.status.includes(s)
                      ? "border-forest-600 text-forest-700 bg-forest-50"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {(categories.length > 0 ? categories : [...RFP_CATEGORIES]).map((c) => (
                <button
                  key={c}
                  onClick={() => toggleArrayFilter("categories", c)}
                  className={`px-3 py-1 text-xs font-medium border transition-colors ${
                    filters.categories.includes(c)
                      ? "border-forest-600 text-forest-700 bg-forest-50"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Municipality */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Municipality
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {municipalities.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleArrayFilter("municipalities", m.id)}
                  className={`px-3 py-1 text-xs font-medium border transition-colors ${
                    filters.municipalities.includes(m.id)
                      ? "border-forest-600 text-forest-700 bg-forest-50"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {m.name}
                </button>
              ))}
              {comingSoon.length > 0 && (
                <>
                  <span className="w-full h-0" />
                  {comingSoon.map((m) => (
                    <span
                      key={m.id}
                      className="px-3 py-1 text-xs font-medium border border-dashed border-slate-200 text-slate-350 cursor-default select-none"
                      title={`${m.name} — coming soon`}
                      style={{ color: "#b0b8c4" }}
                    >
                      {m.name}
                    </span>
                  ))}
                </>
              )}
            </div>
            {comingSoon.length > 0 && (
              <p className="text-[11px] text-slate-400 mt-2">
                Grayed-out towns are coming soon.{" "}
                <a href="/request-town" className="text-forest-600 hover:underline">
                  Request a town
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-forest-50 border border-forest-200 text-forest-700 text-xs font-medium px-2 py-1">
      {label}
      <button onClick={onRemove} className="hover:text-forest-900">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
