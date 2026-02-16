-- Add RLS policies for customer_payments table
-- Enable RLS if not already enabled
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_payments
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
