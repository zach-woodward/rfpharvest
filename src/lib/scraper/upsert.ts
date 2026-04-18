import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeRfp, type NormalizedRfp } from "./normalize";
import type { ScrapedRfp } from "./types";

export type UpsertOutcome = "new" | "updated" | "spam" | "error";

export interface UpsertResult {
  outcome: UpsertOutcome;
  reason?: string;
}

export async function upsertRfp(
  supabase: SupabaseClient,
  municipalityId: string,
  raw: ScrapedRfp
): Promise<UpsertResult> {
  const normalized = normalizeRfp(raw);
  if (!normalized) return { outcome: "spam", reason: "rejected by normalizer" };

  const now = new Date().toISOString();

  if (normalized.source_url) {
    const { data: existing, error: selectError } = await supabase
      .from("rfps")
      .select("id, raw_data")
      .eq("source_url", normalized.source_url)
      .maybeSingle();

    if (selectError) {
      return { outcome: "error", reason: selectError.message };
    }

    if (existing) {
      const patch = buildUpdatePatch(normalized, existing.raw_data, now);
      const { error: updateError } = await supabase
        .from("rfps")
        .update(patch)
        .eq("id", existing.id);
      if (updateError) return { outcome: "error", reason: updateError.message };
      return { outcome: "updated" };
    }
  }

  const insertRow = {
    municipality_id: municipalityId,
    title: normalized.title,
    description: normalized.description,
    category: normalized.category,
    status: normalized.status,
    posted_date: normalized.posted_date,
    deadline_date: normalized.deadline_date,
    pre_bid_date: normalized.pre_bid_date,
    qa_deadline: normalized.qa_deadline,
    source_url: normalized.source_url,
    document_urls: normalized.document_urls,
    contact_name: normalized.contact_name,
    contact_email: normalized.contact_email,
    contact_phone: normalized.contact_phone,
    estimated_value: normalized.estimated_value,
    requires_signup: normalized.requires_signup,
    raw_data: normalized.raw_data,
    scraped_at: now,
  };

  const { error: insertError } = await supabase.from("rfps").insert(insertRow);
  if (insertError) {
    if (insertError.code === "23505") {
      return { outcome: "updated", reason: "dedup on insert (race)" };
    }
    return { outcome: "error", reason: insertError.message };
  }
  return { outcome: "new" };
}

function buildUpdatePatch(
  normalized: NormalizedRfp,
  existingRawData: Record<string, unknown> | null,
  now: string
): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    scraped_at: now,
    raw_data: { ...(existingRawData || {}), ...normalized.raw_data },
  };

  const coalesceFields: (keyof NormalizedRfp)[] = [
    "title",
    "description",
    "category",
    "posted_date",
    "deadline_date",
    "pre_bid_date",
    "qa_deadline",
    "contact_name",
    "contact_email",
    "contact_phone",
    "estimated_value",
  ];

  for (const field of coalesceFields) {
    const value = normalized[field];
    if (value !== null && value !== undefined && value !== "") {
      patch[field] = value;
    }
  }

  if (normalized.document_urls.length > 0) {
    patch.document_urls = normalized.document_urls;
  }

  if (normalized.requires_signup) {
    patch.requires_signup = true;
  }

  if (normalized.status !== "open" && normalized.status !== "unknown") {
    patch.status = normalized.status;
  }

  return patch;
}
