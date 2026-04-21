import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { createServiceSupabase } from "@/lib/supabase/server";
import { topicBySlug, type Topic } from "@/lib/seo/topics";
import { stateSlug, townSlug, stateNameFromSlug } from "@/lib/seo/slugs";
import { formatDate } from "@/lib/utils";
import Footer from "@/components/layout/Footer";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rfpharvest.com";

export const revalidate = 1800;

const COVERED_STATES = ["nh", "me", "ma", "ct", "ri", "vt"];

type PageParams = { state: string; topic: string };

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const topic = topicBySlug(params.topic);
  if (!topic) return { title: "Topic not found" };
  const stateName = stateNameFromSlug(params.state);
  const title = `${topic.name} RFPs in ${stateName}`;
  const description = `Open ${topic.name.toLowerCase()} bid opportunities from ${stateName} municipalities. ${topic.metaDescription}`;
  return {
    title,
    description,
    alternates: { canonical: `/rfps/${params.state}/topic/${params.topic}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/rfps/${params.state}/topic/${params.topic}`,
    },
  };
}

async function loadStateTopicRfps(state: string, topic: Topic) {
  const supabase = createServiceSupabase();

  const { data: muniRows } = await supabase
    .from("municipalities")
    .select("id, name, state")
    .ilike("state", state)
    .eq("active", true);

  const muniIds = (muniRows || []).map((m) => m.id as string);
  if (muniIds.length === 0) return { open: [], otherCount: 0, muniCount: 0 };

  const orClauses = topic.keywords
    .map((k) => {
      const escaped = k.replace(/[%_,()]/g, (c) => `\\${c}`);
      return [
        `title.ilike.%${escaped}%`,
        `description.ilike.%${escaped}%`,
        `category.ilike.%${escaped}%`,
      ].join(",");
    })
    .join(",");

  const { data: rfps } = await supabase
    .from("rfps")
    .select("id, title, description, category, status, deadline_date, municipality:municipalities(id, name, state)")
    .in("municipality_id", muniIds)
    .or(orClauses)
    .order("deadline_date", { ascending: true, nullsFirst: false })
    .limit(200);

  const all = ((rfps || []) as unknown) as Array<{
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    status: string;
    deadline_date: string | null;
    municipality: { id: string; name: string; state: string } | null;
  }>;

  const open = all.filter((r) => r.status === "open");
  return { open, otherCount: all.length - open.length, muniCount: muniIds.length };
}

export default async function StateTopicPage({ params }: { params: PageParams }) {
  const topic = topicBySlug(params.topic);
  if (!topic) notFound();
  if (!COVERED_STATES.includes(params.state.toLowerCase())) notFound();

  const stateName = stateNameFromSlug(params.state);
  const { open, otherCount, muniCount } = await loadStateTopicRfps(params.state, topic);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${topic.name} RFPs in ${stateName}`,
        url: `${SITE_URL}/rfps/${params.state}/topic/${params.topic}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "RFPs", item: `${SITE_URL}/rfps` },
          { "@type": "ListItem", position: 2, name: stateName, item: `${SITE_URL}/rfps/${params.state}` },
          { "@type": "ListItem", position: 3, name: topic.name, item: `${SITE_URL}/rfps/${params.state}/topic/${params.topic}` },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">
        <Link
          href={`/rfps/${params.state}`}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          All {stateName} RFPs
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {topic.name} RFPs in {stateName}
          </h1>
          <p className="mt-3 text-slate-700 max-w-2xl">
            {topic.intro} This page filters to bids posted by {stateName} municipalities only.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
            <span>
              <strong className="text-slate-900">{open.length}</strong> open in {stateName}
            </span>
            {otherCount > 0 && (
              <span>
                <strong className="text-slate-900">{otherCount}</strong> recent closed / awarded
              </span>
            )}
            <span>
              Tracking{" "}
              <strong className="text-slate-900">{muniCount}</strong> {stateName}{" "}
              {muniCount === 1 ? "municipality" : "municipalities"}
            </span>
          </div>
        </header>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Open {topic.plural} opportunities in {stateName}
          </h2>
          {open.length === 0 ? (
            <div className="bg-white border border-slate-200 p-6">
              <p className="text-sm text-slate-600">
                No open {topic.name.toLowerCase()} bids in {stateName} right now. Check back — we
                re-scrape every six hours.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <Link
                  href={`/rfps/topic/${topic.slug}`}
                  className="text-forest-700 hover:underline"
                >
                  → See {topic.name.toLowerCase()} RFPs in all states
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 bg-white border border-slate-200">
              {open.map((rfp) => (
                <li key={rfp.id} className="px-4 py-4">
                  <Link href={`/rfp/${rfp.id}`} className="block group">
                    <h3 className="text-base font-medium text-slate-900 group-hover:text-forest-700">
                      {rfp.title}
                    </h3>
                    {rfp.description && (
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{rfp.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {rfp.municipality && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <Link
                            href={`/rfps/${stateSlug(rfp.municipality.state)}/${townSlug(rfp.municipality.name)}`}
                            className="hover:text-forest-700"
                          >
                            {rfp.municipality.name}, {rfp.municipality.state}
                          </Link>
                        </span>
                      )}
                      {rfp.category && <span>{rfp.category}</span>}
                      {rfp.deadline_date && (
                        <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                          <Calendar className="w-3 h-3" />
                          Due {formatDate(rfp.deadline_date)}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10 bg-white border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-2">
            Get alerts on new {topic.name} bids in {stateName}
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            Sign up free to get an email the moment a new {topic.name.toLowerCase()} RFP is posted
            in {stateName}.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-forest-700 hover:bg-forest-800 text-white px-4 py-2 text-sm font-medium"
          >
            Set up free alerts
          </Link>
        </section>
      </div>
      <Footer />
    </div>
  );
}
