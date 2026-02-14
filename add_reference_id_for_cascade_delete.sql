-- Add reference_id column to products table for cascading deletes
-- This reference_id will link products to purchase_expenses, supplier_transactions, and supplier_debts

-- Add reference_id to products table (can be NULL for backward compatibility)
ALTER TABLE products ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Add reference_id to purchase_expenses table
ALTER TABLE purchase_expenses ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Add reference_id to supplier_transactions table
ALTER TABLE supplier_transactions ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Add reference_id to supplier_debts table
ALTER TABLE supplier_debts ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Create index for faster lookups on reference_id
CREATE INDEX IF NOT EXISTS idx_products_reference_id ON products(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_expenses_reference_id ON purchase_expenses(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_transactions_reference_id ON supplier_transactions(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_debts_reference_id ON supplier_debts(reference_id) WHERE reference_id IS NOT NULL;

-- Create function to handle cascading delete
CREATE OR REPLACE FUNCTION delete_product_cascade(p_reference_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from supplier_debts first (has foreign key constraints)
  DELETE FROM supplier_debts WHERE reference_id = p_reference_id;
  
  -- Delete from supplier_transactions
  DELETE FROM supplier_transactions WHERE reference_id = p_reference_id;
  
  -- Delete from purchase_expenses
  DELETE FROM purchase_expenses WHERE reference_id = p_reference_id;
  
  -- Delete from products (this should be called last or handled by application)
  DELETE FROM products WHERE reference_id = p_reference_id;
END;
$$;

-- Create trigger function for auto-cascade on product delete
CREATE OR REPLACE FUNCTION trigger_delete_product_cascade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reference_id UUID;
BEGIN
  -- Get the reference_id before deletion
  v_reference_id := OLD.reference_id;
  
  -- If no reference_id, try to use the id as fallback
  IF v_reference_id IS NULL THEN
    v_reference_id := OLD.id;
  END IF;
  
  -- Delete related records
  DELETE FROM supplier_debts WHERE reference_id = v_reference_id OR note = OLD.name;
  DELETE FROM supplier_transactions WHERE reference_id = v_reference_id OR item_name = OLD.name;
  DELETE FROM purchase_expenses WHERE reference_id = v_reference_id OR item_name = OLD.name;
  
  RETURN OLD;
END;
$$;

-- Create trigger on products table
DROP TRIGGER IF EXISTS trigger_product_delete_cascade ON products;
CREATE TRIGGER trigger_product_delete_cascade
  BEFORE DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_delete_product_cascade();

-- Also add reference_id to supplier_debts note column tracking for fallback
-- This helps find debts when reference_id is not set
