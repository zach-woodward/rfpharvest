import type { MetadataRoute } from "next";
import { createPublicSupabase } from "@/lib/supabase/server";
import { stateSlug, townSlug } from "@/lib/seo/slugs";
import { TOPICS } from "@/lib/seo/topics";
import { GUIDES } from "@/lib/seo/guides";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rfpharvest.com";

export const revalidate = 3600; // regenerate at most once per hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicSupabase();

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/rfps`, changeFrequency: "daily", priority: 0.9 },
  ];

  for (const t of TOPICS) {
    entries.push({
      url: `${SITE_URL}/rfps/topic/${t.slug}`,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  entries.push({ url: `${SITE_URL}/guides`, changeFrequency: "weekly", priority: 0.8 });
  for (const g of GUIDES) {
    entries.push({
      url: `${SITE_URL}/guides/${g.slug}`,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rfps } = await supabase
    .from("rfps")
    .select("id, updated_at, created_at")
    .gte("created_at", ninetyDaysAgo)
    .in("status", ["open", "awarded", "closed"])
    .order("updated_at", { ascending: false })
    .limit(5000);

  for (const rfp of rfps || []) {
    entries.push({
      url: `${SITE_URL}/rfp/${rfp.id}`,
      lastModified: rfp.updated_at || rfp.created_at,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  const { data: municipalities } = await supabase
    .from("municipalities")
    .select("name, state, updated_at")
    .eq("active", true);

  const statesSeen = new Set<string>();
  for (const muni of municipalities || []) {
    const sSlug = stateSlug(muni.state);
    const tSlug = townSlug(muni.name);
    if (!sSlug || !tSlug) continue;

    entries.push({
      url: `${SITE_URL}/rfps/${sSlug}/${tSlug}`,
      lastModified: muni.updated_at,
      changeFrequency: "daily",
      priority: 0.6,
    });

    if (!statesSeen.has(sSlug)) {
      statesSeen.add(sSlug);
      entries.push({
        url: `${SITE_URL}/rfps/${sSlug}`,
        changeFrequency: "daily",
        priority: 0.5,
      });
      // Every covered state gets a full topic matrix — the long-tail
      // "<topic> RFPs in <state>" intersection pages.
      for (const t of TOPICS) {
        entries.push({
          url: `${SITE_URL}/rfps/${sSlug}/topic/${t.slug}`,
          changeFrequency: "daily",
          priority: 0.65,
        });
      }
    }
  }

  return entries;
}
