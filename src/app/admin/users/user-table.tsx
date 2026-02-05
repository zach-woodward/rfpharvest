"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import { updateUserTier, deleteUser } from "../actions";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

const tierStyles: Record<string, string> = {
  free: "bg-slate-100 text-slate-500 border-slate-200",
  pro: "bg-forest-50 text-forest-700 border-forest-200",
  enterprise: "bg-purple-50 text-purple-700 border-purple-200",
};

const statusStyles: Record<string, string> = {
  active: "text-green-600",
  inactive: "text-slate-400",
  past_due: "text-amber-600",
  canceled: "text-red-500",
};

export function UserTable({
  users,
  alertCounts,
  savedRfpCounts,
}: {
  users: UserRow[];
  alertCounts: Record<string, number>;
  savedRfpCounts: Record<string, number>;
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleTierChange(userId: string, tier: "free" | "pro" | "enterprise") {
    setLoading(userId);
    try {
      await updateUserTier(userId, tier);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(userId: string) {
    setLoading(userId);
    try {
      await deleteUser(userId);
      setConfirmDelete(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-white border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
              User
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">
              Company
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
              Plan
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden sm:table-cell">
              Status
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">
              Alerts
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">
              Saved RFPs
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider hidden sm:table-cell">
              Joined
            </th>
            <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">
                  {user.full_name || "—"}
                </div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </td>
              <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                {user.company_name || "—"}
              </td>
              <td className="px-4 py-3">
                <select
                  value={user.subscription_tier}
                  disabled={loading === user.id || user.subscription_tier === "enterprise"}
                  onChange={(e) =>
                    handleTierChange(user.id, e.target.value as "free" | "pro" | "enterprise")
                  }
                  className={`text-xs font-medium px-2 py-1 border rounded-none appearance-none cursor-pointer disabled:cursor-default ${
                    tierStyles[user.subscription_tier] || tierStyles.free
                  }`}
                >
                  <option value="free">free</option>
                  <option value="pro">pro</option>
                  <option value="enterprise">enterprise</option>
                </select>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <span
                  className={`text-xs font-medium capitalize ${
                    statusStyles[user.subscription_status] || statusStyles.inactive
                  }`}
                >
                  {user.subscription_status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                {alertCounts[user.id] || 0}
              </td>
              <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                {savedRfpCounts[user.id] || 0}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">
                {formatDate(user.created_at)}
              </td>
              <td className="px-4 py-3">
                {confirmDelete === user.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600">Sure?</span>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={loading === user.id}
                      className="text-xs font-medium text-white bg-red-600 px-2 py-1 hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading === user.id ? "..." : "Yes"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs font-medium text-slate-500 px-2 py-1 hover:text-slate-700"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(user.id)}
                    disabled={user.subscription_tier === "enterprise"}
                    className="text-xs font-medium text-red-500 hover:text-red-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
