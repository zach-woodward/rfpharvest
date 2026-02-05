"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DeadlineCountdownProps {
  deadline: string;
}

export default function DeadlineCountdown({ deadline }: DeadlineCountdownProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const target = new Date(deadline);
  const diff = target.getTime() - now.getTime();

  if (diff < 0) {
    return (
      <div className="bg-slate-100 border border-slate-200 p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Deadline
        </div>
        <div className="text-lg font-bold text-slate-500">Closed</div>
        <div className="text-xs text-slate-400 mt-1">
          {target.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
      </div>
    );
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const urgent = days <= 3;
  const warning = days <= 7 && days > 3;

  return (
    <div
      className={cn(
        "p-4 border",
        urgent
          ? "bg-red-50 border-red-200"
          : warning
          ? "bg-amber-50 border-amber-200"
          : "bg-forest-50 border-forest-200"
      )}
    >
      <div
        className={cn(
          "text-xs font-semibold uppercase tracking-wider mb-2",
          urgent ? "text-red-500" : warning ? "text-amber-600" : "text-forest-600"
        )}
      >
        {urgent ? "Deadline approaching" : "Time remaining"}
      </div>

      <div className="flex items-baseline gap-3">
        <CountdownUnit
          value={days}
          label="days"
          urgent={urgent}
          warning={warning}
        />
        <CountdownUnit
          value={hours}
          label="hrs"
          urgent={urgent}
          warning={warning}
        />
        <CountdownUnit
          value={minutes}
          label="min"
          urgent={urgent}
          warning={warning}
        />
      </div>

      <div
        className={cn(
          "text-xs mt-2",
          urgent ? "text-red-500" : warning ? "text-amber-600" : "text-forest-600"
        )}
      >
        Due{" "}
        {target.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
}

function CountdownUnit({
  value,
  label,
  urgent,
  warning,
}: {
  value: number;
  label: string;
  urgent: boolean;
  warning: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={cn(
          "text-2xl font-bold tabular-nums",
          urgent
            ? "text-red-700"
            : warning
            ? "text-amber-700"
            : "text-forest-800"
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "text-xs",
          urgent ? "text-red-500" : warning ? "text-amber-500" : "text-forest-500"
        )}
      >
        {label}
      </div>
    </div>
  );
}
