-- Fix activity_logs entity_type constraint
-- Run this in Supabase SQL Editor

-- First, let's see what entity_type values currently exist in the table
SELECT DISTINCT entity_type FROM activity_logs;

-- If there are rows with 'category' or 'unit', they were added without constraint
-- We need to first delete or update those rows to proceed

-- Delete any rows with invalid entity_types (if they exist)
DELETE FROM activity_logs WHERE entity_type NOT IN (
  'product', 
  'sale', 
  'customer', 
  'supplier', 
  'user', 
  'expense', 
  'customer_payment', 
  'supplier_payment'
);

-- Now drop the existing constraint
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_entity_type_check;

-- Create new constraint with expanded values (added 'role' for role management activities)
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_entity_type_check 
CHECK (entity_type IN (
  'product', 
  'sale', 
  'customer', 
  'supplier', 
  'user', 
  'role',
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
