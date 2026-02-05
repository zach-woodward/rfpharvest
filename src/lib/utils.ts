import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function deadlineLabel(date: string | null): { text: string; urgent: boolean } {
  const days = daysUntil(date);
  if (days === null) return { text: "No deadline", urgent: false };
  if (days < 0) return { text: "Closed", urgent: false };
  if (days === 0) return { text: "Due today", urgent: true };
  if (days <= 3) return { text: `${days}d left`, urgent: true };
  if (days <= 7) return { text: `${days}d left`, urgent: false };
  return { text: formatDate(date), urgent: false };
}

export const RFP_CATEGORIES = [
  "Construction",
  "IT & Technology",
  "Professional Services",
  "Engineering",
  "Environmental",
  "Transportation",
  "Utilities",
  "Public Safety",
  "Education",
  "Healthcare",
  "Legal",
  "Financial",
  "Consulting",
  "Maintenance",
  "Other",
] as const;
