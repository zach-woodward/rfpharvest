import type { ScraperAdapter, ScraperConfig, ScrapedRfp } from "./types";
import { GenericHtmlScraper } from "./generic-scraper";
import { ConcordNhScraper } from "./concord-nh-scraper";
import { CivicPlusScraper } from "./civicplus-scraper";
import { DrupalRfpsScraper } from "./drupal-rfps-scraper";
import { ClaremontScraper } from "./claremont-scraper";
import { PortsmouthScraper } from "./portsmouth-scraper";
import { DoverScraper } from "./dover-scraper";
import { ManchesterScraper } from "./manchester-scraper";
import { DerryScraper } from "./derry-scraper";
import { RochesterScraper } from "./rochester-scraper";
import { PublicPurchaseScraper } from "./publicpurchase-scraper";

export type { ScrapedRfp, ScraperConfig, ScraperAdapter };

const registry: Record<string, ScraperAdapter> = {
  generic: new GenericHtmlScraper(),
  "concord-nh": new ConcordNhScraper(),
  civicplus: new CivicPlusScraper(),
  "drupal-rfps": new DrupalRfpsScraper(),
  claremont: new ClaremontScraper(),
  portsmouth: new PortsmouthScraper(),
  dover: new DoverScraper(),
  manchester: new ManchesterScraper(),
  derry: new DerryScraper(),
  rochester: new RochesterScraper(),
  publicpurchase: new PublicPurchaseScraper(),
};

export function getScraper(name: string): ScraperAdapter {
  const scraper = registry[name];
  if (!scraper) {
    console.warn(`Scraper "${name}" not found, falling back to generic`);
    return registry.generic;
  }
  return scraper;
}
