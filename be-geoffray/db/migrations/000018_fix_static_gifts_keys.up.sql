-- Fix static_gifts persona_key to use simple IDs instead of full translation keys
-- This corrects data from migration 000016 that used 'gift.categories.X' format
UPDATE static_gifts SET persona_key = REPLACE(persona_key, 'gift.categories.', '')
WHERE persona_key LIKE 'gift.categories.%';
