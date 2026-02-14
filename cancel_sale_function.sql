-- Function to revert stock when a sale is cancelled or refunded
-- This restores the product quantities back to the products table

CREATE OR REPLACE FUNCTION revert_sale_stock(p_sale_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  sale_record RECORD;
  sale_item RECORD;
  item_quantity DECIMAL;
BEGIN
  -- Get the sale record
  SELECT * INTO sale_record FROM sales WHERE id = p_sale_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found: %', p_sale_id;
  END IF;
  
  -- Check if sale is pending (only revert stock for pending sales)
  IF sale_record.status != 'pending' THEN
    RAISE NOTICE 'Can only revert stock for pending sales: %', p_sale_id;
    RETURN;
  END IF;

  -- Loop through all items in the sale and restore quantities
  FOR sale_item IN SELECT * FROM sale_items WHERE sale_id = p_sale_id LOOP
    item_quantity := sale_item.quantity;
    
    -- Restore the product quantity
    UPDATE products 
    SET total_amount_bought = COALESCE(total_amount_bought, 0) + item_quantity,
        is_archived = false
    WHERE id = sale_item.item_id;
    
    -- Also decrement the sales statistics since sale is being cancelled
    UPDATE products
    SET total_sold = GREATEST(COALESCE(total_sold, 0) - item_quantity, 0)
    WHERE id = sale_item.item_id;
  END LOOP;

  RAISE NOTICE 'Sale stock reverted successfully: %', p_sale_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION revert_sale_stock(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION revert_sale_stock(UUID) TO anon;
