-- Run this in your Supabase SQL Editor to fix the products fetch error

-- Enable RLS on products table (if not already enabled)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all authenticated users to read products
CREATE POLICY "Allow public read access on products" 
ON public.products 
FOR SELECT 
USING (true);

-- Also allow anonymous access if needed
-- CREATE POLICY "Allow anonymous read access on products" 
-- ON public.products 
-- FOR SELECT 
-- TO anon
-- USING (true);
