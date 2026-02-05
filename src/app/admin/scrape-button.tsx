"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { triggerScrape } from "./actions";

export function ScrapeButton({ municipalityId }: { municipalityId?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleScrape() {
    setLoading(true);
    try {
      await triggerScrape(municipalityId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleScrape}
      disabled={loading}
      className="flex items-center gap-1.5 bg-forest-600 text-white px-4 py-2 text-sm font-medium hover:bg-forest-700 transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      {municipalityId ? "Scrape" : "Trigger scrape"}
    </button>
  );
}
