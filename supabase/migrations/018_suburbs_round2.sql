-- Third national expansion wave: CivicPlus suburbs across ME, MA, CT.
-- Probed homepages for /bids.aspx; 21 confirmed hits added.
--
-- Natick MA was intentionally excluded: their /bids.aspx dumps the full
-- historical archive (368+ "Bid Results -" and "Registry of…" entries)
-- not a current-bid feed. The CivicPlus adapter got a general "Award -"
-- prefix filter (this commit's sibling code change), but Natick has
-- additional archive-specific prefixes. Needs per-site scraper_config
-- filter or agency-specific contact before it can be ingested cleanly.

INSERT INTO municipalities (name, state, scraper_type, rfp_page_url, scraper_config, active) VALUES
  -- Maine (7)
  ('Falmouth',     'ME', 'civicplus', 'https://www.town.falmouth.me.us/bids.aspx', '{}'::jsonb, true),
  ('Cumberland',   'ME', 'civicplus', 'https://www.cumberlandmaine.com/bids.aspx', '{}'::jsonb, true),
  ('Rockland',     'ME', 'civicplus', 'https://www.rocklandmaine.gov/bids.aspx',   '{}'::jsonb, true),
  ('Kennebunk',    'ME', 'civicplus', 'https://www.kennebunkmaine.us/bids.aspx',   '{}'::jsonb, true),
  ('York',         'ME', 'civicplus', 'https://www.yorkmaine.org/bids.aspx',       '{}'::jsonb, true),
  ('Kittery',      'ME', 'civicplus', 'https://www.kitteryme.gov/bids.aspx',       '{}'::jsonb, true),
  ('Freeport',     'ME', 'civicplus', 'https://www.freeportmaine.com/bids.aspx',   '{}'::jsonb, true),

  -- Massachusetts (12)
  ('Needham',      'MA', 'civicplus', 'https://www.needhamma.gov/bids.aspx',       '{}'::jsonb, true),
  ('Wellesley',    'MA', 'civicplus', 'https://www.wellesleyma.gov/bids.aspx',     '{}'::jsonb, true),
  ('Braintree',    'MA', 'civicplus', 'https://www.braintreema.gov/bids.aspx',     '{}'::jsonb, true),
  ('Chelmsford',   'MA', 'civicplus', 'https://www.townofchelmsford.us/bids.aspx', '{}'::jsonb, true),
  ('Andover',      'MA', 'civicplus', 'https://www.andoverma.gov/bids.aspx',       '{}'::jsonb, true),
  ('Acton',        'MA', 'civicplus', 'https://www.actonma.gov/bids.aspx',         '{}'::jsonb, true),
  ('Lexington',    'MA', 'civicplus', 'https://www.lexingtonma.gov/bids.aspx',     '{}'::jsonb, true),
  ('Belmont',      'MA', 'civicplus', 'https://www.belmont-ma.gov/bids.aspx',      '{}'::jsonb, true),
  ('Winchester',   'MA', 'civicplus', 'https://www.winchester.us/bids.aspx',       '{}'::jsonb, true),
  ('Reading',      'MA', 'civicplus', 'https://www.readingma.gov/bids.aspx',       '{}'::jsonb, true),
  ('Burlington',   'MA', 'civicplus', 'https://www.burlington.org/bids.aspx',      '{}'::jsonb, true),
  ('Melrose',      'MA', 'civicplus', 'https://www.cityofmelrose.org/bids.aspx',   '{}'::jsonb, true),

  -- Connecticut (2)
  ('Trumbull',     'CT', 'civicplus', 'https://www.trumbull-ct.gov/bids.aspx',     '{}'::jsonb, true),
  ('Orange',       'CT', 'civicplus', 'https://www.orange-ct.gov/bids.aspx',       '{}'::jsonb, true);
