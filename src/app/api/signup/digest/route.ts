import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

// Homepage email-first signup:
//   POST /api/signup/digest { email, state }
// Creates (or reuses) a Supabase user, adds a single daily alert scoped
// to their state, sends a magic link so they can log in to manage it.
// No password step — lowest-friction possible path to "you're in."
export async function POST(request: NextRequest) {
  let body: { email?: string; state?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const state = (body.state || "").trim().toUpperCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  // Look up existing profile by email
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let userId = existing?.id as string | undefined;

  // Create user if they don't exist yet
  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // skip confirmation; we'll send a magic link instead
    });
    if (error || !data.user) {
      // Might race with an existing user — retry the lookup
      const { data: retry } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (retry?.id) {
        userId = retry.id;
      } else {
        return NextResponse.json(
          { error: error?.message || "Failed to create user" },
          { status: 500 }
        );
      }
    } else {
      userId = data.user.id;
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Could not resolve user" }, { status: 500 });
  }

  // If they already have this state alert, skip; otherwise create one
  const { data: existingAlerts } = await supabase
    .from("user_alerts")
    .select("id, filters")
    .eq("user_id", userId)
    .eq("active", true);

  const alreadyHas =
    state &&
    (existingAlerts || []).some((a: { filters: { states?: string[] } }) =>
      (a.filters?.states || []).includes(state)
    );

  if (!alreadyHas) {
    const filters: Record<string, unknown> = {};
    if (state) filters.states = [state];

    await supabase.from("user_alerts").insert({
      user_id: userId,
      name: state ? `Daily digest — ${state}` : "Daily digest — all states",
      filters,
      email_enabled: true,
      frequency: "daily",
    });
  }

  // Send magic link so they can log in and manage their alerts
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rfpharvest.com";
  await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${siteUrl}/dashboard` },
  });

  return NextResponse.json({
    ok: true,
    message:
      "You're set up. Your first daily digest arrives tomorrow morning. We sent you a login link so you can manage alerts.",
  });
}
