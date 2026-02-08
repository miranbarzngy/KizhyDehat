-- ============================================
-- SQL VIEW: Inventory with Sales Check
-- Run this in Supabase SQL Editor
-- ============================================

-- View to see which inventory items have sales history
CREATE OR REPLACE VIEW inventory_with_sales AS
SELECT
  i.*,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM sale_items si WHERE si.item_id = i.id
    ) THEN true
    ELSE false
  END as has_sales
FROM inventory i;

-- Optional: RPC function to check if a specific item has sales
CREATE OR REPLACE FUNCTION item_has_sales(p_item_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM sale_items WHERE item_id = p_item_id
  );
END;
$$;

-- Example usage in frontend:
-- const { data } = await supabase
--   .from('inventory_with_sales')
--   .select('*, has_sales')
--   .eq('has_sales', false)  -- Only show items without sales (deletable)
