import { createServiceSupabase } from "@/lib/supabase/server";
import { UserTable } from "./user-table";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const supabase = createServiceSupabase();

  const [{ data: users }, { data: alerts }, { data: savedRfps }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("user_alerts").select("user_id"),
      supabase.from("saved_rfps").select("user_id"),
    ]);

  const alertCounts: Record<string, number> = {};
  (alerts || []).forEach((a: any) => {
    alertCounts[a.user_id] = (alertCounts[a.user_id] || 0) + 1;
  });

  const savedRfpCounts: Record<string, number> = {};
  (savedRfps || []).forEach((s: any) => {
    savedRfpCounts[s.user_id] = (savedRfpCounts[s.user_id] || 0) + 1;
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">Users</h1>
      <UserTable
        users={users || []}
        alertCounts={alertCounts}
        savedRfpCounts={savedRfpCounts}
      />
    </div>
  );
}
