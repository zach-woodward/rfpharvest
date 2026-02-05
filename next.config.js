/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["cheerio", "puppeteer", "puppeteer-core", "puppeteer-extra", "puppeteer-extra-plugin-stealth"],
  },
};

module.exports = nextConfig;
