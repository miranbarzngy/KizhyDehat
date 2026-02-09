-- Migration: Drop inventory table and use products as primary source
-- Generated: 2026-02-09

-- Step 1: Drop the inventory table (and its related RLS policies if any)
DROP TABLE IF EXISTS inventory CASCADE;

-- Step 2: Ensure products table has all required columns for our workflow
-- The products table already has:
-- - barcode1, barcode2, barcode3, barcode4 (all TEXT)
-- - name, image, unit, total_amount_bought, total_purchase_price
-- - selling_price_per_unit, cost_per_unit
-- - added_date, expire_date, supplier_id, note

-- Step 3: Create indexes for better performance on products table
CREATE INDEX IF NOT EXISTS idx_products_barcode1 ON products(barcode1);
CREATE INDEX IF NOT EXISTS idx_products_barcode2 ON products(barcode2);
CREATE INDEX IF NOT EXISTS idx_products_barcode3 ON products(barcode3);
CREATE INDEX IF NOT EXISTS idx_products_barcode4 ON products(barcode4);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_added_date ON products(added_date);

-- Step 4: Update RLS policy for products (if needed)
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow authenticated users to access products" ON products
-- FOR ALL USING (auth.role() = 'authenticated');

-- Step 5: Verify the products table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;
