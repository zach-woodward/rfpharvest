-- Londonderry's bids.aspx sits behind Cloudflare and rejects plain fetch.
-- Set requires_js=true in scraper_config so CivicPlusScraper routes through
-- fetchWithBrowser() (FlareSolverr first, Puppeteer stealth as fallback).
UPDATE municipalities
SET scraper_config = COALESCE(scraper_config, '{}'::jsonb)
                     || jsonb_build_object('requires_js', true)
WHERE lower(name) = 'londonderry';
