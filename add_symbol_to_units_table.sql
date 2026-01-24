-- Add symbol column to units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS symbol TEXT;