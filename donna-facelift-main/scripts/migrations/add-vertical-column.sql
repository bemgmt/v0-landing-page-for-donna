-- Migration: Add vertical column to users table
-- Part of Phase 5 Expansion - Vertical-Specific Modules
-- Date: 2025-12-10

-- Add vertical column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS vertical VARCHAR(50) DEFAULT NULL;

-- Add comment to document the column
COMMENT ON COLUMN users.vertical IS 'Industry vertical: hospitality, real_estate, or professional_services';

-- Create index for vertical column (for filtering users by vertical)
CREATE INDEX IF NOT EXISTS idx_users_vertical ON users(vertical);

-- Add check constraint to ensure only valid verticals are stored
ALTER TABLE users 
ADD CONSTRAINT chk_users_vertical 
CHECK (vertical IS NULL OR vertical IN ('hospitality', 'real_estate', 'professional_services'));

-- Update trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_users_updated_at'
    ) THEN
        CREATE TRIGGER trigger_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_users_updated_at();
    END IF;
END$$;

