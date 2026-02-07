-- Migration: Add supplier_image column to suppliers table
-- Run this to add supplier image support

ALTER TABLE suppliers ADD COLUMN supplier_image TEXT;

-- Add comment
COMMENT ON COLUMN suppliers.supplier_image IS 'URL or path to supplier profile image';
