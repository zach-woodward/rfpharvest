-- Wire Keene to the Public Purchase public agency view.
-- publicpurchase.com exposes a login-less "publicInfo" page per agency
-- that lists open solicitations. Parsed via the new publicpurchase adapter.
--
-- Lebanon intentionally not here: their /bids.aspx loads but has no
-- .listItemsRow.bid items. Either they use a CivicPlus skin variant or
-- have no open bids right now. Needs more investigation.

UPDATE municipalities
SET scraper_type = 'publicpurchase',
    rfp_page_url = 'https://www.publicpurchase.com/gems/keene,nh/buyer/public/publicInfo'
WHERE lower(name) = 'keene';
