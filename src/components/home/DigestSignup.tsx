"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";

const STATES = [
  { code: "NH", name: "New Hampshire" },
  { code: "ME", name: "Maine" },
  { code: "MA", name: "Massachusetts" },
  { code: "CT", name: "Connecticut" },
  { code: "RI", name: "Rhode Island" },
  { code: "VT", name: "Vermont" },
];

export default function DigestSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("NH");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/signup/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, state }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.message || "You're in.");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Network error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-forest-50 border border-forest-200 p-5 max-w-2xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-forest-600 flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-forest-900 font-medium">{message}</p>
            <p className="text-sm text-forest-700 mt-1">
              Keep an eye on your inbox — the login link arrives momentarily.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            className="w-full pl-10 pr-3 py-3 border border-slate-300 text-base focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent bg-white"
          />
        </div>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="border border-slate-300 px-3 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-forest-500"
        >
          {STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="bg-forest-600 text-white px-6 py-3 text-base font-medium hover:bg-forest-700 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {status === "submitting" ? "Setting up…" : "Get the daily digest"}
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Free. One email per day. No credit card. Unsubscribe anytime.
      </p>
      {status === "error" && (
        <p className="text-sm text-red-600 mt-2">{message}</p>
      )}
    </form>
  );
}
