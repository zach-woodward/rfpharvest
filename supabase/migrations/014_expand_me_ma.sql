-- First national expansion step: add 15 CivicPlus-hosted municipalities
-- across Maine and Massachusetts. All route through the existing
-- CivicPlusScraper — no new adapters required.
--
-- Selection method: probed each city's /bids.aspx and kept the ones
-- that returned 200 with <div class="listItemsRow bid"> markers in the
-- response body. Portland ME and Windham ME are included even with
-- zero current bids because their pages are structurally correct;
-- they'll start producing data as soon as a bid posts. Portland ME
-- is additionally flagged requires_js=true — their TLS cert chain
-- isn't trusted by Node's default CA bundle, but Chromium (stealth)
-- accepts it.
--
-- Cities dropped during probing:
--   - 403 or empty listings: Gorham ME, Waltham MA (stealth gets past
--     but page returned zero bid rows). Revisit later.
--   - Not CivicPlus: Auburn ME, Biddeford ME, Sanford ME, Saco ME,
--     Augusta ME, Scarborough ME, Boston, Worcester, Springfield,
--     Cambridge, Brockton, Quincy, New Bedford, Lynn, Fall River,
--     Newton, Somerville, Haverhill. Each needs its own adapter or
--     different URL pattern — separate session.

INSERT INTO municipalities (name, state, scraper_type, rfp_page_url, scraper_config, active) VALUES
  -- Maine (8)
  ('Portland',        'ME', 'civicplus', 'https://www.portlandmaine.gov/bids.aspx',  '{"requires_js": true}'::jsonb, true),
  ('Lewiston',        'ME', 'civicplus', 'https://www.lewistonmaine.gov/bids.aspx',  '{}'::jsonb, true),
  ('Bangor',          'ME', 'civicplus', 'https://www.bangormaine.gov/bids.aspx',    '{}'::jsonb, true),
  ('South Portland',  'ME', 'civicplus', 'https://www.southportland.org/bids.aspx',  '{}'::jsonb, true),
  ('Brunswick',       'ME', 'civicplus', 'https://www.brunswickme.gov/bids.aspx',    '{}'::jsonb, true),
  ('Westbrook',       'ME', 'civicplus', 'https://www.westbrookmaine.com/bids.aspx', '{}'::jsonb, true),
  ('Waterville',      'ME', 'civicplus', 'https://www.waterville-me.gov/bids.aspx',  '{}'::jsonb, true),
  ('Windham',         'ME', 'civicplus', 'https://www.windhammaine.us/bids.aspx',    '{}'::jsonb, true),
  -- Massachusetts (7)
  ('Lowell',          'MA', 'civicplus', 'https://www.lowellma.gov/bids.aspx',       '{}'::jsonb, true),
  ('Lawrence',        'MA', 'civicplus', 'https://www.cityoflawrence.com/bids.aspx', '{}'::jsonb, true),
  ('Framingham',      'MA', 'civicplus', 'https://www.framinghamma.gov/bids.aspx',   '{}'::jsonb, true),
  ('Malden',          'MA', 'civicplus', 'https://www.cityofmalden.org/bids.aspx',   '{}'::jsonb, true),
  ('Brookline',       'MA', 'civicplus', 'https://www.brooklinema.gov/bids.aspx',    '{}'::jsonb, true),
  ('Plymouth',        'MA', 'civicplus', 'https://www.plymouth-ma.gov/bids.aspx',    '{}'::jsonb, true),
  ('Taunton',         'MA', 'civicplus', 'https://www.taunton-ma.gov/bids.aspx',     '{}'::jsonb, true);
