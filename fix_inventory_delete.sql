-- ============================================
-- FIX FOREIGN KEY CONSTRAINT BLOCKING DELETES
-- Run this in Supabase SQL Editor
-- ============================================

-- The issue: sale_items table references inventory.id
-- When you try to delete inventory items that have sales, it fails

-- OPTION 1: Drop the constraint (use if you don't need to track sales history)
-- Run this to allow deletion without foreign key restrictions:

ALTER TABLE sale_items DROP CONSTRAINT sale_items_item_id_fkey;

-- OPTION 2: CASCADE delete (deletes sale items when inventory is deleted)
/*
-- First drop the existing constraint
ALTER TABLE sale_items DROP CONSTRAINT sale_items_item_id_fkey;

-- Then add it back with CASCADE
ALTER TABLE sale_items
ADD CONSTRAINT sale_items_item_id_fkey
FOREIGN KEY (item_id) REFERENCES inventory(id)
ON DELETE CASCADE;
*/

-- OPTION 3: SET NULL (keeps sale record but removes reference)
/*
ALTER TABLE sale_items DROP CONSTRAINT sale_items_item_id_fkey;

ALTER TABLE sale_items
ADD CONSTRAINT sale_items_item_id_fkey
FOREIGN KEY (item_id) REFERENCES inventory(id)
ON DELETE SET NULL;
*/

-- After running this, the delete should work!
