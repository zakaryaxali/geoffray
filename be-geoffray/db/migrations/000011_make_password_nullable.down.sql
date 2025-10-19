-- Revert password column to NOT NULL (this will fail if there are NULL passwords)
ALTER TABLE users ALTER COLUMN password SET NOT NULL;