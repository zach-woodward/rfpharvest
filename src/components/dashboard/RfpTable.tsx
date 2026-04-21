"use client";

import Link from "next/link";
import { ExternalLink, Clock, MapPin, DollarSign } from "lucide-react";
import { formatDate, deadlineLabel, cn } from "@/lib/utils";
import type { Rfp } from "@/types/database";

interface RfpTableProps {
  rfps: Rfp[];
  loading?: boolean;
}

export default function RfpTable({ rfps, loading }: RfpTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 p-4 animate-pulse">
            <div className="h-4 bg-slate-200 w-3/4 mb-3" />
            <div className="h-3 bg-slate-100 w-1/2 mb-2" />
            <div className="h-3 bg-slate-100 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (rfps.length === 0) {
    return (
      <div className="bg-white border border-slate-200 p-12 text-center">
        <p className="text-sm text-slate-600">No RFPs match your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rfps.map((rfp) => (
        <RfpRow key={rfp.id} rfp={rfp} />
      ))}
    </div>
  );
}

function RfpRow({ rfp }: { rfp: Rfp }) {
  const deadline = deadlineLabel(rfp.deadline_date);

  return (
    <Link
      href={`/rfp/${rfp.id}`}
      className="block bg-white border border-slate-200 hover:border-slate-300 transition-colors p-4 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Title */}
          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-forest-700 transition-colors truncate">
            {rfp.title}
          </h3>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            {rfp.municipality && (
              <span className="flex items-center gap-1 text-xs text-slate-600">
                <MapPin className="w-3 h-3" />
                {rfp.municipality.name}
                {rfp.municipality.state && (
                  <span className="text-slate-400 font-medium ml-0.5">
                    {rfp.municipality.state}
                  </span>
                )}
              </span>
            )}
            {rfp.category && (
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5">
                {rfp.category}
              </span>
            )}
            {rfp.posted_date && (
              <span className="text-xs text-slate-600">
                Posted {formatDate(rfp.posted_date)}
              </span>
            )}
          </div>

          {/* Description preview */}
          {rfp.description && (
            <p className="text-xs text-slate-600 mt-2 line-clamp-2">
              {rfp.description}
            </p>
          )}
        </div>

        {/* Right side: deadline + status */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <StatusBadge status={rfp.status} />
          {rfp.estimated_value && (
            <span className="flex items-center gap-1 text-xs font-semibold text-forest-700">
              <DollarSign className="w-3 h-3" />
              {rfp.estimated_value}
            </span>
          )}
          {rfp.deadline_date && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                deadline.urgent ? "text-red-600" : "text-slate-600"
              )}
            >
              <Clock className="w-3 h-3" />
              {deadline.text}
            </span>
          )}
          {rfp.source_url && (
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Source
            </span>
          )}
        </div>
      </div>
    </Link>
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
        "text-xs font-medium px-2 py-0.5 border capitalize",
        styles[status] || styles.unknown
      )}
    >
      {status}
    </span>
  );
}
