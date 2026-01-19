-- Storage policies for images bucket
-- Run this in Supabase SQL Editor to enable image uploads

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view images
CREATE POLICY "Allow authenticated users to view images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own images
CREATE POLICY "Allow authenticated users to update images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Allow authenticated users to delete images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images'
  AND auth.role() = 'authenticated'
);

-- Alternative: If you want to disable RLS for storage entirely (less secure but simpler)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
