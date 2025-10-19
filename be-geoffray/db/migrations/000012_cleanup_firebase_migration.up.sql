-- Firebase Migration Cleanup
-- This migration removes obsolete columns and tables after migrating to Firebase authentication

-- Step 1: Drop refresh_tokens table (Firebase handles token refresh)
DROP TABLE IF EXISTS refresh_tokens;

-- Step 2: Drop obsolete columns from users table
-- Note: We need to preserve google_id temporarily for Firebase UID storage until we add a proper firebase_uid column
ALTER TABLE users DROP COLUMN IF EXISTS password;
ALTER TABLE users DROP COLUMN IF EXISTS auth_provider;
ALTER TABLE users DROP COLUMN IF EXISTS profile_picture;

-- Step 3: Rename google_id to firebase_uid for clarity
ALTER TABLE users RENAME COLUMN google_id TO firebase_uid;

-- Step 4: Drop obsolete indexes
DROP INDEX IF EXISTS idx_refresh_tokens_token;
DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
DROP INDEX IF EXISTS idx_users_google_id;

-- Step 5: Create new index for Firebase UID
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);

-- Step 6: Update firebase_uid column to allow NULL (for backward compatibility during transition)
ALTER TABLE users ALTER COLUMN firebase_uid DROP NOT NULL;