/*
  # Update test profiles with avatar photos and gallery images

  1. Changes
    - Updates avatar_url on all test profiles (those whose bio starts with 'test profile!')
      using real Pexels photo URLs, alternating between male and female portrait photos
    - Inserts 4 gallery photos per test profile into the dating_photos table
      using a variety of lifestyle/portrait Pexels images

  2. Notes
    - Male profiles (gender = 'male') get male portrait avatars
    - Female profiles (gender = 'female') get female portrait avatars
    - Gallery photos are lifestyle images appropriate for a dating site
    - All photo URLs are publicly accessible Pexels images
*/

DO $$
DECLARE
  male_avatars TEXT[] := ARRAY[
    'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/775358/pexels-photo-775358.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=400'
  ];
  female_avatars TEXT[] := ARRAY[
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/2613260/pexels-photo-2613260.jpeg?auto=compress&cs=tinysrgb&w=400'
  ];
  gallery_photos TEXT[] := ARRAY[
    'https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/2253879/pexels-photo-2253879.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3768894/pexels-photo-3768894.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/1630588/pexels-photo-1630588.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/1559825/pexels-photo-1559825.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3621234/pexels-photo-3621234.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3622622/pexels-photo-3622622.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3622614/pexels-photo-3622614.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3622590/pexels-photo-3622590.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3622607/pexels-photo-3622607.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/3622619/pexels-photo-3622619.jpeg?auto=compress&cs=tinysrgb&w=600'
  ];
  rec RECORD;
  idx INT := 0;
  photo_base INT;
BEGIN
  FOR rec IN
    SELECT id, gender FROM dating_profiles
    WHERE bio ILIKE 'test profile!%'
    ORDER BY created_at
  LOOP
    idx := idx + 1;

    IF rec.gender = 'male' THEN
      UPDATE dating_profiles
      SET avatar_url = male_avatars[((idx - 1) % array_length(male_avatars, 1)) + 1]
      WHERE id = rec.id;
    ELSE
      UPDATE dating_profiles
      SET avatar_url = female_avatars[((idx - 1) % array_length(female_avatars, 1)) + 1]
      WHERE id = rec.id;
    END IF;

    photo_base := ((idx - 1) % (array_length(gallery_photos, 1) - 3));

    INSERT INTO dating_photos (id, profile_id, photo_url, caption, is_primary, created_at)
    VALUES
      (gen_random_uuid(), rec.id, gallery_photos[photo_base + 1], '', false, now()),
      (gen_random_uuid(), rec.id, gallery_photos[photo_base + 2], '', false, now()),
      (gen_random_uuid(), rec.id, gallery_photos[photo_base + 3], '', false, now()),
      (gen_random_uuid(), rec.id, gallery_photos[photo_base + 4], '', false, now());

  END LOOP;
END $$;
