-- Add cumulative sale statistics fields to inventory table
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS total_sold NUMERIC(10,2) DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(10,2) DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS total_profit NUMERIC(10,2) DEFAULT 0;

-- Add comments to document the columns
COMMENT ON COLUMN inventory.total_sold IS 'Total quantity sold for this item';
COMMENT ON COLUMN inventory.total_revenue IS 'Total revenue generated from sales of this item';
COMMENT ON COLUMN inventory.total_profit IS 'Total profit generated from sales of this item';