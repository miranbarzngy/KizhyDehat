-- Update existing sales records to have 'sold' status if they don't have a status set
-- This migration is safe to run multiple times and only affects records without status
UPDATE sales SET status = 'sold' WHERE status IS NULL OR status = '';

-- Add comment for documentation (will only work if column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'sales' AND column_name = 'status') THEN
        COMMENT ON COLUMN sales.status IS 'Sale status: pending or sold';
    END IF;
END $$;