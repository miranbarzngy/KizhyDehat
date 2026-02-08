-- Run this in Supabase SQL Editor to fix the delete issue
-- This changes the foreign key constraint to SET NULL

ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_item_id_fkey;

ALTER TABLE sale_items
ADD CONSTRAINT sale_items_item_id_fkey
FOREIGN KEY (item_id) REFERENCES inventory(id)
ON DELETE SET NULL;
