-- Update municipality scraper_type and rfp_page_url to match correct platform scrapers.
-- CivicPlus towns: use civicplus scraper and /bids.aspx endpoint
-- Drupal VTH towns: use drupal-rfps scraper
-- Claremont: use claremont scraper

-- CivicPlus towns
UPDATE municipalities SET scraper_type = 'civicplus', rfp_page_url = 'https://www.concordnh.gov/bids.aspx'
WHERE lower(name) = 'concord';

UPDATE municipalities SET scraper_type = 'civicplus', rfp_page_url = 'https://www.nashuanh.gov/bids.aspx'
WHERE lower(name) = 'nashua';

UPDATE municipalities SET scraper_type = 'civicplus', rfp_page_url = 'https://www.laconianh.gov/bids.aspx'
WHERE lower(name) = 'laconia';

UPDATE municipalities SET scraper_type = 'civicplus', rfp_page_url = 'https://www.hamptonnh.gov/bids.aspx'
WHERE lower(name) = 'hampton';

UPDATE municipalities SET scraper_type = 'civicplus', rfp_page_url = 'https://www.hanovernh.org/bids.aspx'
WHERE lower(name) = 'hanover';

UPDATE municipalities SET scraper_type = 'civicplus', rfp_page_url = 'https://www.londonderrynh.org/bids.aspx'
WHERE lower(name) = 'londonderry';

UPDATE municipalities SET scraper_type = 'civicplus', rfp_page_url = 'https://www.berlinnh.gov/bids.aspx'
WHERE lower(name) = 'berlin';

UPDATE municipalities SET scraper_type = 'civicplus', rfp_page_url = 'https://www.bedfordnh.org/bids.aspx'
WHERE lower(name) = 'bedford';

-- Drupal Virtual Town Hall towns
UPDATE municipalities SET scraper_type = 'drupal-rfps', rfp_page_url = 'https://www.exeternh.gov/rfps'
WHERE lower(name) = 'exeter';

UPDATE municipalities SET scraper_type = 'drupal-rfps', rfp_page_url = 'https://www.hudsonnh.gov/rfps'
WHERE lower(name) = 'hudson';

-- Claremont custom CMS
UPDATE municipalities SET scraper_type = 'claremont', rfp_page_url = 'https://www.claremontnh.com/departments/purchasing/bids'
WHERE lower(name) = 'claremont';
