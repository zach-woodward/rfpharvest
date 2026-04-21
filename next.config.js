/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: [
      "cheerio",
      "puppeteer",
      "puppeteer-core",
      "puppeteer-extra",
      "puppeteer-extra-plugin-stealth",
    ],
    // puppeteer-extra-plugin-stealth dynamically requires each
    // evasions/*.js file at runtime. Next.js nft can't trace those,
    // so they'd be missing from the standalone output and cause
    // "Cannot find module 'puppeteer-extra-plugin-stealth/evasions/...'".
    // Force-include the whole stealth package + puppeteer runtime
    // files the scraper endpoints need.
    outputFileTracingIncludes: {
      // Puppeteer + stealth + its user-data-dir plugin pull a sprawling
      // transitive tree (fs-extra, rimraf, glob, clone-deep, ...) via
      // dynamic require. Each individual dep we enumerate surfaces
      // another missing one at runtime. Ship the full node_modules
      // for scrape-adjacent routes so this class of error stops.
      // Adds ~500 MB to the standalone image on disk (not RAM). The
      // droplet has the headroom.
      "/api/scrape": ["./node_modules/**"],
      "/api/cron/summarize": ["./node_modules/**"],
    },
  },
};

module.exports = nextConfig;
