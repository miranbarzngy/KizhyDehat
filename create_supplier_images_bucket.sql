INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-images', 'supplier-images', true);

CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'supplier-images');

CREATE POLICY "Allow public access" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'supplier-images');

CREATE POLICY "Allow owner updates" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'supplier-images');

CREATE POLICY "Allow owner delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'supplier-images');
