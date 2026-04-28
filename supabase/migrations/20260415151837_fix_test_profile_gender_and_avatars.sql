/*
  # Fix test profile gender and avatar mismatches

  ## Summary
  Several test profiles had incorrect gender values and therefore wrong avatar photos
  (e.g. female names with male photos and gender='male').

  This migration:
  1. Corrects the gender field for all test profiles based on the Danish name in the username
  2. Re-assigns avatar_url so female names get female portrait photos and male names get male portrait photos

  ## Danish name classification used:
  - Female names: anna, anne, åse, astrid, birgit, britta, camilla, cecilie, christina, diana,
    dorthe, emilie, emma, freja, frida, gitte, hanna, helle, ida, inge, isabel, jette, josefine,
    julie, karen, katrine, kirsten, klara, laura, line, lone, lotte, louise, luna, maja, maria,
    marianne, marie, mette, mia, nanna, nina, nora, olivia, pernille, rikke, runa, sara, signe,
    silje, sofie, stine, susanne, thea, tine, ulla, vibeke, vilde, winnie, ylva
  - Male names: alexander, anders, benjamin, bjarne, christian, daniel, david, emil, erik,
    frederik, gorm, henrik, ivan, jakob, jonas, kasper, lars, lasse, lucas, mads, magnus,
    markus, mathias, mikkel, niels, nikolaj, noah, ole, oliver, patrick, peter, rasmus,
    sebastian, simon, soeren, thomas, tobias, ulrik, victor, william
*/

DO $$
DECLARE
  male_avatars TEXT[] := ARRAY[
    'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/775358/pexels-photo-775358.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3785079/pexels-photo-3785079.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=400'
  ];
  female_avatars TEXT[] := ARRAY[
    'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/2613260/pexels-photo-2613260.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=400'
  ];

  female_first_names TEXT[] := ARRAY[
    'anna','anne','åse','astrid','birgit','britta','camilla','cecilie','christina','diana',
    'dorthe','emilie','emma','freja','frida','gitte','hanna','helle','ida','inge','isabel',
    'jette','josefine','julie','karen','katrine','kirsten','klara','laura','line','lone',
    'lotte','louise','luna','maja','maria','marianne','marie','mette','mia','nanna','nina',
    'nora','olivia','pernille','rikke','runa','sara','signe','silje','sofie','stine',
    'susanne','thea','tine','ulla','vibeke','vilde','winnie','ylva'
  ];

  rec RECORD;
  first_name TEXT;
  correct_gender TEXT;
  avatar_pool TEXT[];
  avatar_idx INT;
  counter INT := 0;
BEGIN
  FOR rec IN
    SELECT id, username FROM dating_profiles WHERE username LIKE 'test_%'
    ORDER BY username
  LOOP
    -- Extract first name from username like 'test_<firstname>_<lastname>_<num>'
    first_name := split_part(rec.username, '_', 2);

    -- Determine correct gender
    IF first_name = ANY(female_first_names) THEN
      correct_gender := 'female';
      avatar_pool := female_avatars;
    ELSE
      correct_gender := 'male';
      avatar_pool := male_avatars;
    END IF;

    -- Rotate through the avatar pool
    avatar_idx := (counter % array_length(avatar_pool, 1)) + 1;

    UPDATE dating_profiles
    SET
      gender = correct_gender,
      avatar_url = avatar_pool[avatar_idx]
    WHERE id = rec.id;

    counter := counter + 1;
  END LOOP;
END $$;
