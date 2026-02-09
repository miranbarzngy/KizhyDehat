-- Add total_discounts column to products table
-- This column tracks the total discount amount given when selling each product

ALTER TABLE products ADD COLUMN IF NOT EXISTS total_discounts Numeric DEFAULT 0;

-- Update existing records to have 0 discounts
UPDATE products SET total_discounts = 0 WHERE total_discounts IS NULL;
