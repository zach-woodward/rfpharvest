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
      // Puppeteer + stealth plugin pull a tangled web of transitive
      // deps (fs-extra, clone-deep, kind-of, ...) via dynamic require.
      // Chasing each one is whack-a-mole. Easier to force the whole
      // puppeteer-adjacent stack into the trace for routes that use
      // browser fetch. Costs ~80 MB image size; worth it.
      "/api/scrape": [
        "./node_modules/puppeteer/**",
        "./node_modules/puppeteer-core/**",
        "./node_modules/puppeteer-extra/**",
        "./node_modules/puppeteer-extra-plugin-*/**",
        "./node_modules/fs-extra/**",
        "./node_modules/clone-deep/**",
        "./node_modules/merge-deep/**",
        "./node_modules/is-plain-object/**",
        "./node_modules/shallow-clone/**",
        "./node_modules/kind-of/**",
        "./node_modules/for-own/**",
        "./node_modules/isobject/**",
        "./node_modules/graceful-fs/**",
        "./node_modules/jsonfile/**",
        "./node_modules/universalify/**",
        "./node_modules/at-least-node/**",
      ],
      "/api/cron/summarize": [
        "./node_modules/pdf-parse/**",
      ],
    },
  },
};

module.exports = nextConfig;
