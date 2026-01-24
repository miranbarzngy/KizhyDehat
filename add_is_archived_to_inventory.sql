-- Add is_archived column to inventory table for automated archiving
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Add a comment to document the column purpose
COMMENT ON COLUMN inventory.is_archived IS 'Whether this item is archived (out of stock)';