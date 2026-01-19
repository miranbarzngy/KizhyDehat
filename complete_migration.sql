-- Complete Database Migration Script
-- Run this in Supabase SQL Editor to set up all required tables and fields

-- ===========================================
-- 1. ADD MISSING FIELDS TO PROFILES TABLE
-- ===========================================

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- ===========================================
-- 2. CREATE SHOP_SETTINGS TABLE (if not exists)
-- ===========================================

CREATE TABLE IF NOT EXISTS shop_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shopname TEXT NOT NULL,
  icon TEXT,
  phone TEXT,
  location TEXT,
  qrcodeimage TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default shop settings if not exists
INSERT INTO shop_settings (shopname, phone, location)
SELECT 'فرۆشگای کوردستان', '+964 750 123 4567', 'هەولێر، کوردستان'
WHERE NOT EXISTS (SELECT 1 FROM shop_settings LIMIT 1);

-- ===========================================
-- 3. CREATE CATEGORIES TABLE (if not exists)
-- ===========================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name) VALUES
  ('سرکە'),
  ('هەنگوین')
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- 4. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ===========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 5. DROP EXISTING POLICIES (to avoid conflicts)
-- ===========================================

-- Profiles policies
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;

-- Shop settings policies
DROP POLICY IF EXISTS "Allow authenticated users to read shop_settings" ON shop_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert shop_settings" ON shop_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update shop_settings" ON shop_settings;
DROP POLICY IF EXISTS "Allow authenticated users to delete shop_settings" ON shop_settings;

-- Categories policies
DROP POLICY IF EXISTS "Allow authenticated users to read categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete categories" ON categories;

-- ===========================================
-- 6. CREATE NEW POLICIES
-- ===========================================

-- Profiles policies
CREATE POLICY "Allow authenticated users to read profiles" ON profiles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert profiles" ON profiles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update profiles" ON profiles
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Shop settings policies
CREATE POLICY "Allow authenticated users to read shop_settings" ON shop_settings
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert shop_settings" ON shop_settings
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update shop_settings" ON shop_settings
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete shop_settings" ON shop_settings
FOR DELETE USING (auth.role() = 'authenticated');

-- Categories policies
CREATE POLICY "Allow authenticated users to read categories" ON categories
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert categories" ON categories
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update categories" ON categories
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete categories" ON categories
FOR DELETE USING (auth.role() = 'authenticated');

-- ===========================================
-- 7. INSERT DEFAULT ROLES (if not exist)
-- ===========================================

INSERT INTO roles (name, permissions) VALUES
('Admin', '{"sales": true, "inventory": true, "customers": true, "suppliers": true, "payroll": true, "profits": true}'),
('Manager', '{"sales": true, "inventory": true, "customers": true, "suppliers": false, "payroll": false, "profits": true}'),
('Cashier', '{"sales": true, "inventory": false, "customers": false, "suppliers": false, "payroll": false, "profits": false}')
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- 8. STORAGE POLICIES (if storage is set up)
-- ===========================================

-- Create storage bucket for images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for images bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
);
