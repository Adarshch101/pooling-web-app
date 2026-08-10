-- Drop the problematic trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Alternative: Handle user role assignment via application logic
-- This avoids the RLS conflict with triggers
