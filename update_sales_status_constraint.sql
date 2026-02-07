-- Update the sales status check constraint to allow 'cancelled' status
-- Run this in Supabase SQL Editor
-- First, drop the existing constraint to allow data updates
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_check;
-- Then update any existing records with invalid status to 'delivered'
UPDATE sales
SET status = 'delivered'
WHERE status IS NULL
    OR status NOT IN (
        'delivered',
        'cancelled',
        'refunded',
        'pending',
        'completed'
    );
-- Finally, add the updated constraint with 'cancelled' as a valid status
ALTER TABLE sales
ADD CONSTRAINT sales_status_check CHECK (
        status IN (
            'delivered',
            'cancelled',
            'refunded',
            'pending',
            'completed'
        )
    );