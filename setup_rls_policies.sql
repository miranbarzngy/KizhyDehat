-- Row Level Security (RLS) Policies for all database tables
-- Run this in Supabase SQL Editor to enable proper access to tables
-- This script handles existing policies gracefully

-- ===========================================
-- CUSTOMERS TABLE POLICIES
-- ===========================================

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON customers;
DROP POLICY IF EXISTS "Allow authenticated users to delete customers" ON customers;

-- Allow authenticated users to read customers
CREATE POLICY "Allow authenticated users to read customers" ON customers
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert customers
CREATE POLICY "Allow authenticated users to insert customers" ON customers
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update customers
CREATE POLICY "Allow authenticated users to update customers" ON customers
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete customers
CREATE POLICY "Allow authenticated users to delete customers" ON customers
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- CUSTOMER PAYMENTS TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read customer_payments" ON customer_payments;
DROP POLICY IF EXISTS "Allow authenticated users to insert customer_payments" ON customer_payments;
DROP POLICY IF EXISTS "Allow authenticated users to update customer_payments" ON customer_payments;
DROP POLICY IF EXISTS "Allow authenticated users to delete customer_payments" ON customer_payments;

CREATE POLICY "Allow authenticated users to read customer_payments" ON customer_payments
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert customer_payments" ON customer_payments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update customer_payments" ON customer_payments
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete customer_payments" ON customer_payments
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- SUPPLIERS TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated users to insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated users to update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Allow authenticated users to delete suppliers" ON suppliers;

CREATE POLICY "Allow authenticated users to read suppliers" ON suppliers
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert suppliers" ON suppliers
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update suppliers" ON suppliers
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete suppliers" ON suppliers
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- SUPPLIER PURCHASES TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read supplier_purchases" ON supplier_purchases;
DROP POLICY IF EXISTS "Allow authenticated users to insert supplier_purchases" ON supplier_purchases;
DROP POLICY IF EXISTS "Allow authenticated users to update supplier_purchases" ON supplier_purchases;
DROP POLICY IF EXISTS "Allow authenticated users to delete supplier_purchases" ON supplier_purchases;

CREATE POLICY "Allow authenticated users to read supplier_purchases" ON supplier_purchases
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert supplier_purchases" ON supplier_purchases
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update supplier_purchases" ON supplier_purchases
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete supplier_purchases" ON supplier_purchases
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- SUPPLIER DEBTS TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read supplier_debts" ON supplier_debts;
DROP POLICY IF EXISTS "Allow authenticated users to insert supplier_debts" ON supplier_debts;
DROP POLICY IF EXISTS "Allow authenticated users to update supplier_debts" ON supplier_debts;
DROP POLICY IF EXISTS "Allow authenticated users to delete supplier_debts" ON supplier_debts;

CREATE POLICY "Allow authenticated users to read supplier_debts" ON supplier_debts
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert supplier_debts" ON supplier_debts
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update supplier_debts" ON supplier_debts
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete supplier_debts" ON supplier_debts
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- SUPPLIER PAYMENTS TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read supplier_payments" ON supplier_payments;
DROP POLICY IF EXISTS "Allow authenticated users to insert supplier_payments" ON supplier_payments;
DROP POLICY IF EXISTS "Allow authenticated users to update supplier_payments" ON supplier_payments;
DROP POLICY IF EXISTS "Allow authenticated users to delete supplier_payments" ON supplier_payments;

CREATE POLICY "Allow authenticated users to read supplier_payments" ON supplier_payments
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert supplier_payments" ON supplier_payments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update supplier_payments" ON supplier_payments
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete supplier_payments" ON supplier_payments
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- SUPPLIER TRANSACTIONS TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read supplier_transactions" ON supplier_transactions;
DROP POLICY IF EXISTS "Allow authenticated users to insert supplier_transactions" ON supplier_transactions;
DROP POLICY IF EXISTS "Allow authenticated users to update supplier_transactions" ON supplier_transactions;
DROP POLICY IF EXISTS "Allow authenticated users to delete supplier_transactions" ON supplier_transactions;

CREATE POLICY "Allow authenticated users to read supplier_transactions" ON supplier_transactions
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert supplier_transactions" ON supplier_transactions
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update supplier_transactions" ON supplier_transactions
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete supplier_transactions" ON supplier_transactions
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- PRODUCTS TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON products;

CREATE POLICY "Allow authenticated users to read products" ON products
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert products" ON products
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update products" ON products
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete products" ON products
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- INVENTORY TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read inventory" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated users to insert inventory" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated users to update inventory" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated users to delete inventory" ON inventory;

CREATE POLICY "Allow authenticated users to read inventory" ON inventory
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert inventory" ON inventory
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update inventory" ON inventory
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete inventory" ON inventory
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- SALES TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to insert sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to update sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to delete sales" ON sales;

CREATE POLICY "Allow authenticated users to read sales" ON sales
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert sales" ON sales
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update sales" ON sales
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete sales" ON sales
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- SALE ITEMS TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read sale_items" ON sale_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert sale_items" ON sale_items;
DROP POLICY IF EXISTS "Allow authenticated users to update sale_items" ON sale_items;
DROP POLICY IF EXISTS "Allow authenticated users to delete sale_items" ON sale_items;

CREATE POLICY "Allow authenticated users to read sale_items" ON sale_items
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert sale_items" ON sale_items
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update sale_items" ON sale_items
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete sale_items" ON sale_items
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- EXPENSES TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read expenses" ON expenses;
DROP POLICY IF EXISTS "Allow authenticated users to insert expenses" ON expenses;
DROP POLICY IF EXISTS "Allow authenticated users to update expenses" ON expenses;
DROP POLICY IF EXISTS "Allow authenticated users to delete expenses" ON expenses;

CREATE POLICY "Allow authenticated users to read expenses" ON expenses
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert expenses" ON expenses
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update expenses" ON expenses
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete expenses" ON expenses
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- EMPLOYEES TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to insert employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to update employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to delete employees" ON employees;

CREATE POLICY "Allow authenticated users to read employees" ON employees
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert employees" ON employees
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update employees" ON employees
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete employees" ON employees
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- PAYROLL TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read payroll" ON payroll;
DROP POLICY IF EXISTS "Allow authenticated users to insert payroll" ON payroll;
DROP POLICY IF EXISTS "Allow authenticated users to update payroll" ON payroll;
DROP POLICY IF EXISTS "Allow authenticated users to delete payroll" ON payroll;

CREATE POLICY "Allow authenticated users to read payroll" ON payroll
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert payroll" ON payroll
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update payroll" ON payroll
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete payroll" ON payroll
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- ONLINE MENU ITEMS TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read online_menu_items" ON online_menu_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert online_menu_items" ON online_menu_items;
DROP POLICY IF EXISTS "Allow authenticated users to update online_menu_items" ON online_menu_items;
DROP POLICY IF EXISTS "Allow authenticated users to delete online_menu_items" ON online_menu_items;

CREATE POLICY "Allow authenticated users to read online_menu_items" ON online_menu_items
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert online_menu_items" ON online_menu_items
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update online_menu_items" ON online_menu_items
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete online_menu_items" ON online_menu_items
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- ORDERS TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to insert orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to update orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to delete orders" ON orders;

CREATE POLICY "Allow authenticated users to read orders" ON orders
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert orders" ON orders
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update orders" ON orders
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete orders" ON orders
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- CATEGORIES TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete categories" ON categories;

CREATE POLICY "Allow authenticated users to read categories" ON categories
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert categories" ON categories
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update categories" ON categories
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete categories" ON categories
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- SHOP SETTINGS TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read shop_settings" ON shop_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert shop_settings" ON shop_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update shop_settings" ON shop_settings;
DROP POLICY IF EXISTS "Allow authenticated users to delete shop_settings" ON shop_settings;

CREATE POLICY "Allow authenticated users to read shop_settings" ON shop_settings
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert shop_settings" ON shop_settings
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update shop_settings" ON shop_settings
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete shop_settings" ON shop_settings
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- ROLES TABLE POLICIES
-- ===========================================

DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to insert roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to update roles" ON roles;
DROP POLICY IF EXISTS "Allow authenticated users to delete roles" ON roles;

CREATE POLICY "Allow authenticated users to read roles" ON roles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert roles" ON roles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update roles" ON roles
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete roles" ON roles
FOR DELETE USING (auth.role() = 'authenticated');
