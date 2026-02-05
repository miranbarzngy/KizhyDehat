-- Add discount_amount and subtotal columns to sales table (only if they don't exist)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'sales'
        AND column_name = 'discount_amount'
) THEN
ALTER TABLE sales
ADD COLUMN discount_amount NUMERIC(10, 2) DEFAULT 0;
COMMENT ON COLUMN sales.discount_amount IS 'Discount amount applied to the sale';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'sales'
        AND column_name = 'subtotal'
) THEN
ALTER TABLE sales
ADD COLUMN subtotal NUMERIC(10, 2) DEFAULT 0;
COMMENT ON COLUMN sales.subtotal IS 'Subtotal before discount';
END IF;
END $$;
-- Update existing records to set subtotal equal to total (since no discount was applied)
UPDATE sales
SET subtotal = total
WHERE subtotal = 0
    OR subtotal IS NULL;