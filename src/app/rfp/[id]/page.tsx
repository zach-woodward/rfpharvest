import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { stateSlug, townSlug, stateNameFromSlug } from "@/lib/seo/slugs";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rfpharvest.com";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createServiceSupabase();
  const { data: rfp } = await supabase
    .from("rfps")
    .select("title, description, ai_summary, deadline_date, municipality:municipalities(name, state)")
    .eq("id", params.id)
    .single();

  if (!rfp) return { title: "RFP not found" };

  const muni = (rfp.municipality as { name?: string; state?: string } | null) || {};
  const location = muni.name ? `${muni.name}${muni.state ? `, ${muni.state}` : ""}` : "";
  const title = location ? `${rfp.title} — ${location}` : rfp.title;
  const rawDescription =
    rfp.ai_summary ||
    rfp.description ||
    `RFP from ${location || "a U.S. municipality"}. Track deadlines, contacts, and documents on RFP Harvest.`;
  const description = rawDescription.replace(/\s+/g, " ").trim().slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/rfp/${params.id}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE_URL}/rfp/${params.id}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Calendar,
  Clock,
  FileText,
  User,
  Mail,
  Phone,
  Sparkles,
  AlertTriangle,
  DollarSign,
  Download,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DeadlineCountdown from "@/components/dashboard/DeadlineCountdown";
import QuickActions from "@/components/dashboard/QuickActions";
import SimilarRfps from "@/components/dashboard/SimilarRfps";
import type { Rfp, BidRequirement } from "@/types/database";

export default async function RfpDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();

  const { data: rfp } = await supabase
    .from("rfps")
    .select("*, municipality:municipalities(*)")
    .eq("id", params.id)
    .single();

  if (!rfp) notFound();

  // Fetch similar RFPs: same category or same municipality, excluding current
  const similarQueries = [];
  if (rfp.category) {
    similarQueries.push(
      supabase
        .from("rfps")
        .select("*, municipality:municipalities(id, name)")
        .eq("category", rfp.category)
        .eq("status", "open")
        .neq("id", rfp.id)
        .order("deadline_date", { ascending: true, nullsFirst: false })
        .limit(3)
    );
  }
  if (rfp.municipality_id) {
    similarQueries.push(
      supabase
        .from("rfps")
        .select("*, municipality:municipalities(id, name)")
        .eq("municipality_id", rfp.municipality_id)
        .eq("status", "open")
        .neq("id", rfp.id)
        .order("posted_date", { ascending: false })
        .limit(3)
    );
  }

  const similarResults = await Promise.all(similarQueries);
  const seenIds = new Set<string>();
  const similarRfps: Rfp[] = [];
  for (const result of similarResults) {
    for (const r of (result.data || []) as Rfp[]) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        similarRfps.push(r);
      }
    }
  }

  const requirements: BidRequirement[] = rfp.bid_requirements || [];

  const muniState = rfp.municipality?.state ? stateSlug(rfp.municipality.state) : "";
  const muniTown = rfp.municipality?.name ? townSlug(rfp.municipality.name) : "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "GovernmentService",
        name: rfp.title,
        description: (rfp.ai_summary || rfp.description || "").replace(/\s+/g, " ").trim().slice(0, 500) || undefined,
        serviceType: "Request for Proposal",
        url: `${SITE_URL}/rfp/${rfp.id}`,
        provider: rfp.municipality?.name
          ? {
              "@type": "GovernmentOrganization",
              name: `${rfp.municipality.name}${rfp.municipality.state ? `, ${rfp.municipality.state}` : ""}`,
            }
          : undefined,
        availableChannel: rfp.source_url
          ? { "@type": "ServiceChannel", serviceUrl: rfp.source_url }
          : undefined,
        validThrough: rfp.deadline_date || undefined,
        datePosted: rfp.posted_date || undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "RFPs", item: `${SITE_URL}/` },
          muniState && {
            "@type": "ListItem",
            position: 2,
            name: stateNameFromSlug(muniState),
            item: `${SITE_URL}/rfps/${muniState}`,
          },
          muniState && muniTown && rfp.municipality?.name && {
            "@type": "ListItem",
            position: 3,
            name: rfp.municipality.name,
            item: `${SITE_URL}/rfps/${muniState}/${muniTown}`,
          },
          { "@type": "ListItem", position: 4, name: rfp.title, item: `${SITE_URL}/rfp/${rfp.id}` },
        ].filter(Boolean),
      },
    ],
  };

  return (
    <DashboardLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-5xl">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to RFPs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main content — left 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <StatusBadge status={rfp.status} />
                  <h1 className="text-xl font-bold text-slate-900 mt-2">
                    {rfp.title}
                  </h1>
                </div>
                {rfp.source_url && (
                  <a
                    href={rfp.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Source
                  </a>
                )}
              </div>

              {/* Key info grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                {rfp.municipality && (
                  <InfoItem
                    icon={<MapPin className="w-4 h-4" />}
                    label="Municipality"
                    value={rfp.municipality.name}
                  />
                )}
                {rfp.category && (
                  <InfoItem
                    icon={<FileText className="w-4 h-4" />}
                    label="Category"
                    value={rfp.category}
                  />
                )}
                {rfp.posted_date && (
                  <InfoItem
                    icon={<Calendar className="w-4 h-4" />}
                    label="Posted"
                    value={formatDate(rfp.posted_date)}
                  />
                )}
                {rfp.estimated_value && (
                  <InfoItem
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Est. Value"
                    value={rfp.estimated_value}
                    highlight
                  />
                )}
              </div>
            </div>

            {/* AI Summary — prominent position */}
            {rfp.ai_summary && (
              <div className="bg-forest-50 border border-forest-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-forest-600" />
                  <h2 className="text-sm font-semibold text-forest-800">
                    AI Summary
                  </h2>
                  {rfp.ai_summary_generated_at && (
                    <span className="text-xs text-forest-500 ml-auto">
                      Generated {formatDate(rfp.ai_summary_generated_at)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-forest-900 leading-relaxed whitespace-pre-wrap">
                  {rfp.ai_summary}
                </p>
              </div>
            )}

            {rfp.requires_signup && (
              <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Documents require registration
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Full RFP documents require signing up on the source website.
                  </p>
                </div>
              </div>
            )}

            {/* Key Dates */}
            {(rfp.pre_bid_date || rfp.qa_deadline || rfp.deadline_date) && (
              <div className="bg-white border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                  Key Dates
                </h2>
                <div className="space-y-3">
                  {rfp.posted_date && (
                    <DateRow
                      label="Posted"
                      date={rfp.posted_date}
                      isPast
                    />
                  )}
                  {rfp.pre_bid_date && (
                    <DateRow
                      label="Pre-bid meeting"
                      date={rfp.pre_bid_date}
                    />
                  )}
                  {rfp.qa_deadline && (
                    <DateRow
                      label="Q&A deadline"
                      date={rfp.qa_deadline}
                    />
                  )}
                  {rfp.deadline_date && (
                    <DateRow
                      label="Bid due date"
                      date={rfp.deadline_date}
                      isFinal
                    />
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {rfp.description && (
              <div className="bg-white border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                  Description
                </h2>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {rfp.description}
                </p>
              </div>
            )}

            {/* Bid Requirements */}
            {requirements.length > 0 && (
              <div className="bg-white border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                  Bid Requirements
                </h2>
                <ul className="space-y-2">
                  {requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Circle className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-slate-800">
                          {req.label}
                        </span>
                        {req.details && (
                          <p className="text-xs text-slate-600 mt-0.5">
                            {req.details}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Documents */}
            {rfp.document_urls && rfp.document_urls.length > 0 && (
              <div className="bg-white border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                  Documents & Attachments
                </h2>
                <div className="space-y-2">
                  {rfp.document_urls.map((url: string, i: number) => {
                    const fileName = decodeURIComponent(
                      url.split("/").pop() || `Document ${i + 1}`
                    );
                    const isPdf = url.toLowerCase().endsWith(".pdf");
                    return (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="w-9 h-9 bg-slate-100 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-800 truncate group-hover:text-forest-700">
                            {fileName}
                          </div>
                          <div className="text-xs text-slate-600">
                            {isPdf ? "PDF" : "Document"}
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-slate-600 shrink-0" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact */}
            {(rfp.contact_name || rfp.contact_email || rfp.contact_phone) && (
              <div className="bg-white border border-slate-200 p-6">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                  Contact
                </h2>
                <div className="space-y-2">
                  {rfp.contact_name && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <User className="w-4 h-4 text-slate-600" />
                      {rfp.contact_name}
                    </div>
                  )}
                  {rfp.contact_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-slate-600" />
                      <a
                        href={`mailto:${rfp.contact_email}`}
                        className="text-forest-600 hover:underline"
                      >
                        {rfp.contact_email}
                      </a>
                    </div>
                  )}
                  {rfp.contact_phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Phone className="w-4 h-4 text-slate-600" />
                      <a href={`tel:${rfp.contact_phone}`} className="hover:underline">
                        {rfp.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — right column */}
          <div className="space-y-4">
            {/* Deadline countdown */}
            {rfp.deadline_date && (
              <DeadlineCountdown deadline={rfp.deadline_date} />
            )}

            {/* Estimated value callout */}
            {rfp.estimated_value && (
              <div className="bg-white border border-slate-200 p-4">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Estimated Value
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {rfp.estimated_value}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <QuickActions
              rfpId={rfp.id}
              rfpTitle={rfp.title}
              municipalityId={rfp.municipality_id}
              municipalityName={rfp.municipality?.name}
            />

            {/* Similar RFPs */}
            {similarRfps.length > 0 && (
              <SimilarRfps rfps={similarRfps.slice(0, 5)} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function InfoItem({
  icon,
  label,
  value,
  urgent,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  urgent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
        {icon}
        {label}
      </div>
      <div
        className={cn(
          "text-sm font-medium",
          urgent
            ? "text-red-600"
            : highlight
            ? "text-forest-700"
            : "text-slate-900"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function DateRow({
  label,
  date,
  isPast,
  isFinal,
}: {
  label: string;
  date: string;
  isPast?: boolean;
  isFinal?: boolean;
}) {
  const d = new Date(date);
  const isInPast = d.getTime() < Date.now();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isInPast || isPast ? (
          <CheckCircle2 className="w-4 h-4 text-slate-300" />
        ) : (
          <Circle
            className={cn(
              "w-4 h-4",
              isFinal ? "text-forest-500" : "text-slate-600"
            )}
          />
        )}
        <span
          className={cn(
            "text-sm",
            isInPast || isPast ? "text-slate-600" : "text-slate-700"
          )}
        >
          {label}
        </span>
      </div>
      <span
        className={cn(
          "text-sm font-medium",
          isInPast || isPast
            ? "text-slate-600"
            : isFinal
            ? "text-forest-700"
            : "text-slate-900"
        )}
      >
        {formatDateTime(date)}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-green-50 text-green-700 border-green-200",
    closed: "bg-slate-100 text-slate-600 border-slate-200",
    awarded: "bg-blue-50 text-blue-700 border-blue-200",
    canceled: "bg-red-50 text-red-600 border-red-200",
    unknown: "bg-slate-50 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-block text-xs font-medium px-2 py-0.5 border capitalize",
        styles[status] || styles.unknown
      )}
    >
      {status}
    </span>
  );
}
