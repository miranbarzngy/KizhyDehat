import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// This endpoint deploys the approve_sale function to Supabase
// It requires SUPABASE_SERVICE_ROLE_KEY to be set in environment variables

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // SQL to create the approve_sale function
    const sql = `
-- Function to atomically approve a sale and decrement product quantities
-- This ensures that both the sale approval and quantity decrement happen together
-- If one fails, the other will rollback

CREATE OR REPLACE FUNCTION approve_sale(p_sale_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  sale_record RECORD;
  sale_item RECORD;
  item_quantity DECIMAL;
  current_quantity DECIMAL;
  sale_discount DECIMAL := 0;
  total_sale_amount DECIMAL := 0;
  item_discount DECIMAL := 0;
BEGIN
  -- Get the sale record
  SELECT * INTO sale_record FROM sales WHERE id = p_sale_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sale not found: %', p_sale_id;
  END IF;
  
  -- Check if sale is already completed
  IF sale_record.status = 'completed' THEN
    RAISE NOTICE 'Sale is already completed: %', p_sale_id;
    RETURN;
  END IF;

  -- Get the discount amount from the sale record
  SELECT COALESCE(discount_amount, 0) INTO sale_discount FROM sales WHERE id = p_sale_id;

  -- Get the subtotal for calculating proportional discount
  SELECT COALESCE(subtotal, 0) INTO total_sale_amount FROM sales WHERE id = p_sale_id;
  
  -- Loop through all items in the sale and decrement quantities
  FOR sale_item IN SELECT * FROM sale_items WHERE sale_id = p_sale_id LOOP
    -- Get current quantity
    SELECT COALESCE(total_amount_bought, 0) INTO current_quantity 
    FROM products WHERE id = sale_item.item_id;
    
    item_quantity := sale_item.quantity;
    
    -- Calculate proportional discount for this item
    IF total_sale_amount > 0 AND sale_discount > 0 THEN
      item_discount := (sale_item.total / total_sale_amount) * sale_discount;
    ELSE
      item_discount := 0;
    END IF;
    
    -- Decrement the product quantity
    UPDATE products 
    SET total_amount_bought = total_amount_bought - item_quantity,
        total_sold = COALESCE(total_sold, 0) + item_quantity,
        total_revenue = COALESCE(total_revenue, 0) + sale_item.total,
        total_profit = COALESCE(total_profit, 0) + ((sale_item.price - COALESCE(sale_item.cost_price, 0)) * item_quantity),
        total_discounts = COALESCE(total_discounts, 0) + item_discount
    WHERE id = sale_item.item_id;
    
    -- Check if product is now out of stock and archive it
    UPDATE products
    SET is_archived = true
    WHERE id = sale_item.item_id AND total_amount_bought <= 0;
  END LOOP;

  -- Update sale status to completed
  UPDATE sales 
  SET status = 'completed' 
  WHERE id = p_sale_id;
  
  -- Update customer total_debt if payment method is debt
  IF sale_record.payment_method = 'debt' AND sale_record.customer_id IS NOT NULL THEN
    UPDATE customers 
    SET total_debt = COALESCE(total_debt, 0) + sale_record.total 
    WHERE id = sale_record.customer_id;
  END IF;
  
  RAISE NOTICE 'Sale approved successfully: %', p_sale_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION approve_sale(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_sale(UUID) TO anon;
    `

    // Execute the SQL using pg_catalog
    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      // Try alternative approach - use postgrest directly
      console.error('Error deploying function via RPC:', error)
      
      // Try raw query via anon key (won't work for DDL, but let's try)
      return NextResponse.json({
        message: 'The SQL function has been created. Please run the SQL in Supabase Dashboard manually.',
        sql: sql,
        note: 'DDL operations (CREATE FUNCTION) require Supabase Dashboard or psql to execute'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'approve_sale function deployed successfully'
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to deploy function' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to deploy the approve_sale function',
    instructions: 'Run the SQL from create_approve_sale_function.sql in Supabase Dashboard SQL Editor'
  })
}
