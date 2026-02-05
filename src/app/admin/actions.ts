"use server";

import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_tier !== "enterprise") {
    throw new Error("Not authorized");
  }

  return user;
}

export async function triggerScrape(municipalityId?: string) {
  await verifyAdmin();

  const secret = process.env.CRON_SECRET;
  const baseUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

  const url = new URL("/api/scrape", baseUrl);
  url.searchParams.set("secret", secret || "");

  await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      municipalityId ? { municipality_id: municipalityId } : {}
    ),
  });
}

export async function updateUserTier(
  userId: string,
  tier: "free" | "pro" | "enterprise"
) {
  await verifyAdmin();
  const supabase = createServiceSupabase();

  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_tier: tier,
      subscription_status: tier === "free" ? "inactive" : "active",
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  const admin = await verifyAdmin();

  // Prevent self-deletion
  if (admin.id === userId) {
    throw new Error("Cannot delete your own account");
  }

  const supabase = createServiceSupabase();

  // Delete profile (cascades to alerts, saved_rfps, notifications)
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileError) throw new Error(profileError.message);

  // Delete from auth.users via admin API
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) throw new Error(authError.message);

  revalidatePath("/admin/users");
}
