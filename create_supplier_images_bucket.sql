-- SQL to create Supabase Storage bucket for supplier images
-- Run this in Supabase SQL Editor

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-images', 'supplier-images', true);

-- Enable public access policies
-- Policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'supplier-images' AND
    (stored_file.name LIKE '%.jpg' OR 
     stored_file.name LIKE '%.jpeg' OR 
     stored_file.name LIKE '%.png' OR 
     stored_file.name LIKE '%.gif' OR 
     stored_file.name LIKE '%.webp')
  );

-- Policy to allow anyone to view images
CREATE POLICY "Allow public access" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'supplier-images');

-- Policy to allow authenticated users to update images
CREATE POLICY "Allow owner updates" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'supplier-images' AND
    (storage.foldername(name) = 'images' OR storage.foldername(name) = '')
  );

-- Policy to allow authenticated users to delete images
CREATE POLICY "Allow owner delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'supplier-images' AND
    (storage.foldername(name) = 'images' OR storage.foldername(name) = '')
  );
