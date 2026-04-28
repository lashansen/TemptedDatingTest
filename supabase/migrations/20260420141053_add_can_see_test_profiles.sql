/*
  # Add can_see_test_profiles flag to dating_profiles

  ## Summary
  Adds a boolean flag `can_see_test_profiles` to the `dating_profiles` table.

  ## Changes
  ### Modified Tables
  - `dating_profiles`
    - Added `can_see_test_profiles` (boolean, DEFAULT false) - Controls whether a profile can see test profiles in search results

  ## Notes
  - Defaults to false so existing users cannot see test profiles unless explicitly granted by an admin
  - Admins can toggle this per profile in the admin panel
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dating_profiles' AND column_name = 'can_see_test_profiles'
  ) THEN
    ALTER TABLE dating_profiles ADD COLUMN can_see_test_profiles boolean NOT NULL DEFAULT false;
  END IF;
END $$;
