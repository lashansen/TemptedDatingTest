/*
  # Fix infinite recursion in admin_users RLS policies

  The existing SELECT policy on admin_users queries admin_users itself, causing
  infinite recursion whenever any dating_profiles policy checks admin status.

  Fix: Create a SECURITY DEFINER function that bypasses RLS to check admin status,
  then rewrite all admin_users policies to use this function instead of self-referencing.
*/

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE profile_id = uid
  );
$$;

DROP POLICY IF EXISTS "Admins can view admin list" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can delete admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can update any dating profile" ON dating_profiles;

CREATE POLICY "Admins can view admin list"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert admin users"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete admin users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update any dating profile"
  ON dating_profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
