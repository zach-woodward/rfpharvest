import type { ScraperAdapter } from "./types";
import { GenericHtmlScraper } from "./base-scraper";

const registry: Record<string, ScraperAdapter> = {
  generic: new GenericHtmlScraper(),
};

export function registerScraper(name: string, adapter: ScraperAdapter) {
  registry[name] = adapter;
}

export function getScraper(name: string): ScraperAdapter {
  const scraper = registry[name];
  if (!scraper) {
    console.warn(`Scraper "${name}" not found, falling back to generic`);
    return registry.generic;
  }
  return scraper;
}

export function listScrapers(): string[] {
  return Object.keys(registry);
}
