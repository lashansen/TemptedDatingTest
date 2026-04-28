/*
  # Grupperum (Group Chat Rooms)

  1. Nye tabeller
    - `group_rooms`
      - `id` (uuid, primary key)
      - `name` (text) - rummets navn
      - `description` (text) - kort beskrivelse
      - `created_by` (uuid) - hvem oprettede rummet
      - `created_at` (timestamptz)
      - `last_message_at` (timestamptz) - bruges til sortering
      - `is_active` (boolean) - om rummet er aktivt

    - `group_room_members`
      - `id` (uuid, primary key)
      - `room_id` (uuid) - reference til group_rooms
      - `profile_id` (uuid) - reference til dating_profiles
      - `joined_at` (timestamptz)

    - `group_messages`
      - `id` (uuid, primary key)
      - `room_id` (uuid) - reference til group_rooms
      - `sender_id` (uuid) - reference til dating_profiles
      - `content` (text)
      - `created_at` (timestamptz)

  2. Sikkerhed
    - RLS aktiveret på alle tre tabeller
    - Autentificerede brugere kan se alle aktive rum
    - Kun deltagere kan sende beskeder i rum de er med i
    - Medlemmer kan forlade et rum (slette sig selv)

  3. Seed data
    - 5 foruddefinerede chatrum med forskellige temaer
*/

CREATE TABLE IF NOT EXISTS group_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS group_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES group_rooms(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, profile_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES group_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_room_members_room_id ON group_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_group_room_members_profile_id ON group_room_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_room_id ON group_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);

ALTER TABLE group_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active rooms"
  ON group_rooms FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can create rooms"
  ON group_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can view room memberships"
  ON group_room_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can join rooms"
  ON group_room_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dating_profiles
      WHERE id = profile_id AND id = auth.uid()
    )
  );

CREATE POLICY "Members can leave rooms"
  ON group_room_members FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Members can view messages in rooms they joined"
  ON group_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_room_members
      WHERE room_id = group_messages.room_id
      AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages in rooms they joined"
  ON group_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_room_members
      WHERE room_id = group_messages.room_id
      AND profile_id = auth.uid()
    )
  );

INSERT INTO group_rooms (name, description, created_by, last_message_at) VALUES
  ('Generel snak', 'Et sted til løs snak og at møde nye mennesker', NULL, now()),
  ('Single og sogende', 'For singler der aktivt leder efter en partner', NULL, now() - interval '5 minutes'),
  ('Par og nysgerrige', 'For par og dem der er nysgerrige pa parforhold', NULL, now() - interval '12 minutes'),
  ('50+ moden dating', 'Et rum dedikeret til dem over 50 ar', NULL, now() - interval '1 hour'),
  ('Weekendplaner', 'Find nogen at tilbringe weekenden med', NULL, now() - interval '3 hours')
ON CONFLICT DO NOTHING;
