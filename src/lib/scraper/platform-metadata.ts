/**
 * Static metadata about municipality platforms and data pipeline details.
 * Used by the admin UI to show platform type, accessibility, and portal info.
 */

export interface PlatformInfo {
  platform: string;
  scraper: string;
  accessibility: "direct" | "cloudflare" | "portal" | "unstructured";
  accessibilityLabel: string;
  portalName?: string;
  notes?: string;
  suggestedFix?: string;
}

/**
 * Map of municipality name (lowercase) to platform info.
 * This is maintained manually based on analysis of each town's website.
 */
export const municipalityPlatforms: Record<string, PlatformInfo> = {
  // CivicPlus / CivicEngage bids.aspx platform
  concord: {
    platform: "CivicPlus",
    scraper: "civicplus",
    accessibility: "direct",
    accessibilityLabel: "Direct scrape",
    notes: "Uses /bids.aspx endpoint",
  },
  nashua: {
    platform: "CivicPlus",
    scraper: "civicplus",
    accessibility: "direct",
    accessibilityLabel: "Direct scrape",
    notes: "Uses /bids.aspx endpoint",
  },
  laconia: {
    platform: "CivicPlus",
    scraper: "civicplus",
    accessibility: "direct",
    accessibilityLabel: "Direct scrape",
    notes: "Uses /bids.aspx endpoint",
  },
  hampton: {
    platform: "CivicPlus",
    scraper: "civicplus",
    accessibility: "direct",
    accessibilityLabel: "Direct scrape",
    notes: "Uses /bids.aspx endpoint",
  },
  hanover: {
    platform: "CivicPlus",
    scraper: "civicplus",
    accessibility: "direct",
    accessibilityLabel: "Direct scrape",
    notes: "Uses /bids.aspx endpoint",
  },
  londonderry: {
    platform: "CivicPlus",
    scraper: "civicplus",
    accessibility: "direct",
    accessibilityLabel: "Stealth browser",
    notes: "CivicPlus /bids.aspx behind Cloudflare; scraped via Puppeteer stealth (requires_js=true).",
  },
  berlin: {
    platform: "CivicPlus",
    scraper: "civicplus",
    accessibility: "direct",
    accessibilityLabel: "Direct scrape",
    notes: "Uses /bids.aspx endpoint",
  },
  bedford: {
    platform: "CivicPlus",
    scraper: "civicplus",
    accessibility: "direct",
    accessibilityLabel: "Direct scrape",
    notes: "Uses /bids.aspx endpoint; also has editor content",
  },

  // Drupal 7 Virtual Town Hall
  exeter: {
    platform: "Drupal 7 (Virtual Town Hall)",
    scraper: "drupal-rfps",
    accessibility: "direct",
    accessibilityLabel: "Direct scrape",
    notes: "Drupal views-table RFP listing. Currently 0 open bids on their site.",
  },
  hudson: {
    platform: "Drupal 7 (Virtual Town Hall)",
    scraper: "drupal-rfps",
    accessibility: "direct",
    accessibilityLabel: "Direct scrape",
    notes: "Drupal views-table RFP listing. Currently 0 open bids on their site.",
  },

  // Custom CMS
  claremont: {
    platform: "Custom CMS",
    scraper: "claremont",
    accessibility: "direct",
    accessibilityLabel: "Direct scrape",
    notes: "Procurement page at /index.php?section=procurement. URL updated 2026-02.",
  },

  // Standard websites with generic scraper
  manchester: {
    platform: "Custom website",
    scraper: "generic",
    accessibility: "direct",
    accessibilityLabel: "Direct scrape",
    notes: "Custom purchasing page",
  },
  portsmouth: {
    platform: "Custom website",
    scraper: "generic",
    accessibility: "direct",
    accessibilityLabel: "Direct scrape",
    notes: "City RFP listing page",
  },
  dover: {
    platform: "Custom website",
    scraper: "generic",
    accessibility: "direct",
    accessibilityLabel: "Direct scrape",
    notes: "City bids page",
  },

  // Cloudflare-blocked sites
  rochester: {
    platform: "Custom website",
    scraper: "generic",
    accessibility: "cloudflare",
    accessibilityLabel: "Cloudflare blocked",
    notes: "Cloudflare challenge too strong for FlareSolverr (timeout).",
    suggestedFix: "FlareSolverr cannot bypass. Try Playwright with stealth plugin or manual data entry.",
  },
  derry: {
    platform: "Drupal 7 (Virtual Town Hall)",
    scraper: "generic",
    accessibility: "cloudflare",
    accessibilityLabel: "Cloudflare blocked",
    notes: "HTML table with columns: Bids, Status, Department, Due By, Awarded To. FlareSolverr works.",
  },
  merrimack: {
    platform: "Custom website",
    scraper: "generic",
    accessibility: "cloudflare",
    accessibilityLabel: "Cloudflare blocked",
    notes: "Cloudflare challenge too strong for FlareSolverr (timeout).",
    suggestedFix: "FlareSolverr cannot bypass. Try Playwright with stealth plugin or manual data entry.",
  },

  // External portal sites
  lebanon: {
    platform: "OpenGov Procurement",
    scraper: "generic",
    accessibility: "portal",
    accessibilityLabel: "External portal",
    portalName: "OpenGov",
    notes: "Requires OpenGov portal registration; API may be available",
    suggestedFix: "Register for OpenGov API access or build portal-specific scraper.",
  },
  keene: {
    platform: "Public Purchase",
    scraper: "generic",
    accessibility: "portal",
    accessibilityLabel: "External portal",
    portalName: "Public Purchase",
    notes: "Requires Public Purchase account to view bids",
    suggestedFix: "Register for Public Purchase account or build portal-specific scraper.",
  },

  // Unstructured content
  amherst: {
    platform: "Drupal (unstructured)",
    scraper: "generic",
    accessibility: "unstructured",
    accessibilityLabel: "Unstructured content",
    notes: "RFPs posted as free-form body text; may need Cloudflare bypass",
    suggestedFix: "Build custom extraction rules for free-form content layout.",
  },
};

/**
 * Get platform info for a municipality by name.
 * Falls back to a generic "Unknown" entry if not mapped.
 */
export function getPlatformInfo(municipalityName: string): PlatformInfo {
  const key = municipalityName.toLowerCase().replace(/\s+(town|city)\s+of\s+/i, "").trim();
  return (
    municipalityPlatforms[key] || {
      platform: "Unknown",
      scraper: "generic",
      accessibility: "direct" as const,
      accessibilityLabel: "Not analyzed",
      notes: "Platform not yet identified",
    }
  );
}

/** Accessibility badge colors */
export const accessibilityStyles: Record<string, { cls: string; icon: string }> = {
  direct: { cls: "bg-green-50 text-green-700 border-green-200", icon: "OK" },
  cloudflare: { cls: "bg-red-50 text-red-600 border-red-200", icon: "!!" },
  portal: { cls: "bg-purple-50 text-purple-700 border-purple-200", icon: ">>" },
  unstructured: { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: "??" },
};
