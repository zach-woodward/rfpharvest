-- Wire Portsmouth, Dover, and Manchester to their new custom adapters,
-- and fix the Claremont URL that was 404-ing.

-- Claremont: migration 005 pointed at /departments/purchasing/bids (now 404).
-- Correct URL is /index.php?section=procurement.
UPDATE municipalities
SET rfp_page_url = 'https://www.claremontnh.com/index.php?section=procurement'
WHERE lower(name) = 'claremont';

-- Portsmouth: custom table on portsmouthnh.gov (not cityofportsmouth.com)
UPDATE municipalities
SET scraper_type = 'portsmouth',
    rfp_page_url = 'https://www.portsmouthnh.gov/finance/purchasing-bids-and-proposals'
WHERE lower(name) = 'portsmouth';

-- Dover: custom table at /government/city-operations/finance/bids
UPDATE municipalities
SET scraper_type = 'dover',
    rfp_page_url = 'https://www.dover.nh.gov/government/city-operations/finance/bids'
WHERE lower(name) = 'dover';

-- Manchester: custom table at /Departments/Purchasing/Bid-Opportunities-and-Results
UPDATE municipalities
SET scraper_type = 'manchester',
    rfp_page_url = 'https://www.manchesternh.gov/Departments/Purchasing/Bid-Opportunities-and-Results'
WHERE lower(name) = 'manchester';
