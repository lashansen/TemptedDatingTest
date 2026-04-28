/*
  # Insert 100 test dating profiles

  Creates 100 test profiles with common Danish names.
  - Inserts fake auth.users rows so the FK constraint is satisfied
  - Each profile bio starts with "test profile!"
  - Mix of genders, ages, locations, and profile attributes
  - Uses gen_random_uuid() for IDs
*/

DO $$
DECLARE
  names TEXT[] := ARRAY[
    'Anders Nielsen','Bjarne Pedersen','Christian Hansen','David Jensen','Erik Andersen',
    'Frederik Christensen','Gorm Larsen','Henrik Rasmussen','Ivan Sørensen','Jakob Petersen',
    'Kasper Madsen','Lars Olsen','Mads Poulsen','Niels Henriksen','Ole Jacobsen',
    'Peter Thomsen','Rasmus Møller','Simon Christoffersen','Thomas Frederiksen','Ulrik Jørgensen',
    'Victor Clausen','William Lund','Søren Knudsen','Mikkel Eriksen','Jonas Dahl',
    'Anna Nielsen','Britta Pedersen','Camilla Hansen','Diana Jensen','Emma Andersen',
    'Freja Christensen','Gitte Larsen','Helle Rasmussen','Ida Sørensen','Julie Petersen',
    'Karen Madsen','Laura Olsen','Maria Poulsen','Nina Henriksen','Olivia Jacobsen',
    'Pernille Thomsen','Rikke Møller','Sara Christoffersen','Tine Frederiksen','Ulla Jørgensen',
    'Vibeke Clausen','Winnie Lund','Åse Knudsen','Maja Eriksen','Sofie Dahl',
    'Mette Nielsen','Lotte Pedersen','Kirsten Hansen','Birgit Jensen','Susanne Andersen',
    'Dorthe Christensen','Inge Larsen','Lone Rasmussen','Marianne Sørensen','Jette Petersen',
    'Magnus Nielsen','Emil Pedersen','Nikolaj Hansen','Alexander Jensen','Sebastian Andersen',
    'Mathias Christensen','Oliver Larsen','Noah Rasmussen','Lucas Sørensen','Tobias Petersen',
    'Lasse Madsen','Markus Olsen','Daniel Poulsen','Benjamin Henriksen','Patrick Jacobsen',
    'Katrine Thomsen','Stine Møller','Line Christoffersen','Anne Frederiksen','Marie Jørgensen',
    'Louise Clausen','Christina Lund','Mia Knudsen','Nanna Eriksen','Signe Dahl',
    'Astrid Nielsen','Cecilie Pedersen','Emilie Hansen','Frida Jensen','Hanna Andersen',
    'Isabel Christensen','Josefine Larsen','Klara Rasmussen','Luna Sørensen','Nora Petersen',
    'Runa Madsen','Silje Olsen','Thea Poulsen','Vilde Henriksen','Ylva Jacobsen'
  ];
  genders TEXT[] := ARRAY['male','male','male','male','male','female','female','female','female','female'];
  areas TEXT[] := ARRAY['København','Aarhus','Odense','Aalborg','Esbjerg','Randers','Kolding','Horsens','Vejle','Roskilde','Helsingør','Næstved','Fredericia','Viborg','Silkeborg'];
  sexualities TEXT[] := ARRAY['heterosexual','heterosexual','heterosexual','bisexual','homosexual'];
  looking_for_opts TEXT[] := ARRAY['Leder efter noget seriøst','Åben for muligheder','Søger en venlig sjæl at dele livet med','Leder efter min bedste ven og kæreste','Vil gerne møde nye mennesker'];
  eye_colors TEXT[] := ARRAY['blue','brown','green','hazel','gray'];
  uid UUID;
  uname TEXT;
  dname TEXT;
  parts TEXT[];
  i INT;
BEGIN
  FOR i IN 1..100 LOOP
    uid := gen_random_uuid();
    parts := string_to_array(names[i], ' ');
    dname := names[i];
    uname := 'test_' || lower(replace(replace(replace(names[i], ' ', '_'), 'ø', 'oe'), 'å', 'aa')) || '_' || i;

    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, aud, role
    ) VALUES (
      uid,
      uname || '@test.example.com',
      '$2a$10$placeholder_hash_not_real',
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now() - (random() * interval '365 days'),
      now(),
      'authenticated',
      'authenticated'
    );

    INSERT INTO dating_profiles (
      id, username, profile_type, display_name, bio, looking_for,
      age, eye_color, height_cm, weight_kg,
      has_tattoos, is_smoker, has_disability,
      gender, living_area, sexuality, marital_status,
      avatar_url, created_at, updated_at
    ) VALUES (
      uid,
      uname,
      'single',
      dname,
      'test profile! ' || (ARRAY[
        'Jeg er en glad og positiv person der elsker livet.',
        'Naturelsker med passion for madlavning og musik.',
        'Sportsentusiast der nyder gode samtaler.',
        'Kreativ sjæl med sans for humor og eventyr.',
        'Rolig og omtænksom person med stor kærlighed til dyr.',
        'Rejselysten og nysgerrig på verden og dens mennesker.',
        'Filmelsker og bogormet med hang til hyggelige aftener.',
        'Aktiv person der elsker cykling, løb og friluftsliv.',
        'Madelsker og vinentusiast. Altid klar til en god middag.',
        'Musician og kunstner med sjæl og kreativitet.'
      ])[floor(random()*10+1)::int],
      looking_for_opts[floor(random()*5+1)::int],
      18 + floor(random() * 42)::int,
      eye_colors[floor(random()*5+1)::int],
      155 + floor(random() * 45)::int,
      50 + floor(random() * 60)::int,
      random() > 0.7,
      random() > 0.8,
      false,
      CASE WHEN i <= 50 THEN 'male' ELSE 'female' END,
      areas[floor(random()*15+1)::int],
      sexualities[floor(random()*5+1)::int],
      (ARRAY['single','divorced','widowed'])[floor(random()*3+1)::int],
      '',
      now() - (random() * interval '180 days'),
      now()
    );
  END LOOP;
END $$;
