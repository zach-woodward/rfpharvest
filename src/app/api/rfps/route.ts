import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const perPage = Math.min(parseInt(searchParams.get("per_page") || "20"), 100);
  const search = searchParams.get("search") || "";
  const categories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
  const municipalities = searchParams.get("municipalities")?.split(",").filter(Boolean) || [];
  const status = searchParams.get("status")?.split(",").filter(Boolean) || [];
  const sortBy = searchParams.get("sort_by") === "deadline_date" ? "deadline_date" : "posted_date";

  let query = supabase
    .from("rfps")
    .select("*, municipality:municipalities(id, name, state)", { count: "exact" });

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (categories.length) query = query.in("category", categories);
  if (municipalities.length) query = query.in("municipality_id", municipalities);
  if (status.length) query = query.in("status", status);

  query = query.order(sortBy, { ascending: false, nullsFirst: false });

  const from = (page - 1) * perPage;
  query = query.range(from, from + perPage - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    rfps: data,
    total: count,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count || 0) / perPage),
  });
}
