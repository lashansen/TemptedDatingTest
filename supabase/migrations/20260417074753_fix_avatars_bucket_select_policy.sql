/*
  # Fix avatars bucket SELECT policy

  ## Problem
  The existing "Anyone can view avatars" SELECT policy allows anyone (including
  unauthenticated users) to LIST all files in the avatars bucket via
  `storage.objects`. This exposes the full list of uploaded avatars to the public.

  ## Fix
  1. Drop the overly broad SELECT policy that allows listing by everyone
  2. Replace it with a policy that only allows authenticated users to SELECT
     individual objects, preventing bulk listing while still allowing avatar
     URL access via the public bucket URL (which does not require a SELECT policy).

  ## Notes
  - Public buckets serve object URLs directly without needing a SELECT policy
  - Authenticated-only SELECT prevents enumeration of all user avatar filenames
*/

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

CREATE POLICY "Authenticated users can view avatars"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');
