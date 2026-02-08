-- ============================================
-- FIX FOREIGN KEY CONSTRAINT - SET NULL
-- Run this in Supabase SQL Editor
-- ============================================

-- This preserves sales history while allowing inventory deletion
-- When an inventory item is deleted, sale_items.item_id becomes NULL
-- but the price and quantity remain intact

-- STEP 1: Check if item_id column is nullable
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'sale_items'
AND column_name = 'item_id';

-- STEP 2: If item_id is NOT NULL, make it nullable first
ALTER TABLE sale_items ALTER COLUMN item_id DROP NOT NULL;

-- STEP 3: Drop the existing constraint
ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_item_id_fkey;

-- STEP 4: Add the constraint with SET NULL
ALTER TABLE sale_items
ADD CONSTRAINT sale_items_item_id_fkey
FOREIGN KEY (item_id) REFERENCES inventory(id)
ON DELETE SET NULL;

-- VERIFY: Check the constraint was created correctly
SELECT
  conname as constraint_name,
  confdeltype as on_delete_action
FROM pg_constraint
WHERE conname = 'sale_items_item_id_fkey';
-- Should show 's' for SET NULL
