/*
  # Fix two security issues

  1. Function Search Path Mutable
     - Set a fixed search_path on `public.is_admin` to prevent search_path injection attacks

  2. Public Bucket Broad SELECT Policy
     - Replace the broad "Authenticated users can view avatars" policy that allows listing
       all files with a restrictive policy that only allows users to read their own avatar files
*/

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE profile_id = uid
  );
$$;

DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;

CREATE POLICY "Users can view own avatar"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
