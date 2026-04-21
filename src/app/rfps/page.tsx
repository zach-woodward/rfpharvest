import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Layers, Clock } from "lucide-react";
import { createPublicSupabase } from "@/lib/supabase/server";
import { stateSlug, stateNameFromSlug } from "@/lib/seo/slugs";
import { TOPICS } from "@/lib/seo/topics";
import Footer from "@/components/layout/Footer";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rfpharvest.com";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "RFPs & Municipal Bid Opportunities by State",
  description:
    "Live RFPs, bid requests, and government contract opportunities from U.S. municipalities. Browse by state, by town, or by trade — updated every six hours.",
  alternates: { canonical: "/rfps" },
  openGraph: {
    type: "website",
    title: "RFPs & Municipal Bid Opportunities by State",
    description:
      "Live RFPs, bid requests, and government contract opportunities from U.S. municipalities. Browse by state, by town, or by trade.",
    url: `${SITE_URL}/rfps`,
  },
};

export default async function RfpsIndexPage() {
  const supabase = createPublicSupabase();

  const [{ data: municipalities }, { count: totalOpen }] = await Promise.all([
    supabase.from("municipalities").select("id, name, state").eq("active", true),
    supabase.from("rfps").select("*", { count: "exact", head: true }).eq("status", "open"),
  ]);

  const byState = new Map<string, { state: string; townCount: number; muniIds: string[] }>();
  for (const m of municipalities || []) {
    const key = (m.state || "").toUpperCase();
    if (!key) continue;
    const entry: { state: string; townCount: number; muniIds: string[] } =
      byState.get(key) || { state: key, townCount: 0, muniIds: [] };
    entry.townCount += 1;
    entry.muniIds.push(m.id as string);
    byState.set(key, entry);
  }

  const stateIds: Record<string, string[]> = {};
  byState.forEach((v, k) => (stateIds[k] = v.muniIds));
  const muniIdToState = new Map<string, string>();
  for (const [st, ids] of Object.entries(stateIds)) {
    for (const id of ids) muniIdToState.set(id, st);
  }

  const { data: openRfps } = await supabase
    .from("rfps")
    .select("municipality_id")
    .eq("status", "open");

  const openByState = new Map<string, number>();
  for (const row of openRfps || []) {
    const st = muniIdToState.get(row.municipality_id);
    if (!st) continue;
    openByState.set(st, (openByState.get(st) || 0) + 1);
  }

  const states = Array.from(byState.values())
    .map((s) => ({
      ...s,
      openCount: openByState.get(s.state) || 0,
      name: stateNameFromSlug(s.state),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "RFPs & Municipal Bid Opportunities by State",
    url: `${SITE_URL}/rfps`,
    isPartOf: { "@type": "WebSite", url: SITE_URL, name: "RFP Harvest" },
    hasPart: states.map((s) => ({
      "@type": "WebPage",
      name: `${s.name} RFPs`,
      url: `${SITE_URL}/rfps/${stateSlug(s.state)}`,
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-6xl mx-auto px-4 py-10 flex-1 w-full">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">
            RFPs &amp; Municipal Bid Opportunities
          </h1>
          <p className="mt-3 text-slate-700 max-w-2xl">
            Live requests for proposals, bid requests, and government contract opportunities
            scraped directly from {municipalities?.length || 0} municipal websites.{" "}
            <span className="font-semibold">{totalOpen || 0} open</span> right now. Pages
            update every six hours.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Browse by state
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {states.map((s) => (
              <Link
                key={s.state}
                href={`/rfps/${stateSlug(s.state)}`}
                className="block bg-white border border-slate-200 hover:border-forest-400 hover:shadow-sm transition-all p-4"
              >
                <div className="font-semibold text-slate-900">{s.name}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {s.townCount} {s.townCount === 1 ? "town" : "towns"}
                </div>
                <div className="mt-2 text-sm text-forest-700 font-medium">
                  {s.openCount} open {s.openCount === 1 ? "bid" : "bids"}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Browse by trade
          </h2>
          <p className="text-sm text-slate-600 mb-4 max-w-2xl">
            Topic pages aggregate bids across every state we cover. Useful if you&apos;re bidding
            in one trade and want a single feed of relevant opportunities.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TOPICS.map((t) => (
              <Link
                key={t.slug}
                href={`/rfps/topic/${t.slug}`}
                className="block bg-white border border-slate-200 hover:border-forest-400 hover:shadow-sm transition-all p-4"
              >
                <div className="font-semibold text-slate-900">{t.name} RFPs</div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{t.metaDescription}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 bg-white border border-slate-200 p-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-forest-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-900">Updated every 6 hours</h3>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                RFP Harvest crawls every municipal website on its watch list on a six-hour
                cycle, deduplicates, normalizes titles and dates, and surfaces anything new.
                Sign up for free to get email alerts the moment a new bid matching your
                filters is posted.
              </p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
