-- Rollback Firebase Migration Cleanup
-- This rollback recreates the dropped columns and tables

-- Step 1: Recreate refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Recreate dropped columns
ALTER TABLE users ADD COLUMN password TEXT;
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email';
ALTER TABLE users ADD COLUMN profile_picture TEXT;

-- Step 3: Rename firebase_uid back to google_id
ALTER TABLE users RENAME COLUMN firebase_uid TO google_id;

-- Step 4: Recreate indexes
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_users_google_id ON users(google_id);

-- Step 5: Drop Firebase UID index
DROP INDEX IF EXISTS idx_users_firebase_uid;