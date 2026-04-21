import Link from "next/link";
import { FileText, Bell, Search, Zap, Shield, MapPin, Wheat } from "lucide-react";
import { createPublicSupabase } from "@/lib/supabase/server";
import Footer from "@/components/layout/Footer";
import { stateSlug, stateNameFromSlug } from "@/lib/seo/slugs";

export const revalidate = 1800; // 30 min ISR; coverage doesn't change faster

const SHOW_LIVE_TOWNS = 24; // truncate the public list so it doesn't sprawl

export default async function HomePage() {
  const supabase = createPublicSupabase();

  const [{ data: municipalities }, { data: rfps }] = await Promise.all([
    supabase
      .from("municipalities")
      .select("id, name, state")
      .eq("active", true)
      .order("state")
      .order("name"),
    supabase.from("rfps").select("municipality_id, status"),
  ]);

  const bidsByMuni = new Map<string, number>();
  const openBidsByMuni = new Map<string, number>();
  for (const r of (rfps || []) as Array<{ municipality_id: string; status: string }>) {
    bidsByMuni.set(r.municipality_id, (bidsByMuni.get(r.municipality_id) || 0) + 1);
    if (r.status === "open") {
      openBidsByMuni.set(r.municipality_id, (openBidsByMuni.get(r.municipality_id) || 0) + 1);
    }
  }

  const munis = (municipalities || []) as Array<{ id: string; name: string; state: string }>;
  const liveMunis = munis.filter((m) => (bidsByMuni.get(m.id) || 0) > 0);
  const waitingMunis = munis.filter((m) => (bidsByMuni.get(m.id) || 0) === 0);

  const stateSet = new Set(munis.map((m) => (m.state || "").toUpperCase()).filter(Boolean));
  const stateNames = [...stateSet].sort().map(stateNameFromSlug);

  const totalOpen = (rfps || []).filter((r) => r.status === "open").length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="container-app flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-forest-600 flex items-center justify-center">
              <Wheat className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">RFP Harvest</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/rfps"
              className="hidden sm:inline text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Browse RFPs
            </Link>
            <Link
              href="/guides"
              className="hidden sm:inline text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Guides
            </Link>
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

      {/* Hero */}
      <section className="py-20 md:py-28 border-b border-slate-200">
        <div className="container-app max-w-4xl">
          <div className="flex items-center gap-2 text-sm font-medium text-forest-600 mb-6">
            <MapPin className="w-4 h-4" />
            {stateNames.length > 0
              ? `${stateNames.length} states · ${munis.length} municipalities tracked`
              : "Covering New England and beyond"}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            Never miss a government
            <br />
            contracting opportunity
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
            RFP Harvest aggregates requests for proposals from municipal websites across{" "}
            {stateNames.length > 0 ? stateNames.join(", ") : "New England"}. Search, filter,
            and get alerted when opportunities match your business.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center bg-forest-600 text-white px-6 py-3 text-base font-medium hover:bg-forest-700 transition-colors"
            >
              Start monitoring RFPs
            </Link>
            <Link
              href="/rfps"
              className="inline-flex items-center justify-center border border-slate-300 text-slate-700 px-6 py-3 text-base font-medium hover:bg-slate-50 transition-colors"
            >
              Browse RFPs for free
            </Link>
          </div>
        </div>
      </section>

      {/* State coverage grid — links to programmatic state pages */}
      <section id="coverage" className="py-20 border-b border-slate-200">
        <div className="container-app">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Coverage</h2>
          <p className="text-slate-600 mb-10">
            {liveMunis.length} municipalities publishing active bids across {stateSet.size} states.
            {waitingMunis.length > 0 && ` ${waitingMunis.length} more tracked and waiting for their next posting.`}
          </p>

          <div className="mb-10">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
              Browse by state
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[...stateSet].sort().map((st) => {
                const stateMunis = munis.filter((m) => m.state === st);
                const openInState = stateMunis.reduce(
                  (s, m) => s + (openBidsByMuni.get(m.id) || 0),
                  0
                );
                return (
                  <Link
                    key={st}
                    href={`/rfps/${stateSlug(st)}`}
                    className="block bg-white border border-slate-200 hover:border-forest-400 hover:shadow-sm transition-all p-4"
                  >
                    <div className="font-semibold text-slate-900">{stateNameFromSlug(st)}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {stateMunis.length} {stateMunis.length === 1 ? "municipality" : "municipalities"}
                    </div>
                    <div className="mt-2 text-sm text-forest-700 font-medium">
                      {openInState} open {openInState === 1 ? "bid" : "bids"}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Live municipalities
              </h3>
              {liveMunis.length > SHOW_LIVE_TOWNS && (
                <Link href="/rfps" className="text-xs font-medium text-forest-700 hover:underline">
                  See all {liveMunis.length} →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {liveMunis.slice(0, SHOW_LIVE_TOWNS).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 text-sm text-slate-700 bg-white border border-slate-200 px-3 py-2"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                  <span className="truncate">
                    {m.name} <span className="text-slate-400 text-xs">{m.state}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-forest-50 border border-forest-200 p-4">
            <div className="text-sm text-forest-800">
              <span className="font-medium">Don&apos;t see your town?</span>{" "}
              We&apos;re actively expanding. Let us know which municipalities matter to you.
            </div>
            <Link
              href="/request-town"
              className="shrink-0 text-sm font-medium bg-forest-600 text-white px-4 py-2 hover:bg-forest-700 transition-colors"
            >
              Request a town
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container-app">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <FeatureCard
              icon={<Search className="w-5 h-5" />}
              title="Aggregated search"
              description="All municipal RFPs in one place. Filter by state, trade, municipality, deadline, and keywords."
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5" />}
              title="AI summaries"
              description="Concise AI-generated summaries of RFP documents so you can quickly assess fit."
            />
            <FeatureCard
              icon={<Bell className="w-5 h-5" />}
              title="Smart alerts"
              description="Set up filters and get email digests when new opportunities match your criteria."
            />
          </div>
        </div>
      </section>

      {/* Stats / Trust — all numbers dynamic from the DB */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="container-app">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stat value={munis.length.toString()} label="Municipalities tracked" />
            <Stat value={stateSet.size.toString()} label={stateSet.size === 1 ? "State" : "States covered"} />
            <Stat value={totalOpen.toString()} label="Open bids right now" />
            <Stat value="6h" label="Refresh cycle" />
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20">
        <div className="container-app max-w-4xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-4">Simple pricing</h2>
          <p className="text-slate-600 mb-12">
            Start free. Upgrade when you need alerts and AI summaries.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <PricingCard
              name="Free"
              price="$0"
              period="/month"
              features={["Browse all RFPs", "Search & filter", "View full RFP details"]}
              cta="Get started"
              href="/auth/signup"
            />
            <PricingCard
              name="Pro"
              price="$29"
              period="/month"
              features={[
                "Everything in Free",
                "AI-powered summaries",
                "Email alerts & digests",
                "Saved filters (up to 10)",
                "Priority support",
              ]}
              cta="Start free trial"
              href="/auth/signup?plan=pro"
              highlighted
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="w-10 h-10 bg-forest-50 border border-forest-200 flex items-center justify-center text-forest-600 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-bold text-forest-600">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  features,
  cta,
  href,
  highlighted,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`p-6 border ${
        highlighted ? "border-forest-600 ring-1 ring-forest-600" : "border-slate-200"
      }`}
    >
      <div className="text-sm font-medium text-slate-500 mb-1">{name}</div>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-3xl font-bold text-slate-900">{price}</span>
        <span className="text-sm text-slate-500">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
            <Shield className="w-4 h-4 text-forest-500 mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`block text-center py-2.5 text-sm font-medium transition-colors ${
          highlighted
            ? "bg-forest-600 text-white hover:bg-forest-700"
            : "border border-slate-300 text-slate-700 hover:bg-slate-50"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
