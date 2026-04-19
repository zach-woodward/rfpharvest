-- Second pass at CT coverage. Probed 17 more towns; 5 confirmed
-- CivicPlus /bids.aspx hits. Also probed 25 agency slugs on
-- publicpurchase.com across NE states — all returned a placeholder
-- 200 page, no actual bid feed (only Keene NH is registered as a PP
-- agency in New England). Nothing to add there.

INSERT INTO municipalities (name, state, scraper_type, rfp_page_url, scraper_config, active) VALUES
  ('Torrington',   'CT', 'civicplus', 'https://www.torringtonct.org/bids.aspx',     '{}'::jsonb, true),
  ('Simsbury',     'CT', 'civicplus', 'https://www.simsbury-ct.gov/bids.aspx',      '{}'::jsonb, true),
  ('Cheshire',     'CT', 'civicplus', 'https://www.cheshirect.org/bids.aspx',       '{}'::jsonb, true),
  ('Madison',      'CT', 'civicplus', 'https://www.madisonct.org/bids.aspx',        '{}'::jsonb, true),
  ('Darien',       'CT', 'civicplus', 'https://www.darienct.gov/bids.aspx',         '{}'::jsonb, true);
