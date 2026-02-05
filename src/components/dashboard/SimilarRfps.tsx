import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { formatDate, deadlineLabel, cn } from "@/lib/utils";
import type { Rfp } from "@/types/database";

interface SimilarRfpsProps {
  rfps: Rfp[];
}

export default function SimilarRfps({ rfps }: SimilarRfpsProps) {
  if (rfps.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">
          Similar Opportunities
        </h2>
      </div>
      <div className="divide-y divide-slate-100">
        {rfps.map((rfp) => {
          const dl = deadlineLabel(rfp.deadline_date);
          return (
            <Link
              key={rfp.id}
              href={`/rfp/${rfp.id}`}
              className="block px-4 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="text-sm font-medium text-slate-900 hover:text-forest-700 line-clamp-1">
                {rfp.title}
              </div>
              <div className="flex items-center gap-3 mt-1">
                {rfp.municipality && (
                  <span className="flex items-center gap-1 text-xs text-slate-600">
                    <MapPin className="w-3 h-3" />
                    {rfp.municipality.name}
                  </span>
                )}
                {rfp.deadline_date && (
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      dl.urgent ? "text-red-600" : "text-slate-600"
                    )}
                  >
                    <Clock className="w-3 h-3" />
                    {dl.text}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
