-- Enable FlareSolverr (headless browser) for Cloudflare-blocked towns.
-- Sets requires_js: true in scraper_config so scrapers route through FlareSolverr.

UPDATE municipalities SET scraper_config = jsonb_set(
  COALESCE(scraper_config::jsonb, '{}'::jsonb),
  '{requires_js}', 'true'
)
WHERE lower(name) IN ('londonderry', 'exeter', 'hudson', 'rochester', 'derry', 'merrimack');
