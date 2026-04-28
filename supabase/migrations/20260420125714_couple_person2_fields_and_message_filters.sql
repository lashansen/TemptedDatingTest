/*
  # Couple person 2 fields + message filter preferences

  1. New columns on dating_profiles
     - couple_member_2_age (integer) - Age of second person in couple
     - couple_member_2_height_cm (integer) - Height of second person
     - couple_member_2_weight_kg (integer) - Weight of second person
     - couple_member_2_gender (text) - Gender of second person
     - couple_member_2_eye_color (text) - Eye color of second person

  2. Message filter preferences (block incoming messages from profiles outside criteria)
     - msg_filter_enabled (boolean) - Whether filtering is active
     - msg_filter_min_age (integer) - Minimum sender age
     - msg_filter_max_age (integer) - Maximum sender age
     - msg_filter_genders (text[]) - Allowed sender genders (empty = all)
     - msg_filter_profile_types (text[]) - Allowed profile types: single, couple (empty = all)
     - msg_filter_living_areas (text[]) - Allowed living areas/regions (empty = all)
*/

DO $$
BEGIN
  -- Couple person 2 fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_profiles' AND column_name = 'couple_member_2_age') THEN
    ALTER TABLE dating_profiles ADD COLUMN couple_member_2_age integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_profiles' AND column_name = 'couple_member_2_height_cm') THEN
    ALTER TABLE dating_profiles ADD COLUMN couple_member_2_height_cm integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_profiles' AND column_name = 'couple_member_2_weight_kg') THEN
    ALTER TABLE dating_profiles ADD COLUMN couple_member_2_weight_kg integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_profiles' AND column_name = 'couple_member_2_gender') THEN
    ALTER TABLE dating_profiles ADD COLUMN couple_member_2_gender text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_profiles' AND column_name = 'couple_member_2_eye_color') THEN
    ALTER TABLE dating_profiles ADD COLUMN couple_member_2_eye_color text DEFAULT '';
  END IF;

  -- Message filter fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_profiles' AND column_name = 'msg_filter_enabled') THEN
    ALTER TABLE dating_profiles ADD COLUMN msg_filter_enabled boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_profiles' AND column_name = 'msg_filter_min_age') THEN
    ALTER TABLE dating_profiles ADD COLUMN msg_filter_min_age integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_profiles' AND column_name = 'msg_filter_max_age') THEN
    ALTER TABLE dating_profiles ADD COLUMN msg_filter_max_age integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_profiles' AND column_name = 'msg_filter_genders') THEN
    ALTER TABLE dating_profiles ADD COLUMN msg_filter_genders text[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_profiles' AND column_name = 'msg_filter_profile_types') THEN
    ALTER TABLE dating_profiles ADD COLUMN msg_filter_profile_types text[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dating_profiles' AND column_name = 'msg_filter_living_areas') THEN
    ALTER TABLE dating_profiles ADD COLUMN msg_filter_living_areas text[] DEFAULT '{}';
  END IF;
END $$;
