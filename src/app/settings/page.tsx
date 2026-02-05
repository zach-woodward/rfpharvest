"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, Trash2, Save } from "lucide-react";
import { RFP_CATEGORIES } from "@/lib/utils";
import type { RfpStatus } from "@/types/database";
import type { Profile, UserAlert, AlertFilters, Municipality } from "@/types/database";

export default function SettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [municipalities, setMunicipalities] = useState<Pick<Municipality, "id" | "name">[]>([]);
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [noUser, setNoUser] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNoUser(true);
        setLoading(false);
        return;
      }

      const [profileRes, alertsRes, muniRes, catRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("user_alerts").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("municipalities").select("id, name").eq("active", true).order("name"),
        supabase.from("rfps").select("category").not("category", "is", null),
      ]);

      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (alertsRes.data) setAlerts(alertsRes.data as UserAlert[]);
      if (muniRes.data) setMunicipalities(muniRes.data);
      if (catRes.data) {
        const unique = [...new Set(catRes.data.map((r) => r.category as string))];
        setCategoryList(unique.sort());
      }
      setLoading(false);
    }
    load();
  }, []);

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        company_name: profile.company_name,
      })
      .eq("id", profile.id);
    setSaving(false);
    setMessage("Profile saved");
    setTimeout(() => setMessage(null), 3000);
  }

  async function addAlert() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newAlert: Partial<UserAlert> = {
      user_id: user.id,
      name: "New Alert",
      filters: { categories: [], municipalities: [], keywords: [] },
      email_enabled: true,
      frequency: "daily",
    };

    const { data } = await supabase
      .from("user_alerts")
      .insert(newAlert)
      .select()
      .single();

    if (data) setAlerts([...alerts, data as UserAlert]);
  }

  async function deleteAlert(id: string) {
    await supabase.from("user_alerts").delete().eq("id", id);
    setAlerts(alerts.filter((a) => a.id !== id));
  }

  async function updateAlert(id: string, updates: Partial<UserAlert>) {
    await supabase.from("user_alerts").update(updates).eq("id", id);
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 w-48" />
          <div className="h-40 bg-slate-100" />
        </div>
      </DashboardLayout>
    );
  }

  if (noUser) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl">
          <h1 className="text-xl font-bold text-slate-900 mb-6">Settings</h1>
          <div className="bg-white border border-slate-200 p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Sign in to manage your settings
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Create an account to set up email alerts, save filters, and manage your profile.
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href="/auth/login"
                className="px-4 py-2.5 text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Log in
              </a>
              <a
                href="/auth/signup"
                className="px-4 py-2.5 text-sm font-medium bg-forest-600 text-white hover:bg-forest-700 transition-colors"
              >
                Create account
              </a>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isPro = profile?.subscription_tier === "pro" || profile?.subscription_tier === "enterprise";

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Settings</h1>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 mb-6">
            {message}
          </div>
        )}

        {/* Profile */}
        <section className="bg-white border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full name
              </label>
              <input
                type="text"
                value={profile?.full_name || ""}
                onChange={(e) =>
                  setProfile(profile ? { ...profile, full_name: e.target.value } : null)
                }
                className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Company
              </label>
              <input
                type="text"
                value={profile?.company_name || ""}
                onChange={(e) =>
                  setProfile(profile ? { ...profile, company_name: e.target.value } : null)
                }
                className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="flex items-center gap-1.5 bg-forest-600 text-white px-4 py-2 text-sm font-medium hover:bg-forest-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </section>

        {/* Subscription */}
        <section className="bg-white border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">Subscription</h2>
          <p className="text-sm text-slate-600 mb-4">
            Current plan:{" "}
            <span className="font-semibold capitalize">{profile?.subscription_tier}</span>
          </p>
          {!isPro && (
            <a
              href="/api/stripe/checkout"
              className="inline-flex items-center gap-1.5 bg-forest-600 text-white px-4 py-2 text-sm font-medium hover:bg-forest-700 transition-colors"
            >
              Upgrade to Pro
            </a>
          )}
          {isPro && (
            <a
              href="/api/stripe/portal"
              className="inline-flex items-center gap-1.5 border border-slate-300 text-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Manage subscription
            </a>
          )}
        </section>

        {/* Alerts */}
        <section className="bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Email Alerts</h2>
            <button
              onClick={addAlert}
              disabled={!isPro}
              className="flex items-center gap-1 text-sm font-medium text-forest-600 hover:text-forest-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add alert
            </button>
          </div>

          {!isPro && (
            <p className="text-sm text-slate-500 mb-4">
              Email alerts are available on the Pro plan.
            </p>
          )}

          {alerts.length === 0 && isPro && (
            <p className="text-sm text-slate-500">
              No alerts configured. Add one to get notified about new RFPs.
            </p>
          )}

          <div className="space-y-4">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                municipalities={municipalities}
                categories={categoryList}
                onUpdate={(updates) => updateAlert(alert.id, updates)}
                onDelete={() => deleteAlert(alert.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

const STATUS_OPTIONS: RfpStatus[] = ["open", "closed", "awarded", "canceled"];

function AlertCard({
  alert,
  municipalities,
  categories,
  onUpdate,
  onDelete,
}: {
  alert: UserAlert;
  municipalities: Pick<Municipality, "id" | "name">[];
  categories: string[];
  onUpdate: (updates: Partial<UserAlert>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(alert.name);
  const [keywords, setKeywords] = useState(
    (alert.filters.keywords || []).join(", ")
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    alert.filters.categories || []
  );
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>(
    alert.filters.municipalities || []
  );
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    (alert.filters.status as string[]) || []
  );
  const [frequency, setFrequency] = useState(alert.frequency);

  function toggleItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item];
  }

  function save() {
    onUpdate({
      name,
      filters: {
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        categories: selectedCategories,
        municipalities: selectedMunicipalities,
        status: selectedStatuses as RfpStatus[],
      },
      frequency,
    });
    setEditing(false);
  }

  const hasAnyFilter =
    (alert.filters.keywords?.length || 0) > 0 ||
    (alert.filters.categories?.length || 0) > 0 ||
    (alert.filters.municipalities?.length || 0) > 0 ||
    (alert.filters.status?.length || 0) > 0;

  return (
    <div className="border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        ) : (
          <span className="text-sm font-medium text-slate-900">{alert.name}</span>
        )}
        <div className="flex items-center gap-2">
          {editing ? (
            <button
              onClick={save}
              className="text-xs font-medium text-forest-600 hover:text-forest-700"
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Edit
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-slate-400 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="space-y-4 mt-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Keywords (comma-separated)
            </label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. construction, paving, IT"
              className="w-full border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedStatuses(toggleItem(selectedStatuses, s))}
                  className={`px-3 py-1 text-xs font-medium border transition-colors capitalize ${
                    selectedStatuses.includes(s)
                      ? "border-forest-600 text-forest-700 bg-forest-50"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {(categories.length > 0 ? categories : [...RFP_CATEGORIES]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategories(toggleItem(selectedCategories, c))}
                  className={`px-3 py-1 text-xs font-medium border transition-colors ${
                    selectedCategories.includes(c)
                      ? "border-forest-600 text-forest-700 bg-forest-50"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Municipalities
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {municipalities.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMunicipalities(toggleItem(selectedMunicipalities, m.id))}
                  className={`px-3 py-1 text-xs font-medium border transition-colors ${
                    selectedMunicipalities.includes(m.id)
                      ? "border-forest-600 text-forest-700 bg-forest-50"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as UserAlert["frequency"])}
              className="border border-slate-300 px-2 py-1.5 text-sm bg-white"
            >
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>
        </div>
      )}

      {!editing && (
        <div className="text-xs text-slate-500 space-y-0.5">
          {alert.filters.keywords?.length ? (
            <div>Keywords: {alert.filters.keywords.join(", ")}</div>
          ) : null}
          {alert.filters.categories?.length ? (
            <div>Categories: {alert.filters.categories.join(", ")}</div>
          ) : null}
          {alert.filters.municipalities?.length ? (
            <div>
              Municipalities:{" "}
              {alert.filters.municipalities
                .map((id) => municipalities.find((m) => m.id === id)?.name || id)
                .join(", ")}
            </div>
          ) : null}
          {alert.filters.status?.length ? (
            <div>Status: {alert.filters.status.join(", ")}</div>
          ) : null}
          {!hasAnyFilter && <div>No filters set</div>}
          <div className="text-slate-400 mt-1">{alert.frequency} digest</div>
        </div>
      )}
    </div>
  );
}
