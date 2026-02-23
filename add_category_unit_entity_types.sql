-- Add role, category, and unit as valid entity_types for activity_logs
-- Run this in Supabase SQL Editor to fix activity logging for roles, units, and categories

-- Drop existing CHECK constraint if it exists
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_entity_type_check;

-- Create new CHECK constraint with role, category, and unit included
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
