"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Wheat } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
  }

  async function handleMagicLink() {
    if (!email) {
      setError("Enter your email address first");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMagicLinkSent(true);
    setLoading(false);
  }

  if (magicLinkSent) {
    return (
      <AuthShell>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Check your email
          </h1>
          <p className="text-sm text-slate-600">
            We sent a login link to <strong>{email}</strong>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-xl font-semibold text-slate-900 mb-6">
        Log in to your account
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest-600 text-white py-2.5 text-sm font-medium hover:bg-forest-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex-1 border-t border-slate-200" />
        <span className="text-xs text-slate-400">or</span>
        <div className="flex-1 border-t border-slate-200" />
      </div>

      <button
        onClick={handleMagicLink}
        disabled={loading}
        className="mt-4 w-full border border-slate-300 text-slate-700 py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        Send magic link
      </button>

      <p className="mt-6 text-sm text-slate-500 text-center">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-forest-600 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-forest-600 flex items-center justify-center">
          <Wheat className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-lg tracking-tight">
          RFP Harvest
        </span>
      </Link>
      <div className="w-full max-w-sm bg-white border border-slate-200 p-6">
        {children}
      </div>
    </div>
  );
}
