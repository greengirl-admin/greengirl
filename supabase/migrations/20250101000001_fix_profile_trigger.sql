/*
          # [Operation Name]
          Fix and Recreate User Profile Trigger

          [Description of what this operation does]
          This script drops the old, non-functioning trigger and its associated function,
          and creates a new, corrected function and trigger. The new trigger ensures that
          a profile is automatically created in the `public.perfis` table whenever a new user
          is added to the `auth.users` table.

          ## Query Description: [This operation corrects a critical bug where user profiles were not being created upon sign-up, preventing logins. It ensures data consistency between the authentication system and the application's user profiles. It is safe to run and does not affect existing data, but it is crucial for new user registration to work correctly.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Medium"
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Drops trigger `on_auth_user_created` on `auth.users`.
          - Drops function `public.handle_new_user()`.
          - Creates a new function `public.handle_new_user()` that correctly inserts data into `public.perfis`.
          - Creates a new trigger `on_auth_user_created` that fires after an insert on `auth.users`.
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: No
          - Auth Requirements: The trigger operates under the security context of the user performing the sign-up.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: Replaces 1 trigger
          - Estimated Impact: Negligible. This is a lightweight, essential operation for user creation.
          */

-- 1. Drop the old trigger and function if they exist, to avoid conflicts.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the new function to handle profile creation.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfis (id, nome, role, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'nome',
    new.raw_user_meta_data->>'role',
    new.email
  );
  RETURN new;
END;
$$;

-- 3. Create the trigger to call the function after a new user is created.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
