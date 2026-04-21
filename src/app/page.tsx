import Link from "next/link";
import { FileText, Bell, Search, Zap, Shield, MapPin, Wheat, Calendar, ExternalLink } from "lucide-react";
import { createPublicSupabase } from "@/lib/supabase/server";
import Footer from "@/components/layout/Footer";
import DigestSignup from "@/components/home/DigestSignup";
import { stateSlug, stateNameFromSlug, townSlug } from "@/lib/seo/slugs";
import { formatDate } from "@/lib/utils";

export const revalidate = 1800;

const SHOW_LIVE_TOWNS = 24;
const SAMPLE_RFPS_COUNT = 3;

export default async function HomePage() {
  const supabase = createPublicSupabase();

  const [{ data: municipalities }, { data: rfps }, { data: sampleRfps }] = await Promise.all([
    supabase
      .from("municipalities")
      .select("id, name, state")
      .eq("active", true)
      .order("state")
      .order("name"),
    supabase.from("rfps").select("municipality_id, status"),
    supabase
      .from("rfps")
      .select(
        "id, title, deadline_date, posted_date, municipality:municipalities(name, state)"
      )
      .eq("status", "open")
      .order("posted_date", { ascending: false, nullsFirst: false })
      .limit(SAMPLE_RFPS_COUNT),
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

  const stateSet = new Set(munis.map((m) => (m.state || "").toUpperCase()).filter(Boolean));
  const stateNames = [...stateSet].sort().map(stateNameFromSlug);
  const totalOpen = (rfps || []).filter((r) => r.status === "open").length;

  const samples = ((sampleRfps || []) as unknown) as Array<{
    id: string;
    title: string;
    deadline_date: string | null;
    posted_date: string | null;
    municipality: { name: string; state: string } | null;
  }>;

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
            <Link href="/rfps" className="hidden sm:inline text-sm font-medium text-slate-600 hover:text-slate-900">
              Browse RFPs
            </Link>
            <Link href="/guides" className="hidden sm:inline text-sm font-medium text-slate-600 hover:text-slate-900">
              Guides
            </Link>
            <Link href="/pricing" className="hidden md:inline text-sm font-medium text-slate-600 hover:text-slate-900">
              Pricing
            </Link>
            <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Log in
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — email-first signup. Primary conversion surface. */}
      <section className="py-16 md:py-24 border-b border-slate-200">
        <div className="container-app max-w-4xl">
          <div className="flex items-center gap-2 text-sm font-medium text-forest-600 mb-6">
            <MapPin className="w-4 h-4" />
            {stateSet.size} states · {munis.length} municipalities · {totalOpen} open bids right now
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            Never miss a municipal
            <br />
            bid in your state.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
            RFP Harvest scrapes every municipal website in {stateNames.join(", ")} every six hours and
            emails you the new bids that match your filters. Free. No account required.
          </p>

          <div className="mt-8">
            <DigestSignup />
          </div>

          <div className="mt-6">
            <Link
              href="/rfps"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Or browse {totalOpen} open bids without signing up
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Sample RFPs — showing the product beats describing it */}
      {samples.length > 0 && (
        <section className="py-14 bg-slate-50 border-b border-slate-200">
          <div className="container-app max-w-4xl">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Latest bids right now</h2>
              <Link href="/rfps" className="text-sm font-medium text-forest-700 hover:underline">
                See all {totalOpen} →
              </Link>
            </div>
            <div className="space-y-2">
              {samples.map((rfp) => (
                <Link
                  key={rfp.id}
                  href={`/rfp/${rfp.id}`}
                  className="block bg-white border border-slate-200 hover:border-forest-400 transition-colors p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {rfp.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        {rfp.municipality && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {rfp.municipality.name}, {rfp.municipality.state}
                          </span>
                        )}
                        {rfp.posted_date && <span>Posted {formatDate(rfp.posted_date)}</span>}
                        {rfp.deadline_date && (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                            <Calendar className="w-3 h-3" />
                            Due {formatDate(rfp.deadline_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* State coverage grid */}
      <section id="coverage" className="py-16 border-b border-slate-200">
        <div className="container-app">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Coverage</h2>
          <p className="text-slate-600 mb-8">
            {liveMunis.length} municipalities publishing active bids across {stateSet.size} states.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
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

          <div className="mb-6">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Live municipalities
              </h3>
              {liveMunis.length > SHOW_LIVE_TOWNS && (
                <Link href="/rfps" className="text-xs font-medium text-forest-700 hover:underline">
                  See all {liveMunis.length} →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {liveMunis.slice(0, SHOW_LIVE_TOWNS).map((m) => (
                <Link
                  key={m.id}
                  href={`/rfps/${stateSlug(m.state)}/${townSlug(m.name)}`}
                  className="flex items-center gap-2 text-sm text-slate-700 bg-white border border-slate-200 hover:border-forest-400 px-3 py-2"
                >
                  <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                  <span className="truncate">
                    {m.name} <span className="text-slate-400 text-xs">{m.state}</span>
                  </span>
                </Link>
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
              className="shrink-0 text-sm font-medium bg-forest-600 text-white px-4 py-2 hover:bg-forest-700"
            >
              Request a town
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container-app">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-10">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <FeatureCard
              icon={<Search className="w-5 h-5" />}
              title="One feed. Every town."
              description={`All ${munis.length} municipalities in ${stateNames.join(", ")} aggregated into one searchable feed. Filter by state, trade, deadline, or keyword.`}
            />
            <FeatureCard
              icon={<Bell className="w-5 h-5" />}
              title="Email alerts"
              description="Save a filter, get an email digest every morning with the new bids that matched. Pro users get unlimited alerts; Free gets one."
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5" />}
              title="AI summaries"
              description="For Pro users, every new RFP gets a concise AI-generated summary — scope, requirements, budget, timeline — so you can decide if it's worth a full read in 15 seconds."
            />
          </div>
        </div>
      </section>

      {/* Social proof stat band */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="container-app">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stat value={munis.length.toString()} label="Municipalities tracked" />
            <Stat value={stateSet.size.toString()} label={stateSet.size === 1 ? "State" : "States covered"} />
            <Stat value={totalOpen.toString()} label="Open bids right now" />
            <Stat value="6h" label="Refresh cycle" />
          </div>
          <p className="text-center text-xs text-slate-500 mt-8">
            Every bid is scraped directly from the town&apos;s website, deduplicated, and linked back to
            the original posting. Nothing scraped, nothing invented.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="container-app max-w-4xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">Simple pricing</h2>
          <p className="text-slate-600 mb-10">
            Start free. Upgrade when you need alerts on more than one filter.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <PricingCard
              name="Free"
              price="$0"
              period="/month"
              features={[
                "Browse all RFPs",
                "Search & filter by state, trade, keyword",
                "1 saved email alert",
                "Weekly digest",
              ]}
              cta="Get started"
              href="/auth/signup"
            />
            <PricingCard
              name="Pro"
              price="$29"
              period="/month"
              features={[
                "Everything in Free",
                "Unlimited email alerts",
                "Daily digest",
                "AI-powered summaries on every bid",
                "Priority support",
              ]}
              cta="Start free trial"
              href="/auth/signup?plan=pro"
              highlighted
            />
          </div>
          <div className="mt-6 text-center">
            <Link href="/pricing" className="text-sm text-forest-700 hover:underline">
              See full feature comparison →
            </Link>
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
