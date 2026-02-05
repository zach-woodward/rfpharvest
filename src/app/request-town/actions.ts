"use server";

import { createServiceSupabase } from "@/lib/supabase/server";

export async function submitTownRequest(formData: {
  town_name: string;
  state: string;
  email?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!formData.town_name.trim()) {
    return { success: false, error: "Town name is required" };
  }

  const supabase = createServiceSupabase();

  const { error } = await supabase.from("town_requests").insert({
    town_name: formData.town_name.trim(),
    state: formData.state || "NH",
    email: formData.email?.trim() || null,
    notes: formData.notes?.trim() || null,
  });

  if (error) {
    console.error("[town-request] Insert error:", error);
    return { success: false, error: "Failed to submit request. Please try again." };
  }

  return { success: true };
}
