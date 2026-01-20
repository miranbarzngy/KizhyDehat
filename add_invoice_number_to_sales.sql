-- Add invoice_number column to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_number INTEGER;

-- Create a function to assign invoice numbers to existing sales
-- This will assign sequential numbers starting from 1000
CREATE OR REPLACE FUNCTION assign_invoice_numbers()
RETURNS VOID AS $$
DECLARE
    sale_record RECORD;
    counter INTEGER := 1000;
BEGIN
    -- Loop through all sales ordered by date
    FOR sale_record IN
        SELECT id FROM sales ORDER BY date ASC
    LOOP
        UPDATE sales
        SET invoice_number = counter
        WHERE id = sale_record.id;

        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to assign invoice numbers to existing sales
SELECT assign_invoice_numbers();

-- Drop the function after use
DROP FUNCTION assign_invoice_numbers();

-- Add a unique constraint on invoice_number to prevent duplicates
ALTER TABLE sales ADD CONSTRAINT unique_invoice_number UNIQUE (invoice_number);

-- Create an index for better performance
CREATE INDEX idx_sales_invoice_number ON sales(invoice_number);
