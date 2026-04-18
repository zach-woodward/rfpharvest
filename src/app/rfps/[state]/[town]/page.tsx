import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, ExternalLink } from "lucide-react";
import { createServiceSupabase } from "@/lib/supabase/server";
import { stateNameFromSlug, townSlug } from "@/lib/seo/slugs";
import { formatDate } from "@/lib/utils";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rfpharvest.com";

export const revalidate = 1800; // 30 min

type PageParams = { state: string; town: string };

async function resolveMunicipality(stateSlugParam: string, townSlugParam: string) {
  const supabase = createServiceSupabase();
  const { data: municipalities } = await supabase
    .from("municipalities")
    .select("id, name, state, county, website_url, rfp_page_url")
    .ilike("state", stateSlugParam)
    .eq("active", true);

  return (municipalities || []).find(
    (m) => townSlug(m.name) === townSlugParam.toLowerCase()
  );
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const muni = await resolveMunicipality(params.state, params.town);
  if (!muni) return { title: "Municipality not found" };

  const stateName = stateNameFromSlug(params.state);
  const title = `${muni.name}, ${stateName} RFPs & Bid Opportunities`;
  const description = `Open RFPs, bid requests, and government contract opportunities from ${muni.name}, ${stateName}. Deadlines, contacts, and documents updated daily by RFP Harvest.`;

  return {
    title,
    description,
    alternates: { canonical: `/rfps/${params.state}/${params.town}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/rfps/${params.state}/${params.town}`,
    },
  };
}

export default async function TownRfpsPage({ params }: { params: PageParams }) {
  const muni = await resolveMunicipality(params.state, params.town);
  if (!muni) notFound();

  const supabase = createServiceSupabase();
  const { data: rfps } = await supabase
    .from("rfps")
    .select("id, title, description, category, status, posted_date, deadline_date, source_url")
    .eq("municipality_id", muni.id)
    .order("posted_date", { ascending: false, nullsFirst: false })
    .limit(100);

  const openRfps = (rfps || []).filter((r) => r.status === "open");
  const pastRfps = (rfps || []).filter((r) => r.status !== "open");

  const stateName = stateNameFromSlug(params.state);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "GovernmentOrganization",
        name: `${muni.name}, ${stateName}`,
        url: muni.website_url || undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "RFPs", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: stateName, item: `${SITE_URL}/rfps/${params.state}` },
          { "@type": "ListItem", position: 3, name: muni.name, item: `${SITE_URL}/rfps/${params.state}/${params.town}` },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link
          href={`/rfps/${params.state}`}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          All {stateName} municipalities
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <MapPin className="w-4 h-4" />
            {stateName}
            {muni.county && <span>· {muni.county} County</span>}
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            {muni.name} RFPs &amp; Bid Opportunities
          </h1>
          <p className="mt-3 text-slate-700 max-w-2xl">
            Open requests for proposals, bid requests, and government contract opportunities from{" "}
            {muni.name}, {stateName}. Updated daily from{" "}
            {muni.website_url ? (
              <a href={muni.website_url} className="text-forest-700 underline" target="_blank" rel="noopener noreferrer">
                the municipal website
              </a>
            ) : (
              "the municipal website"
            )}
            .
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Open opportunities{" "}
            <span className="text-sm font-normal text-slate-600">({openRfps.length})</span>
          </h2>
          {openRfps.length === 0 ? (
            <p className="text-sm text-slate-600 bg-white border border-slate-200 p-6">
              No open RFPs from {muni.name} right now. Check back — we re-scrape every six hours.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 bg-white border border-slate-200">
              {openRfps.map((rfp) => (
                <RfpRow key={rfp.id} rfp={rfp} />
              ))}
            </ul>
          )}
        </section>

        {pastRfps.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Recent closed / awarded</h2>
            <ul className="divide-y divide-slate-200 bg-white border border-slate-200">
              {pastRfps.slice(0, 20).map((rfp) => (
                <RfpRow key={rfp.id} rfp={rfp} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function RfpRow({
  rfp,
}: {
  rfp: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    status: string;
    posted_date: string | null;
    deadline_date: string | null;
    source_url: string | null;
  };
}) {
  return (
    <li className="px-4 py-4">
      <Link href={`/rfp/${rfp.id}`} className="block group">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-medium text-slate-900 group-hover:text-forest-700">
              {rfp.title}
            </h3>
            {rfp.description && (
              <p className="mt-1 text-sm text-slate-600 line-clamp-2">{rfp.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {rfp.category && <span>{rfp.category}</span>}
              {rfp.posted_date && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Posted {formatDate(rfp.posted_date)}
                </span>
              )}
              {rfp.deadline_date && (
                <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                  Due {formatDate(rfp.deadline_date)}
                </span>
              )}
            </div>
          </div>
          {rfp.source_url && (
            <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
          )}
        </div>
      </Link>
    </li>
  );
}
