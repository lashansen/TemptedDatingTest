
/*
  # Dating Site Tables

  ## New Tables
  1. `dating_profiles` - Dating profiles (single or couple) with all personal attributes
  2. `dating_photos` - Photos uploaded to profiles
  3. `dating_photo_likes` - Likes on individual photos
  4. `dating_photo_comments` - Comments on photos
  5. `dating_conversations` - Chat conversations between profiles
  6. `dating_messages` - Individual messages within conversations
  7. `dating_profile_visits` - Tracks who visited whose profile
*/

CREATE TABLE IF NOT EXISTS dating_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  profile_type text NOT NULL DEFAULT 'single' CHECK (profile_type IN ('single', 'couple')),
  display_name text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  looking_for text DEFAULT '',
  age integer,
  eye_color text DEFAULT '',
  height_cm integer,
  weight_kg integer,
  has_tattoos boolean DEFAULT false,
  is_smoker boolean DEFAULT false,
  has_disability boolean DEFAULT false,
  disability_description text DEFAULT '',
  gender text DEFAULT '',
  living_area text DEFAULT '',
  sexuality text DEFAULT '',
  marital_status text DEFAULT '',
  avatar_url text DEFAULT '',
  avatar_url_2 text DEFAULT '',
  couple_member_2_name text DEFAULT '',
  last_visitor_check timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dating_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dating profiles are viewable by authenticated users"
  ON dating_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own dating profile"
  ON dating_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own dating profile"
  ON dating_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS dating_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  caption text DEFAULT '',
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dating_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dating photos viewable by authenticated users"
  ON dating_photos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own dating photos"
  ON dating_photos FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own dating photos"
  ON dating_photos FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete own dating photos"
  ON dating_photos FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE TABLE IF NOT EXISTS dating_photo_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES dating_photos(id) ON DELETE CASCADE,
  liker_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(photo_id, liker_id)
);

ALTER TABLE dating_photo_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photo likes viewable by authenticated users"
  ON dating_photo_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own photo likes"
  ON dating_photo_likes FOR INSERT
  TO authenticated
  WITH CHECK (liker_id = auth.uid());

CREATE POLICY "Users can delete own photo likes"
  ON dating_photo_likes FOR DELETE
  TO authenticated
  USING (liker_id = auth.uid());

CREATE TABLE IF NOT EXISTS dating_photo_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES dating_photos(id) ON DELETE CASCADE,
  commenter_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dating_photo_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photo comments viewable by authenticated users"
  ON dating_photo_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own photo comments"
  ON dating_photo_comments FOR INSERT
  TO authenticated
  WITH CHECK (commenter_id = auth.uid());

CREATE POLICY "Users can delete own photo comments"
  ON dating_photo_comments FOR DELETE
  TO authenticated
  USING (commenter_id = auth.uid());

CREATE TABLE IF NOT EXISTS dating_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  participant_2 uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

ALTER TABLE dating_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversations viewable by participants"
  ON dating_conversations FOR SELECT
  TO authenticated
  USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

CREATE POLICY "Users can create dating conversations"
  ON dating_conversations FOR INSERT
  TO authenticated
  WITH CHECK (participant_1 = auth.uid() OR participant_2 = auth.uid());

CREATE POLICY "Participants can update dating conversations"
  ON dating_conversations FOR UPDATE
  TO authenticated
  USING (participant_1 = auth.uid() OR participant_2 = auth.uid())
  WITH CHECK (participant_1 = auth.uid() OR participant_2 = auth.uid());

CREATE TABLE IF NOT EXISTS dating_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES dating_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dating_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages viewable by conversation participants"
  ON dating_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dating_conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON dating_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM dating_conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON dating_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dating_conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dating_conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE TABLE IF NOT EXISTS dating_profile_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visited_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  visitor_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  visited_at timestamptz DEFAULT now()
);

ALTER TABLE dating_profile_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile owners can see their visits"
  ON dating_profile_visits FOR SELECT
  TO authenticated
  USING (visited_id = auth.uid() OR visitor_id = auth.uid());

CREATE POLICY "Users can record profile visits"
  ON dating_profile_visits FOR INSERT
  TO authenticated
  WITH CHECK (visitor_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_dating_visits_visited_id ON dating_profile_visits(visited_id);
CREATE INDEX IF NOT EXISTS idx_dating_messages_conversation_id ON dating_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dating_photo_likes_photo_id ON dating_photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_dating_photo_comments_photo_id ON dating_photo_comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_dating_photos_profile_id ON dating_photos(profile_id);
