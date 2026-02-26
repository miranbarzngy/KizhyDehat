-- Migration: Add order_source to sales table and ensure decimal quantity in sale_items
-- Date: 2026-02-26

-- 1. Add order_source column to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS order_source TEXT;

-- 2. Ensure quantity column in sale_items supports decimals
-- PostgreSQL NUMERIC/DECIMAL type already supports decimals, but let's ensure it's set correctly
ALTER TABLE sale_items ALTER COLUMN quantity TYPE NUMERIC(10, 3);

-- 3. Create index for faster queries on order_source
CREATE INDEX IF NOT EXISTS idx_sales_order_source ON sales(order_source);

-- 4. Add comment for documentation
COMMENT ON COLUMN sales.order_source IS 'Order source: Instagram, Facebook, TikTok, WhatsApp, In-Store, Other';
