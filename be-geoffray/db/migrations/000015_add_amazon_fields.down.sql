-- Remove Amazon affiliate fields from gift_suggestions
DROP INDEX IF EXISTS idx_gift_suggestions_amazon_asin;

ALTER TABLE gift_suggestions DROP COLUMN IF EXISTS amazon_asin;
ALTER TABLE gift_suggestions DROP COLUMN IF EXISTS amazon_affiliate_url;
ALTER TABLE gift_suggestions DROP COLUMN IF EXISTS amazon_price;
ALTER TABLE gift_suggestions DROP COLUMN IF EXISTS amazon_region;
ALTER TABLE gift_suggestions DROP COLUMN IF EXISTS amazon_last_updated;
