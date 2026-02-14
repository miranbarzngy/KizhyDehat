-- Add cumulative sale statistics fields to products table
-- This is needed for the archive grid to display sales statistics

ALTER TABLE products ADD COLUMN IF NOT EXISTS total_sold NUMERIC(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_profit NUMERIC(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_discounts NUMERIC(10,2) DEFAULT 0;

-- Add comments to document the columns
COMMENT ON COLUMN products.total_sold IS 'Total quantity sold for this item';
COMMENT ON COLUMN products.total_revenue IS 'Total revenue generated from sales of this item';
COMMENT ON COLUMN products.total_profit IS 'Total profit generated from sales of this item';
COMMENT ON COLUMN products.total_discounts IS 'Total discounts given on this item';
