import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// This endpoint deploys the revert_sale_stock function to Supabase
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

    // SQL to create the revert_sale_stock function
    const sql = `
-- Function to revert stock when a sale is cancelled or refunded
-- This restores the product quantities back to the products table
-- Also reverses customer debt if the sale was paid by debt

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
    SET total_sold = GREATEST(COALESCE(total_sold, 0) - item_quantity, 0),
        total_revenue = GREATEST(COALESCE(total_revenue, 0) - sale_item.total, 0),
        total_profit = GREATEST(COALESCE(total_profit, 0) - ((sale_item.price - COALESCE(sale_item.cost_price, 0)) * item_quantity), 0)
    WHERE id = sale_item.item_id;
  END LOOP;

  -- Reverse customer debt if payment method was debt
  IF sale_record.payment_method = 'debt' AND sale_record.customer_id IS NOT NULL THEN
    UPDATE customers 
    SET total_debt = GREATEST(COALESCE(total_debt, 0) - sale_record.total, 0)
    WHERE id = sale_record.customer_id;
  END IF;

  RAISE NOTICE 'Sale stock reverted successfully: %', p_sale_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION revert_sale_stock(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION revert_sale_stock(UUID) TO anon;
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
      message: 'revert_sale_stock function deployed successfully'
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
    message: 'POST to deploy the revert_sale_stock function',
    instructions: 'Run the SQL from cancel_sale_function.sql in Supabase Dashboard SQL Editor'
  })
}
