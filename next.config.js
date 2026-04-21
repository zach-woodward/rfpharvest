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
      "/api/scrape": [
        "./node_modules/puppeteer-extra-plugin-stealth/**",
        "./node_modules/puppeteer-extra-plugin-*/**",
      ],
      "/api/cron/summarize": [
        "./node_modules/pdf-parse/**",
      ],
    },
  },
};

module.exports = nextConfig;
