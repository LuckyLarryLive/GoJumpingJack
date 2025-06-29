-- Add preferred_currency column to users table
ALTER TABLE users ADD COLUMN preferred_currency VARCHAR(3) DEFAULT 'USD';

-- Create index on preferred_currency for performance
CREATE INDEX idx_users_preferred_currency ON users(preferred_currency);

-- Add constraint to ensure only valid currency codes are stored
ALTER TABLE users ADD CONSTRAINT check_preferred_currency 
CHECK (preferred_currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'BRL', 'MXN'));
