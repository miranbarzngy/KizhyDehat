-- Add status column to sales table
ALTER TABLE sales
ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sold'));

-- Update existing records to 'sold' status
UPDATE sales SET status = 'sold' WHERE status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN sales.status IS 'Sale status: pending or sold';