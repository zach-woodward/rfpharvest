const ACRONYMS = new Set([
  "rfp", "rfq", "rfb", "rfi", "ifb", "po", "bid", "iq",
  "hvac", "ada", "dot", "epa", "usda", "osha", "dpw", "ems", "gis", "gps",
  "it", "hr", "pr", "ai", "ml", "ui", "ux", "qa", "qc", "ir", "pm",
  "led", "leed", "nh", "ny", "nj", "ct", "ma", "me", "vt", "ri", "ca", "tx", "fl",
  "pa", "oh", "mi", "il", "ga", "wa", "or", "co", "mn", "wi", "in", "mo", "tn",
  "nc", "sc", "va", "wv", "ks", "ok", "ar", "la", "ms", "al", "ky", "ia", "ne",
  "sd", "nd", "mt", "wy", "id", "ut", "nv", "az", "nm", "ak", "hi",
  "us", "usa", "usps", "fbi", "cia", "irs", "nasa",
  "llc", "llp", "inc", "corp", "co",
  "pdf", "html", "css", "sql",
  "fy", "ytd", "ft", "sf", "sqft",
  "wwtp", "potw", "dep", "doe", "dod",
  "jv", "pm", "cm", "gc",
  "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x",
  "tbd", "tba", "asap", "na", "ne",
]);

const SPAM_TITLES = new Set([
  "home", "next", "previous", "back", "top", "view all", "view more",
  "search", "login", "sign in", "sign up", "register", "contact",
  "about", "about us", "more", "read more", "click here", "learn more",
  "menu", "navigation", "skip to content", "skip to main content",
  "cancel", "submit", "close", "open", "download", "print", "share",
  "lorem ipsum", "example", "test", "placeholder", "untitled",
]);

export function titleCase(input: string | null | undefined): string {
  if (!input) return "";
  const trimmed = input.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  const hasLower = /[a-z]/.test(trimmed);
  const hasUpper = /[A-Z]/.test(trimmed);
  const isAllCaps = hasUpper && !hasLower;
  const isAllLower = hasLower && !hasUpper;

  if (!isAllCaps && !isAllLower) return trimmed;

  return trimmed
    .toLowerCase()
    .split(" ")
    .map((word) => capitalizeWord(word))
    .join(" ");
}

function capitalizeWord(word: string): string {
  if (!word) return word;
  const bare = word.replace(/[^a-z0-9]/gi, "");
  if (ACRONYMS.has(bare)) return word.toUpperCase();

  return word
    .split(/([-'/])/)
    .map((part) => {
      if (part === "-" || part === "'" || part === "/") return part;
      const bareP = part.replace(/[^a-z0-9]/gi, "");
      if (ACRONYMS.has(bareP)) return part.toUpperCase();
      if (!part) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

export function isSpamTitle(title: string | null | undefined): boolean {
  if (!title) return true;
  const t = title.trim().toLowerCase();
  if (!t) return true;
  if (t.length < 5) return true;
  if (SPAM_TITLES.has(t)) return true;
  if (/^\d+$/.test(t)) return true;
  if (/^https?:\/\//.test(t)) return true;
  if (t.startsWith("javascript:")) return true;
  return false;
}

export function cleanString(input: string | null | undefined): string | null {
  if (!input) return null;
  const cleaned = input.trim().replace(/\s+/g, " ");
  return cleaned || null;
}

export function cleanEmail(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

export function cleanPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return input.trim();
}

export interface NormalizedRfp {
  title: string;
  description: string | null;
  category: string | null;
  posted_date: string | null;
  deadline_date: string | null;
  pre_bid_date: string | null;
  qa_deadline: string | null;
  source_url: string | null;
  document_urls: string[];
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  estimated_value: string | null;
  requires_signup: boolean;
  raw_data: Record<string, unknown>;
}

export function normalizeRfp(rfp: {
  title?: string;
  description?: string;
  category?: string;
  posted_date?: string;
  deadline_date?: string;
  pre_bid_date?: string;
  qa_deadline?: string;
  source_url?: string;
  document_urls?: string[];
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  estimated_value?: string;
  requires_signup?: boolean;
  raw_data?: Record<string, unknown>;
}): NormalizedRfp | null {
  const title = titleCase(rfp.title);
  if (isSpamTitle(title)) return null;

  return {
    title,
    description: cleanString(rfp.description),
    category: rfp.category ? titleCase(rfp.category) : null,
    posted_date: rfp.posted_date || null,
    deadline_date: rfp.deadline_date || null,
    pre_bid_date: rfp.pre_bid_date || null,
    qa_deadline: rfp.qa_deadline || null,
    source_url: cleanString(rfp.source_url),
    document_urls: rfp.document_urls || [],
    contact_name: rfp.contact_name ? titleCase(rfp.contact_name) : null,
    contact_email: cleanEmail(rfp.contact_email),
    contact_phone: cleanPhone(rfp.contact_phone),
    estimated_value: cleanString(rfp.estimated_value),
    requires_signup: !!rfp.requires_signup,
    raw_data: rfp.raw_data || {},
  };
}
