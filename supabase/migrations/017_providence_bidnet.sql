-- Providence RI uses BidNet Direct for their purchasing portal. Their
-- BidNet agency page is publicly accessible (no login required for
-- the listing — only for downloading bid packets). New bidnet adapter
-- wired up in src/lib/scraper.

INSERT INTO municipalities (name, state, scraper_type, rfp_page_url, scraper_config, active) VALUES
  ('Providence', 'RI', 'bidnet',
   'https://www.bidnetdirect.com/rhode-island/providenceri',
   '{}'::jsonb, true);
