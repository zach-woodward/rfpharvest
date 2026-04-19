-- Wire Derry and Rochester to their custom adapters. Both sit behind
-- Cloudflare, so their scrapers always route through browser fetch
-- (fetchWithBrowser handles it internally — no requires_js flag needed
-- since the adapters call it directly).
--
-- Merrimack is intentionally not here: the page is freeform text, not
-- a structured list. Waiting on an AI-extraction pass in a future
-- session (tourneyhunter playbook layer L5).

UPDATE municipalities
SET scraper_type = 'derry',
    rfp_page_url = 'https://www.derrynh.gov/bids-rfps'
WHERE lower(name) = 'derry';

UPDATE municipalities
SET scraper_type = 'rochester',
    rfp_page_url = 'https://www.rochesternh.gov/rochester-new-hampshire/links/bids'
WHERE lower(name) = 'rochester';
