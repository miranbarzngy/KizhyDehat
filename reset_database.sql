-- Complete database reset script
-- Run this in Supabase SQL Editor to delete all data and start fresh
-- WARNING: This will delete ALL data permanently!

-- Step 1: Delete sale items first (child table)
DELETE FROM sale_items;

-- Step 2: Delete sales (parent table)
DELETE FROM sales;

-- Step 3: Delete supplier transactions
DELETE FROM supplier_transactions;

-- Step 4: Delete products
DELETE FROM products;

-- Step 5: Delete inventory
DELETE FROM inventory;

-- Step 6: Delete expenses (inventory related)
DELETE FROM expenses WHERE category = 'inventory_purchase';

-- Step 7: Reset supplier balances to 0
UPDATE suppliers SET balance = 0;

-- Step 8: Delete customer payments
DELETE FROM customer_payments;

-- Step 9: Delete customers
DELETE FROM customers;

-- Step 10: Delete suppliers (optional - uncomment if you want to delete suppliers too)
-- DELETE FROM suppliers;

-- Step 11: Delete employees and payroll (optional)
-- DELETE FROM payroll;
-- DELETE FROM employees;

-- Step 12: Delete online menu items (optional)
-- DELETE FROM online_menu_items;

-- Step 13: Delete orders (optional)
-- DELETE FROM orders;

-- Reset sequences if needed (optional)
-- ALTER SEQUENCE inventory_id_seq RESTART WITH 1;
-- ALTER SEQUENCE customers_id_seq RESTART WITH 1;
-- ALTER SEQUENCE suppliers_id_seq RESTART WITH 1;

-- Success message
SELECT 'Database reset complete! All inventory, sales, and customer data has been deleted.' as status;
