-- Fix activity_logs entity_type constraint - handles all cases
-- Run this in Supabase SQL Editor

-- First, let's see what entity_type values currently exist in the table
SELECT DISTINCT entity_type FROM activity_logs;

-- Find and drop any CHECK constraint on entity_type column
DO $$
DECLARE
    cons_name text;
BEGIN
    -- Find and drop the constraint
    SELECT conname INTO cons_name 
    FROM pg_constraint 
    WHERE conrelid = 'activity_logs'::regclass 
    AND contype = 'c' 
    AND pg_get_constraintdef(oid) LIKE '%entity_type%';
    
    IF cons_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE activity_logs DROP CONSTRAINT ' || cons_name;
        RAISE NOTICE 'Dropped constraint: %', cons_name;
    ELSE
        RAISE NOTICE 'No entity_type constraint found to drop';
    END IF;
END $$;

-- Create new constraint with expanded values including category and unit
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_entity_type_check 
CHECK (entity_type IN (
  'product', 
  'sale', 
  'customer', 
  'supplier', 
  'user', 
  'expense', 
  'customer_payment', 
  'supplier_payment',
  'category',
  'unit'
));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'activity_logs_entity_type_check';
