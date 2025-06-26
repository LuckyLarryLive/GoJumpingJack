-- Add email verification fields to users table
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN email_verification_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Create unique index on email_verification_token for performance and uniqueness
CREATE UNIQUE INDEX idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;

-- Create index on email_verified for performance
CREATE INDEX idx_users_email_verified ON users(email_verified);
