"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import RfpFilters from "@/components/dashboard/RfpFilters";
import RfpTable from "@/components/dashboard/RfpTable";
import Pagination from "@/components/dashboard/Pagination";
import type { Rfp, Municipality, Profile, AlertFilters, RfpStatus } from "@/types/database";

interface DashboardFilters {
  search: string;
  categories: string[];
  municipalities: string[];
  states: string[];
  status: string[];
  sortBy: string;
}

const defaultFilters: DashboardFilters = {
  search: "",
  categories: [],
  municipalities: [],
  states: [],
  status: [],
  sortBy: "posted_date",
};

export default function DashboardPage() {
  const supabase = createClient();
  const [rfps, setRfps] = useState<Rfp[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [municipalityList, setMunicipalityList] = useState<
    Pick<Municipality, "id" | "name" | "state">[]
  >([]);
  const [comingSoonList, setComingSoonList] = useState<
    Pick<Municipality, "id" | "name" | "state">[]
  >([]);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const perPage = 20;

  const isAuthenticated = !!profile;
  const isPro = profile?.subscription_tier === "pro" || profile?.subscription_tier === "enterprise";
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const canSaveAlert = isPro || (isAuthenticated && activeAlertCount < 1);

  // Load filter options and profile on mount
  useEffect(() => {
    async function loadFilterOptions() {
      const [muniRes, catRes, rfpMuniRes, userRes] = await Promise.all([
        supabase
          .from("municipalities")
          .select("id, name, state")
          .eq("active", true)
          .order("name"),
        supabase
          .from("rfps")
          .select("category")
          .not("category", "is", null),
        supabase
          .from("rfps")
          .select("municipality_id"),
        supabase.auth.getUser(),
      ]);

      // Split municipalities into active (have RFPs) and coming soon
      if (muniRes.data) {
        const muniIdsWithRfps = new Set(
          (rfpMuniRes.data || []).map((r: any) => r.municipality_id)
        );
        setMunicipalityList(
          muniRes.data.filter((m) => muniIdsWithRfps.has(m.id))
        );
        setComingSoonList(
          muniRes.data.filter((m) => !muniIdsWithRfps.has(m.id))
        );
      }
      if (catRes.data) {
        const unique = [...new Set(catRes.data.map((r) => r.category as string))];
        setCategoryList(unique.sort());
      }

      if (userRes.data.user) {
        const [{ data: profileData }, { count: alertCount }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userRes.data.user.id).single(),
          supabase
            .from("user_alerts")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userRes.data.user.id)
            .eq("active", true),
        ]);
        if (profileData) setProfile(profileData as Profile);
        setActiveAlertCount(alertCount || 0);
      }
    }
    loadFilterOptions();
  }, []);

  // Fetch RFPs when filters or page change
  const fetchRfps = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("rfps")
      .select("*, municipality:municipalities(*)", { count: "exact" });

    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }
    if (filters.categories.length > 0) {
      query = query.in("category", filters.categories);
    }
    // If states are selected, narrow to municipalities in those states.
    // Explicit municipality selections take precedence when both are set.
    let effectiveMuniIds = filters.municipalities;
    if (filters.states.length > 0 && filters.municipalities.length === 0) {
      effectiveMuniIds = [
        ...municipalityList.filter((m) => filters.states.includes((m.state || "").toUpperCase())).map((m) => m.id),
        ...comingSoonList.filter((m) => filters.states.includes((m.state || "").toUpperCase())).map((m) => m.id),
      ];
      // If a state filter is active but that state has no towns yet, force no results
      if (effectiveMuniIds.length === 0) effectiveMuniIds = ["__no_match__"];
    }
    if (effectiveMuniIds.length > 0) {
      query = query.in("municipality_id", effectiveMuniIds);
    }
    if (filters.status.length > 0) {
      query = query.in("status", filters.status);
    }

    const sortCol = filters.sortBy === "deadline_date" ? "deadline_date" : "posted_date";
    query = query.order(sortCol, { ascending: false, nullsFirst: false });

    const from = (page - 1) * perPage;
    query = query.range(from, from + perPage - 1);

    const { data, count } = await query;
    setRfps((data as Rfp[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [filters, page, supabase, municipalityList, comingSoonList]);

  useEffect(() => {
    fetchRfps();
  }, [fetchRfps]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const totalPages = Math.ceil(total / perPage);

  const saveAsAlert = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const alertFilters: AlertFilters = {
      keywords: filters.search
        ? filters.search.split(/[,\s]+/).filter(Boolean)
        : [],
      categories: filters.categories,
      municipalities: filters.municipalities,
      states: filters.states,
      status: filters.status as RfpStatus[],
    };

    // Build a readable name like "IT & Technology in Concord (open)"
    let alertName = "";
    const parts: string[] = [];

    if (filters.search) {
      parts.push(`"${filters.search}"`);
    }
    if (filters.categories.length) {
      parts.push(filters.categories.join(", "));
    }

    alertName = parts.join(" — ") || "All RFPs";

    if (filters.municipalities.length) {
      const names = filters.municipalities.map(
        (id) => municipalityList.find((m) => m.id === id)?.name || id
      );
      alertName += ` in ${names.join(", ")}`;
    } else if (filters.states.length) {
      alertName += ` in ${filters.states.join(", ")}`;
    }

    if (filters.status.length) {
      alertName += ` (${filters.status.join(", ")})`;
    }

    alertName = alertName.slice(0, 80);

    const { error } = await supabase.from("user_alerts").insert({
      user_id: user.id,
      name: alertName,
      filters: alertFilters,
      email_enabled: true,
      frequency: "daily",
    });

    if (error) {
      setAlertMessage("Failed to save alert.");
    } else {
      setAlertMessage("Alert saved! Manage it in Settings.");
    }
    setTimeout(() => setAlertMessage(null), 4000);
  }, [filters, municipalityList, supabase]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">RFP Opportunities</h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse and filter government contract opportunities across New England.
        </p>
      </div>

      <RfpFilters
        municipalities={municipalityList}
        comingSoon={comingSoonList}
        categories={categoryList}
        filters={filters}
        onFiltersChange={setFilters}
        onSaveAsAlert={saveAsAlert}
        canSaveAlert={canSaveAlert}
        isAuthenticated={isAuthenticated}
      />

      {alertMessage && (
        <div className="mt-3 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
          {alertMessage}
        </div>
      )}

      {!loading && (
        <div className="flex items-center justify-between mt-4 mb-2">
          <span className="text-sm text-slate-600">
            {total === 0 ? (
              "No results"
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {Math.min((page - 1) * perPage + 1, total)}&ndash;{Math.min(page * perPage, total)}
                </span>{" "}
                of <span className="font-semibold text-slate-900">{total}</span> RFPs
              </>
            )}
          </span>
        </div>
      )}

      <div className="mt-1">
        <RfpTable rfps={rfps} loading={loading} />
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
