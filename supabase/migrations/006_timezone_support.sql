-- Add timezone support to users and availability settings

-- Add timezone to users table
-- ALTER TABLE users 
-- ADD COLUMN timezone VARCHAR(50) DEFAULT 'America/New_York';

-- Add timezone to availability_settings (this already exists, but let's ensure it has a default)
ALTER TABLE availability_settings 
ALTER COLUMN timezone SET DEFAULT 'America/New_York';

-- Update existing users to have a default timezone if null
UPDATE users 
SET timezone = 'America/New_York' 
WHERE timezone IS NULL;

-- Update existing availability_settings to have a default timezone if null
UPDATE availability_settings 
SET timezone = 'America/New_York' 
WHERE timezone IS NULL;

-- Create an index on timezone for faster queries
CREATE INDEX IF NOT EXISTS idx_users_timezone ON users (timezone);
CREATE INDEX IF NOT EXISTS idx_availability_settings_timezone ON availability_settings (timezone);

