-- Add payment_method column to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';

-- Update existing sales records to have 'cash' as default payment method
UPDATE sales SET payment_method = 'cash' WHERE payment_method IS NULL;
