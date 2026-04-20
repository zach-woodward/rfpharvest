import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";
import { GUIDES, guideBySlug } from "@/lib/seo/guides";
import Footer from "@/components/layout/Footer";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rfpharvest.com";

type PageParams = { slug: string };

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const guide = guideBySlug(params.slug);
  if (!guide) return { title: "Guide not found" };

  return {
    title: guide.title,
    description: guide.metaDescription,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.metaDescription,
      url: `${SITE_URL}/guides/${guide.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.metaDescription,
    },
  };
}

export default function GuidePage({ params }: { params: PageParams }) {
  const guide = guideBySlug(params.slug);
  if (!guide) notFound();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.metaDescription,
    url: `${SITE_URL}/guides/${guide.slug}`,
    author: { "@type": "Organization", name: "RFP Harvest" },
    publisher: { "@type": "Organization", name: "RFP Harvest", url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/guides/${guide.slug}` },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Guides", item: `${SITE_URL}/guides` },
      { "@type": "ListItem", position: 2, name: guide.title, item: `${SITE_URL}/guides/${guide.slug}` },
    ],
  };

  const faqLd =
    guide.faq && guide.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: guide.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}

      <article className="max-w-3xl mx-auto px-4 py-10 flex-1 w-full">
        <Link
          href="/guides"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All guides
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-3">
            <BookOpen className="w-3 h-3" />
            Guide
            <span className="text-slate-300">·</span>
            <Clock className="w-3 h-3" />
            {guide.readMinutes} min read
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
            {guide.title}
          </h1>
          <p className="mt-4 text-lg text-slate-700 leading-relaxed">{guide.subtitle}</p>
        </header>

        <div className="prose prose-slate max-w-none">
          {guide.sections.map((section, i) => (
            <section key={i} className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-3 mt-8">{section.heading}</h2>
              {section.paragraphs.map((p, j) => (
                <p key={j} className="text-slate-700 leading-relaxed mb-4">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        {guide.faq && guide.faq.length > 0 && (
          <section className="mt-10 pt-8 border-t border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Frequently asked questions</h2>
            <div className="space-y-5">
              {guide.faq.map((f, i) => (
                <div key={i}>
                  <h3 className="font-semibold text-slate-900 mb-1">{f.q}</h3>
                  <p className="text-slate-700 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {guide.internalLinks && guide.internalLinks.length > 0 && (
          <section className="mt-10 pt-8 border-t border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Keep reading</h2>
            <ul className="space-y-2">
              {guide.internalLinks.map((link, i) => (
                <li key={i}>
                  <Link href={link.href} className="text-forest-700 hover:underline">
                    {link.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 bg-white border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-2">
            Get alerts on new RFPs that match your business
          </h2>
          <p className="text-sm text-slate-600 mb-3">
            RFP Harvest emails you the moment a new municipal RFP is posted in your trade. Free to start.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-forest-700 hover:bg-forest-800 text-white px-4 py-2 text-sm font-medium"
          >
            Set up free alerts
          </Link>
        </section>
      </article>
      <Footer />
    </div>
  );
}
