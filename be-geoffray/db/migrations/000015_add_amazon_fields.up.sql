-- Add Amazon affiliate fields to gift_suggestions
ALTER TABLE gift_suggestions ADD COLUMN IF NOT EXISTS amazon_asin VARCHAR(20);
ALTER TABLE gift_suggestions ADD COLUMN IF NOT EXISTS amazon_affiliate_url TEXT;
ALTER TABLE gift_suggestions ADD COLUMN IF NOT EXISTS amazon_price VARCHAR(50);
ALTER TABLE gift_suggestions ADD COLUMN IF NOT EXISTS amazon_region VARCHAR(10);
ALTER TABLE gift_suggestions ADD COLUMN IF NOT EXISTS amazon_last_updated TIMESTAMP WITH TIME ZONE;

-- Index for quick lookups by ASIN
CREATE INDEX IF NOT EXISTS idx_gift_suggestions_amazon_asin ON gift_suggestions(amazon_asin);
