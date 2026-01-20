-- Create invoice number sequence
-- This will be managed by the database to ensure uniqueness and proper ordering

-- First, add the invoice_number column if it doesn't exist
ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_number INTEGER;

-- Create the sequence starting from 1000 (default starting number)
DROP SEQUENCE IF EXISTS invoice_num_seq;
CREATE SEQUENCE invoice_num_seq START WITH 1000 INCREMENT BY 1;

-- Update the sales table to use the sequence as default for invoice_number
-- Note: This will only affect new inserts, existing records keep their values
ALTER TABLE sales ALTER COLUMN invoice_number SET DEFAULT nextval('invoice_num_seq');

-- Create a function to reset the sequence based on invoice_settings
CREATE OR REPLACE FUNCTION reset_invoice_sequence()
RETURNS VOID AS $$
DECLARE
    start_num INTEGER;
BEGIN
    -- Get the starting number from invoice_settings
    SELECT COALESCE(starting_invoice_number, 1000) INTO start_num
    FROM invoice_settings
    LIMIT 1;

    -- Ensure start_num is at least 1
    IF start_num < 1 THEN
        start_num := 1;
    END IF;

    -- Reset the sequence to start from this number
    -- Note: This will only affect future sequence calls, not existing data
    PERFORM setval('invoice_num_seq', GREATEST(start_num - 1, 1));

    RAISE NOTICE 'Invoice sequence reset to start from %', start_num;
END;
$$ LANGUAGE plpgsql;

-- Reset the sequence to match current settings
SELECT reset_invoice_sequence();

-- Create a trigger to automatically update the sequence when invoice_settings change
CREATE OR REPLACE FUNCTION update_invoice_sequence_on_settings_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only reset if starting_invoice_number changed
    IF OLD.starting_invoice_number IS DISTINCT FROM NEW.starting_invoice_number THEN
        -- Reset sequence to new starting number (ensure it's at least 1)
        PERFORM setval('invoice_num_seq', GREATEST(NEW.starting_invoice_number - 1, 1));
        RAISE NOTICE 'Invoice sequence updated to start from % due to settings change', NEW.starting_invoice_number;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_invoice_sequence ON invoice_settings;
CREATE TRIGGER trigger_update_invoice_sequence
    AFTER UPDATE ON invoice_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_sequence_on_settings_change();

-- For existing sales without invoice numbers, assign them sequentially
-- This ensures all sales have proper invoice numbers
CREATE OR REPLACE FUNCTION assign_missing_invoice_numbers()
RETURNS VOID AS $$
DECLARE
    sale_record RECORD;
    current_seq_val BIGINT;
BEGIN
    -- Get current sequence value
    SELECT last_value INTO current_seq_val FROM invoice_num_seq;

    -- Loop through sales without invoice numbers, ordered by creation date
    FOR sale_record IN
        SELECT id FROM sales
        WHERE invoice_number IS NULL
        ORDER BY date ASC
    LOOP
        -- Assign next sequence value
        UPDATE sales
        SET invoice_number = nextval('invoice_num_seq')
        WHERE id = sale_record.id;
    END LOOP;

    RAISE NOTICE 'Assigned invoice numbers to % existing sales', (SELECT COUNT(*) FROM sales WHERE invoice_number IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- Assign invoice numbers to any existing sales that don't have them
SELECT assign_missing_invoice_numbers();
