-- Second national expansion step: CT, RI, VT. All CivicPlus /bids.aspx
-- hits. Empty-but-structurally-valid pages are included so data starts
-- flowing the moment a bid is posted.

INSERT INTO municipalities (name, state, scraper_type, rfp_page_url, scraper_config, active) VALUES
  -- Connecticut (5)
  ('Norwalk',        'CT', 'civicplus', 'https://www.norwalkct.gov/bids.aspx',      '{}'::jsonb, true),
  ('Danbury',        'CT', 'civicplus', 'https://www.danbury-ct.gov/bids.aspx',     '{}'::jsonb, true),
  ('Bristol',        'CT', 'civicplus', 'https://www.bristolct.gov/bids.aspx',      '{}'::jsonb, true),
  ('Middletown',     'CT', 'civicplus', 'https://www.middletownct.gov/bids.aspx',   '{}'::jsonb, true),
  ('Greenwich',      'CT', 'civicplus', 'https://www.greenwichct.gov/bids.aspx',    '{}'::jsonb, true),

  -- Rhode Island (5) — SKingstown and Bristol RI are empty but valid
  ('Cumberland',        'RI', 'civicplus', 'https://www.cumberlandri.org/bids.aspx',   '{}'::jsonb, true),
  ('South Kingstown',   'RI', 'civicplus', 'https://www.southkingstownri.com/bids.aspx','{}'::jsonb, true),
  ('North Kingstown',   'RI', 'civicplus', 'https://www.northkingstown.org/bids.aspx', '{}'::jsonb, true),
  ('Westerly',          'RI', 'civicplus', 'https://www.westerlyri.gov/bids.aspx',     '{}'::jsonb, true),
  ('Bristol',           'RI', 'civicplus', 'https://www.bristolri.gov/bids.aspx',      '{}'::jsonb, true),

  -- Vermont (7) — Essex, Shelburne, South Burlington empty but valid
  ('Burlington',        'VT', 'civicplus', 'https://www.burlingtonvt.gov/bids.aspx',      '{}'::jsonb, true),
  ('South Burlington',  'VT', 'civicplus', 'https://www.southburlingtonvt.gov/bids.aspx', '{}'::jsonb, true),
  ('Montpelier',        'VT', 'civicplus', 'https://www.montpelier-vt.org/bids.aspx',     '{}'::jsonb, true),
  ('Winooski',          'VT', 'civicplus', 'https://www.winooskivt.gov/bids.aspx',        '{}'::jsonb, true),
  ('Essex',             'VT', 'civicplus', 'https://www.essexvt.org/bids.aspx',           '{}'::jsonb, true),
  ('Colchester',        'VT', 'civicplus', 'https://www.colchestervt.gov/bids.aspx',      '{}'::jsonb, true),
  ('Shelburne',         'VT', 'civicplus', 'https://www.shelburnevt.org/bids.aspx',       '{}'::jsonb, true);
