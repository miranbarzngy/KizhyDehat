-- Add sold_by column to sales table to track the user who issued the invoice
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sold_by TEXT;

-- Add a comment to document the column purpose
COMMENT ON COLUMN sales.sold_by IS 'Name of the user who issued the invoice';