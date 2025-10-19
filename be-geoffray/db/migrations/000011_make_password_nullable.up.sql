-- Make password column nullable for OAuth users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;