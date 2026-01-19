-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id foreign key to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Remove old categories and insert only the required ones
DELETE FROM categories WHERE name NOT IN ('سرکە', 'هەنگوین');

-- Create shop_settings table
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

-- Insert only the required categories
INSERT INTO categories (name) VALUES
  ('سرکە'),
  ('هەنگوین')
ON CONFLICT (name) DO NOTHING;

-- Insert default shop settings if not exists
INSERT INTO shop_settings (shopname, phone, location)
SELECT 'فرۆشگای کوردستان', '+964 750 123 4567', 'هەولێر، کوردستان'
WHERE NOT EXISTS (SELECT 1 FROM shop_settings LIMIT 1);
