"use client";

import Link from "next/link";
import { useState } from "react";
import { Wheat, ArrowLeft, CheckCircle } from "lucide-react";
import { submitTownRequest } from "./actions";

const states = [
  { value: "NH", label: "New Hampshire" },
  { value: "ME", label: "Maine" },
  { value: "VT", label: "Vermont" },
  { value: "MA", label: "Massachusetts" },
  { value: "CT", label: "Connecticut" },
  { value: "RI", label: "Rhode Island" },
];

export default function RequestTownPage() {
  const [townName, setTownName] = useState("");
  const [state, setState] = useState("NH");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await submitTownRequest({
      town_name: townName,
      state,
      email: email || undefined,
      notes: notes || undefined,
    });

    setLoading(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error || "Something went wrong");
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="container-app flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-forest-600 flex items-center justify-center">
              <Wheat className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              RFP Harvest
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-medium bg-forest-600 text-white px-4 py-2 hover:bg-forest-700 transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="container-app max-w-xl py-16">
        <Link
          href="/#coverage"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to coverage
        </Link>

        {submitted ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Request submitted
            </h1>
            <p className="text-slate-600 mb-6">
              Thanks for letting us know. We&apos;ll prioritize adding{" "}
              <span className="font-medium">{townName}</span> based on demand.
              {email && " We'll notify you when it's live."}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setTownName("");
                  setEmail("");
                  setNotes("");
                }}
                className="text-sm font-medium border border-slate-300 text-slate-700 px-4 py-2 hover:bg-slate-50 transition-colors"
              >
                Request another
              </button>
              <Link
                href="/"
                className="text-sm font-medium bg-forest-600 text-white px-4 py-2 hover:bg-forest-700 transition-colors"
              >
                Back to home
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
              Request a town
            </h1>
            <p className="text-slate-600 mb-8">
              Tell us which municipality you&apos;d like us to monitor. We
              prioritize based on demand.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Town or city name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={townName}
                  onChange={(e) => setTownName(e.target.value)}
                  required
                  placeholder="e.g. Lebanon, Salem, Milford"
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent bg-white"
                >
                  {states.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Your email{" "}
                  <span className="text-slate-400 font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-400 mt-1">
                  We&apos;ll let you know when this town goes live.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes{" "}
                  <span className="text-slate-400 font-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any details about the types of RFPs you're looking for..."
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forest-600 text-white py-2.5 text-sm font-medium hover:bg-forest-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit request"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
