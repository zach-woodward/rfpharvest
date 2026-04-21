import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ArrowLeft, MapPin } from "lucide-react";
import { createServiceSupabase } from "@/lib/supabase/server";
import { TOPICS, topicBySlug, type Topic } from "@/lib/seo/topics";
import { stateSlug, townSlug, stateNameFromSlug } from "@/lib/seo/slugs";
import { formatDate } from "@/lib/utils";
import Footer from "@/components/layout/Footer";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rfpharvest.com";

export const revalidate = 1800;

type PageParams = { topic: string };

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const topic = topicBySlug(params.topic);
  if (!topic) return { title: "Topic not found" };

  const title = `${topic.name} RFPs & Bid Opportunities`;
  return {
    title,
    description: topic.metaDescription,
    alternates: { canonical: `/rfps/topic/${topic.slug}` },
    openGraph: {
      type: "website",
      title,
      description: topic.metaDescription,
      url: `${SITE_URL}/rfps/topic/${topic.slug}`,
    },
  };
}

async function loadTopicRfps(topic: Topic) {
  const supabase = createServiceSupabase();
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
    .select("id, title, description, category, status, posted_date, deadline_date, municipality:municipalities(id, name, state)")
    .or(orClauses)
    .order("deadline_date", { ascending: true, nullsFirst: false })
    .limit(200);

  const all = ((rfps || []) as unknown) as Array<{
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    status: string;
    posted_date: string | null;
    deadline_date: string | null;
    municipality: { id: string; name: string; state: string } | null;
  }>;

  const open = all.filter((r) => r.status === "open");
  const stateCount = new Set(all.map((r) => r.municipality?.state).filter(Boolean)).size;
  return { open, otherCount: all.length - open.length, stateCount };
}

export default async function TopicRfpsPage({ params }: { params: PageParams }) {
  const topic = topicBySlug(params.topic);
  if (!topic) notFound();

  const { open, otherCount, stateCount } = await loadTopicRfps(topic);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${topic.name} RFPs`,
        description: topic.metaDescription,
        url: `${SITE_URL}/rfps/topic/${topic.slug}`,
        isPartOf: { "@type": "WebSite", url: SITE_URL, name: "RFP Harvest" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "RFPs", item: `${SITE_URL}/rfps` },
          { "@type": "ListItem", position: 2, name: topic.name, item: `${SITE_URL}/rfps/topic/${topic.slug}` },
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
      <div className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        <Link
          href="/rfps"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          All topics
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{topic.name} RFPs &amp; Bid Opportunities</h1>
          <p className="mt-3 text-slate-700 max-w-2xl">{topic.intro}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
            <span>
              <strong className="text-slate-900">{open.length}</strong> open
            </span>
            {otherCount > 0 && (
              <span>
                <strong className="text-slate-900">{otherCount}</strong> recent closed / awarded
              </span>
            )}
            {stateCount > 0 && (
              <span>
                Across <strong className="text-slate-900">{stateCount}</strong>{" "}
                {stateCount === 1 ? "state" : "states"}
              </span>
            )}
          </div>
        </header>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Open {topic.plural} opportunities
          </h2>
          {open.length === 0 ? (
            <p className="text-sm text-slate-600 bg-white border border-slate-200 p-6">
              No open {topic.name.toLowerCase()} bids right now. Check back — we re-scrape every six
              hours.
            </p>
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
            Get alerts for new {topic.name} bids
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            Sign up free to get an email the moment a new {topic.name.toLowerCase()} RFP is posted in
            any of our tracked municipalities. No spam; unsubscribe anytime.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-forest-700 hover:bg-forest-800 text-white px-4 py-2 text-sm font-medium"
          >
            Set up free alerts
          </Link>
        </section>

        <section className="mt-10">
          <h2 className="text-base font-semibold text-slate-900 mb-3">
            {topic.name} RFPs by state
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {["nh", "me", "ma", "ct", "ri", "vt"].map((s) => (
              <Link
                key={s}
                href={`/rfps/${s}/topic/${topic.slug}`}
                className="block bg-white border border-slate-200 hover:border-forest-400 hover:shadow-sm transition-all px-3 py-2 text-sm text-slate-800 text-center"
              >
                {s.toUpperCase()}
              </Link>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
