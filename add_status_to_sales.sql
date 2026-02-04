-- Add status column to sales table (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'sales' AND column_name = 'status') THEN
        ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sold'));
        COMMENT ON COLUMN sales.status IS 'Sale status: pending or sold';
    END IF;
END $$;

-- Update existing records to 'sold' status (only if they don't have a status set)
UPDATE sales SET status = 'sold' WHERE status IS NULL OR status = '';