-- Revert to full translation keys (not recommended, but provides rollback option)
UPDATE static_gifts SET persona_key = 'gift.categories.' || persona_key
WHERE persona_key NOT LIKE 'gift.categories.%';
