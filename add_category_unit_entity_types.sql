-- Add category and unit as valid entity_types for activity_logs
-- Run this in Supabase SQL Editor

-- First, check if there's a CHECK constraint on entity_type
-- If there is, we need to drop it and recreate with the new values

-- Option 1: Drop existing CHECK constraint if it exists
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_entity_type_check;

-- Option 2: Add the new values to the CHECK constraint
-- This will add a new check constraint that allows both old and new values
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
