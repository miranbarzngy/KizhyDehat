-- Create invoice_settings table
CREATE TABLE IF NOT EXISTS invoice_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name TEXT NOT NULL DEFAULT 'فرۆشگای کوردستان',
  shop_phone TEXT,
  shop_address TEXT,
  shop_logo TEXT,
  thank_you_note TEXT DEFAULT 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.',
  qr_code_url TEXT,
  starting_invoice_number INTEGER DEFAULT 1000,
  current_invoice_number INTEGER DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to manage invoice settings" ON invoice_settings
FOR ALL USING (auth.role() = 'authenticated');

-- Insert default settings if table is empty
INSERT INTO invoice_settings (shop_name, thank_you_note, starting_invoice_number, current_invoice_number)
SELECT 'فرۆشگای کوردستان', 'سوپاس بۆ کڕینەکەتان! بە هیوای دووبارە بینین.', 1000, 1000
WHERE NOT EXISTS (SELECT 1 FROM invoice_settings LIMIT 1);
