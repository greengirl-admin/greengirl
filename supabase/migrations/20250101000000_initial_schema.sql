/*
          # [Initial Schema Setup]
          This script sets up the entire initial database schema for the GreenGirl application.
          It creates tables for profiles, projects, activities, materials, and storage configuration.
          It also sets up Row Level Security (RLS) policies to enforce user permissions and a trigger to automatically create user profiles.

          ## Query Description: [This operation is safe to run on a new project. It will create all necessary tables and security policies. It does not delete any existing data, but it lays the foundation for the entire application. No backup is needed if this is a fresh setup.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["High"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Tables Created: profiles, projects, activity_types, activities, materials, storage_config
          - Triggers Created: on_auth_user_created
          - Functions Created: handle_new_user, delete_user_by_id
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Policies are based on 'authenticated' and custom 'super-user' role.]
          
          ## Performance Impact:
          - Indexes: [Primary keys and foreign keys are indexed by default.]
          - Triggers: [A trigger is added to auth.users.]
          - Estimated Impact: [Low impact on a new database.]
          */

-- 1. PROFILES TABLE
-- Stores public user data and roles.
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user'
);

COMMENT ON TABLE public.profiles IS 'Stores public user data and application roles.';

-- 2. RLS FOR PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read all profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Allow super-users to update any profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super-user');

-- 3. TRIGGER TO CREATE PROFILE ON NEW USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', COALESCE(new.raw_user_meta_data->>'role', 'user'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  
-- 4. PROJECTS TABLE
CREATE TABLE public.projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
COMMENT ON TABLE public.projects IS 'List of official GreenGirl projects.';
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to projects" ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow super-users to manage projects" ON public.projects FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super-user');

-- 5. ACTIVITY TYPES TABLE
CREATE TABLE public.activity_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
COMMENT ON TABLE public.activity_types IS 'List of possible activity types.';
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access to activity types" ON public.activity_types FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow super-users to manage activity types" ON public.activity_types FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super-user');

-- 6. ACTIVITIES TABLE
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  project TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  participants INT NOT NULL DEFAULT 0,
  date TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.activities IS 'Records of activities performed by the team.';
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read all activities" ON public.activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow users to insert their own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update/delete their own activities" ON public.activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow super-users to update/delete any activity" ON public.activities FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super-user');

-- 7. MATERIALS TABLE
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  project TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity FLOAT NOT NULL,
  unit TEXT NOT NULL,
  usage TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.materials IS 'Records of materials collected and used.';
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read all materials" ON public.materials FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow users to insert their own materials" ON public.materials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update/delete their own materials" ON public.materials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow super-users to update/delete any material" ON public.materials FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super-user');


-- 8. STORAGE CONFIG TABLE
CREATE TABLE public.storage_config (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL UNIQUE,
    max_capacity FLOAT NOT NULL
);
COMMENT ON TABLE public.storage_config IS 'Stores the maximum storage capacity for each material type.';
ALTER TABLE public.storage_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read access" ON public.storage_config FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow super-users to update capacity" ON public.storage_config FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super-user');

-- 9. SEED INITIAL DATA
INSERT INTO public.projects (name) VALUES
('Produção de Sabão Ecológico'),
('Projeto Patinhas'),
('Mutirão de Limpeza de Praia'),
('Projeto Partilhar'),
('Plantio de Árvores Nativas');

INSERT INTO public.activity_types (name) VALUES
('Oficina'),
('Palestra'),
('Mutirão'),
('Ação Social'),
('Coleta');

INSERT INTO public.storage_config (type, max_capacity) VALUES
('Óleo', 1000),
('Secos', 500),
('Orgânicos', 200);

-- 10. FUNCTION TO DELETE USERS (FOR SUPER-USERS)
/*
          # [Create User Deletion Function]
          This function allows a super-user to delete another user from the system.
          This is a destructive action and cannot be undone.

          ## Query Description: [This operation creates a function that can permanently delete users. This is a high-risk operation. The function checks if the caller is a 'super-user' before proceeding. It should only be called from a trusted client environment.]
          
          ## Metadata:
          - Schema-Category: ["Dangerous"]
          - Impact-Level: ["High"]
          - Requires-Backup: [true]
          - Reversible: [false]
          
          ## Structure Details:
          - Functions Created: delete_user_by_id
          
          ## Security Implications:
          - RLS Status: [N/A]
          - Policy Changes: [No]
          - Auth Requirements: [The function checks for 'super-user' role internally.]
          
          ## Performance Impact:
          - Indexes: [N/A]
          - Triggers: [N/A]
          - Estimated Impact: [Low]
          */
CREATE OR REPLACE FUNCTION public.delete_user_by_id(user_id_to_delete UUID)
RETURNS VOID AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Check if the caller is a super-user
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  
  IF caller_role <> 'super-user' THEN
    RAISE EXCEPTION 'Only super-users can delete users.';
  END IF;

  -- Prevent a super-user from deleting themselves
  IF auth.uid() = user_id_to_delete THEN
    RAISE EXCEPTION 'You cannot delete your own account.';
  END IF;

  -- Perform the deletion from the auth.users table
  -- This requires elevated privileges, so SECURITY DEFINER is used.
  -- The function owner must be a role with permission to delete from auth.users, like 'postgres'.
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.delete_user_by_id(UUID) IS 'Allows a super-user to delete another user. DANGEROUS.';

-- Grant execute permission to authenticated users. The internal check will handle authorization.
GRANT EXECUTE ON FUNCTION public.delete_user_by_id(UUID) TO authenticated;
