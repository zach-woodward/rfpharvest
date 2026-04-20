import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import { GUIDES } from "@/lib/seo/guides";
import Footer from "@/components/layout/Footer";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rfpharvest.com";

export const metadata: Metadata = {
  title: "Guides to Municipal RFPs & Government Contracting",
  description:
    "Plain-English guides for small contractors: what RFPs are, how to win your first bid, how bonding works, and how to get certified as a small business.",
  alternates: { canonical: "/guides" },
  openGraph: {
    type: "website",
    title: "Guides to Municipal RFPs & Government Contracting",
    description:
      "Plain-English guides for small contractors on municipal procurement, bidding, bonding, and small business certifications.",
    url: `${SITE_URL}/guides`,
  },
};

export default function GuidesIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Guides to Municipal RFPs & Government Contracting",
    url: `${SITE_URL}/guides`,
    isPartOf: { "@type": "WebSite", url: SITE_URL, name: "RFP Harvest" },
    hasPart: GUIDES.map((g) => ({
      "@type": "Article",
      headline: g.title,
      description: g.metaDescription,
      url: `${SITE_URL}/guides/${g.slug}`,
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 py-10 flex-1 w-full">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <BookOpen className="w-4 h-4" />
            Guides
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Guides to Municipal RFPs &amp; Government Contracting
          </h1>
          <p className="mt-3 text-slate-700 max-w-2xl">
            Plain-English reference material for small contractors entering municipal work.
            No jargon, no sales pitch — just what you need to know to bid, win, and deliver.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="block bg-white border border-slate-200 hover:border-forest-400 hover:shadow-sm transition-all p-5"
            >
              <h2 className="text-lg font-semibold text-slate-900">{g.title}</h2>
              <p className="mt-2 text-sm text-slate-600 line-clamp-3">{g.metaDescription}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {g.readMinutes} min read
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
