-- Fix old activity logs where super admin user appears as "بەکارهێنەری نەناسراو"
-- This updates the user_name to "سوپەر ئادمین" for the super admin user ID

UPDATE activity_logs
SET user_name = 'سوپەر ئادمین'
WHERE user_id = '37a2d8ea-0940-4c23-8d7a-a5347ebe45ff'
AND user_name = 'بەکارهێنەری نەناسراو';

-- Verify the update
SELECT id, user_id, user_name, action, details, created_at
FROM activity_logs
WHERE user_id = '37a2d8ea-0940-4c23-8d7a-a5347ebe45ff'
ORDER BY created_at DESC
LIMIT 10;
