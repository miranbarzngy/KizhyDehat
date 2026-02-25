-- Reset invoice sequence to start from 0
-- Run this in Supabase SQL Editor

-- Reset the sequence to start from 0 (so next value will be 1)
SELECT setval('invoice_num_seq', 0);

-- Optionally update the invoice_settings to reflect the change
UPDATE invoice_settings 
SET starting_invoice_number = 1, 
    current_invoice_number = 1
WHERE id IS NOT NULL;

-- Verify the reset
SELECT last_value as current_sequence_value FROM invoice_num_seq;
