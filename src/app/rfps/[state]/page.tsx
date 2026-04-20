import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowLeft } from "lucide-react";
import { createServiceSupabase } from "@/lib/supabase/server";
import { stateNameFromSlug, townSlug } from "@/lib/seo/slugs";
import { TOPICS } from "@/lib/seo/topics";
import Footer from "@/components/layout/Footer";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rfpharvest.com";

export const revalidate = 1800;

type PageParams = { state: string };

async function loadStateData(stateSlugParam: string) {
  const supabase = createServiceSupabase();
  const { data: municipalities } = await supabase
    .from("municipalities")
    .select("id, name, state, county")
    .ilike("state", stateSlugParam)
    .eq("active", true)
    .order("name");

  if (!municipalities?.length) return null;

  const muniIds = municipalities.map((m) => m.id);
  const { data: openCounts } = await supabase
    .from("rfps")
    .select("municipality_id")
    .in("municipality_id", muniIds)
    .eq("status", "open");

  const countByMuni = new Map<string, number>();
  for (const row of openCounts || []) {
    countByMuni.set(row.municipality_id, (countByMuni.get(row.municipality_id) || 0) + 1);
  }

  return {
    municipalities: municipalities.map((m) => ({
      ...m,
      open_count: countByMuni.get(m.id) || 0,
    })),
    totalOpen: (openCounts || []).length,
  };
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const data = await loadStateData(params.state);
  if (!data) return { title: "State not covered" };

  const stateName = stateNameFromSlug(params.state);
  const title = `${stateName} RFPs — Municipal Bid Opportunities`;
  const description = `Live RFPs and government contract opportunities from ${data.municipalities.length} ${stateName} municipalities. ${data.totalOpen} open bids right now.`;

  return {
    title,
    description,
    alternates: { canonical: `/rfps/${params.state}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/rfps/${params.state}`,
    },
  };
}

export default async function StateRfpsPage({ params }: { params: PageParams }) {
  const data = await loadStateData(params.state);
  if (!data) notFound();

  const stateName = stateNameFromSlug(params.state);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "RFPs", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: stateName, item: `${SITE_URL}/rfps/${params.state}` },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          All coverage
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <MapPin className="w-4 h-4" />
            {stateName}
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{stateName} RFPs &amp; Bid Opportunities</h1>
          <p className="mt-3 text-slate-700 max-w-2xl">
            Tracking {data.municipalities.length} municipalities in {stateName} with{" "}
            <span className="font-semibold">{data.totalOpen} open</span> requests for proposals. Click any town to browse its current bids.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.municipalities.map((m) => (
            <Link
              key={m.id}
              href={`/rfps/${params.state}/${townSlug(m.name)}`}
              className="block bg-white border border-slate-200 hover:border-forest-400 hover:shadow-sm transition-all p-4"
            >
              <div className="font-medium text-slate-900">{m.name}</div>
              {m.county && <div className="text-xs text-slate-500 mt-0.5">{m.county} County</div>}
              <div className="mt-2 text-sm text-forest-700">
                {m.open_count} open {m.open_count === 1 ? "bid" : "bids"}
              </div>
            </Link>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            {stateName} RFPs by trade
          </h2>
          <p className="text-sm text-slate-600 mb-4 max-w-2xl">
            Jump to {stateName}-specific listings for a single trade — construction, HVAC,
            paving, engineering, and more.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {TOPICS.map((t) => (
              <Link
                key={t.slug}
                href={`/rfps/${params.state}/topic/${t.slug}`}
                className="block bg-white border border-slate-200 hover:border-forest-400 hover:shadow-sm transition-all px-3 py-2 text-sm text-slate-800"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
