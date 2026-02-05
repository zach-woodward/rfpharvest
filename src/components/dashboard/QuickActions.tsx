"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark, BookmarkCheck, Bell, Share2, Check, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  rfpId: string;
  rfpTitle: string;
  municipalityId?: string;
  municipalityName?: string;
}

export default function QuickActions({
  rfpId,
  rfpTitle,
  municipalityId,
  municipalityName,
}: QuickActionsProps) {
  const supabase = createClient();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [alertCreated, setAlertCreated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkState() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("saved_rfps")
        .select("id")
        .eq("user_id", user.id)
        .eq("rfp_id", rfpId)
        .single();

      if (data) setSaved(true);
    }
    checkState();
  }, [rfpId]);

  async function toggleSave() {
    if (!userId) return;
    setSaving(true);

    if (saved) {
      await supabase
        .from("saved_rfps")
        .delete()
        .eq("user_id", userId)
        .eq("rfp_id", rfpId);
      setSaved(false);
    } else {
      await supabase
        .from("saved_rfps")
        .insert({ user_id: userId, rfp_id: rfpId });
      setSaved(true);
    }
    setSaving(false);
  }

  async function createMuniAlert() {
    if (!userId || !municipalityId) return;

    await supabase.from("user_alerts").insert({
      user_id: userId,
      name: `${municipalityName || "Municipality"} alerts`,
      filters: { municipalities: [municipalityId] },
      email_enabled: true,
      frequency: "daily",
    });
    setAlertCreated(true);
    setTimeout(() => setAlertCreated(false), 3000);
  }

  function shareLink() {
    const url = `${window.location.origin}/rfp/${rfpId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareEmail() {
    const url = `${window.location.origin}/rfp/${rfpId}`;
    const subject = encodeURIComponent(`RFP: ${rfpTitle}`);
    const body = encodeURIComponent(`Check out this RFP opportunity:\n\n${rfpTitle}\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  return (
    <div className="bg-white border border-slate-200 p-4">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Quick Actions
      </h2>
      <div className="space-y-2">
        {userId ? (
          <>
            <button
              onClick={toggleSave}
              disabled={saving}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors border",
                saved
                  ? "bg-forest-50 text-forest-700 border-forest-200"
                  : "text-slate-700 border-slate-200 hover:bg-slate-50"
              )}
            >
              {saved ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
              {saved ? "Saved to watchlist" : "Save to watchlist"}
            </button>

            {municipalityId && (
              <button
                onClick={createMuniAlert}
                disabled={alertCreated}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors border",
                  alertCreated
                    ? "bg-forest-50 text-forest-700 border-forest-200"
                    : "text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                {alertCreated ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                {alertCreated
                  ? "Alert created"
                  : `Alert me on ${municipalityName || "this municipality"}`}
              </button>
            )}
          </>
        ) : (
          <a
            href="/auth/signup"
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Bookmark className="w-4 h-4" />
            Sign up to save & get alerts
          </a>
        )}

        <button
          onClick={shareLink}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          {copied ? (
            <Check className="w-4 h-4 text-forest-600" />
          ) : (
            <LinkIcon className="w-4 h-4" />
          )}
          {copied ? "Link copied" : "Copy link"}
        </button>

        <button
          onClick={shareEmail}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share via email
        </button>
      </div>
    </div>
  );
}
