-- Force Reset Inventory Function
-- This function truncates all tables with CASCADE to handle FK constraints
-- and RESTART IDENTITY to reset auto-increment counters

CREATE OR REPLACE FUNCTION force_reset_inventory()
RETURNS void AS $$
BEGIN
  TRUNCATE TABLE 
    sale_items, 
    customer_payments, 
    supplier_payments, 
    supplier_transactions,
    supplier_debts,
    purchase_expenses,
    supplier_purchases,
    sales, 
    products, 
    customers, 
    suppliers, 
    categories, 
    units, 
    profiles, 
    roles, 
    expenses, 
    activity_logs, 
    shop_settings, 
    invoice_settings
  RESTART IDENTITY CASCADE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
