-- Add total_debt column to suppliers table if it doesn't exist
-- This migration ensures suppliers have a total_debt column for debt tracking

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS total_debt NUMERIC(15,2) DEFAULT 0;

-- Update existing suppliers to have total_debt = balance if total_debt is 0
UPDATE suppliers 
SET total_debt = COALESCE(balance, 0)
WHERE total_debt = 0 OR total_debt IS NULL;

-- Enable RLS on supplier_payments if not already enabled
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for supplier_payments
DROP POLICY IF EXISTS "Allow authenticated users to manage supplier_payments" ON supplier_payments;
CREATE POLICY "Allow authenticated users to manage supplier_payments" 
ON supplier_payments FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
