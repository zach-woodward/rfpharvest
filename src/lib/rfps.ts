import { createServiceSupabase } from "@/lib/supabase/server";
import type { Rfp, RfpFilters } from "@/types/database";

const DEFAULT_PER_PAGE = 20;

export async function fetchRfps(filters: RfpFilters) {
  const supabase = createServiceSupabase();
  const {
    search,
    categories,
    municipalities,
    status,
    dateFrom,
    dateTo,
    sortBy = "posted_date",
    sortOrder = "desc",
    page = 1,
    perPage = DEFAULT_PER_PAGE,
  } = filters;

  let query = supabase
    .from("rfps")
    .select("*, municipality:municipalities(*)", { count: "exact" });

  // Full-text search
  if (search) {
    query = query.textSearch("title_description", search, {
      type: "websearch",
      config: "english",
    });
  }

  // Filters
  if (categories?.length) {
    query = query.in("category", categories);
  }
  if (municipalities?.length) {
    query = query.in("municipality_id", municipalities);
  }
  if (status?.length) {
    query = query.in("status", status);
  }
  if (dateFrom) {
    query = query.gte("posted_date", dateFrom);
  }
  if (dateTo) {
    query = query.lte("posted_date", dateTo);
  }

  // Sort
  query = query.order(sortBy, { ascending: sortOrder === "asc", nullsFirst: false });

  // Pagination
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching RFPs:", error);
    throw error;
  }

  return {
    rfps: (data as Rfp[]) || [],
    total: count || 0,
    page,
    perPage,
    totalPages: Math.ceil((count || 0) / perPage),
  };
}

export async function fetchRfpById(id: string) {
  const supabase = createServiceSupabase();

  const { data, error } = await supabase
    .from("rfps")
    .select("*, municipality:municipalities(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching RFP:", error);
    return null;
  }

  return data as Rfp;
}

export async function fetchMunicipalities() {
  const supabase = createServiceSupabase();

  const { data, error } = await supabase
    .from("municipalities")
    .select("id, name, state, county")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Error fetching municipalities:", error);
    return [];
  }

  return data;
}

export async function fetchCategories(): Promise<string[]> {
  const supabase = createServiceSupabase();

  const { data, error } = await supabase
    .from("rfps")
    .select("category")
    .not("category", "is", null)
    .order("category");

  if (error) return [];

  const unique = [...new Set(data.map((r) => r.category as string))];
  return unique;
}
