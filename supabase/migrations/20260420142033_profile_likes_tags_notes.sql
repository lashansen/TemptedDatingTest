/*
  # Profile Likes, Tags, and Notes

  ## Summary
  Adds three new tables to support profile-level social features:
  1. Profile likes - public, visible to the receiving profile
  2. Profile tags - private labels a user attaches to another profile
  3. Profile notes - private free-text notes a user writes about another profile

  ## New Tables

  ### profile_likes
  - `id` (uuid, pk) - unique like record
  - `liker_id` (uuid) - the profile who liked
  - `liked_id` (uuid) - the profile being liked
  - `created_at` (timestamptz) - when the like was given
  - Unique constraint on (liker_id, liked_id) to prevent duplicate likes

  ### profile_tags
  - `id` (uuid, pk)
  - `tagger_id` (uuid) - the profile creating the tag
  - `tagged_id` (uuid) - the profile being tagged
  - `tag` (text) - the tag label
  - `created_at` (timestamptz)
  - Unique constraint on (tagger_id, tagged_id, tag) to prevent duplicates

  ### profile_notes
  - `id` (uuid, pk)
  - `author_id` (uuid) - the profile writing the note
  - `subject_id` (uuid) - the profile the note is about
  - `content` (text) - the note text
  - `created_at` / `updated_at` (timestamptz)
  - Unique constraint on (author_id, subject_id) - one note per pair

  ## Security
  - RLS enabled on all three tables
  - profile_likes: anyone authenticated can read (needed to show like counts), only liker can insert/delete own likes
  - profile_tags: only tagger can read/insert/delete their own tags (fully private)
  - profile_notes: only author can read/insert/update/delete their own notes (fully private)
*/

-- Profile likes
CREATE TABLE IF NOT EXISTS profile_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  liked_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (liker_id, liked_id)
);

ALTER TABLE profile_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all likes"
  ON profile_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON profile_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = liker_id);

CREATE POLICY "Users can delete own likes"
  ON profile_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = liker_id);

-- Profile tags (private)
CREATE TABLE IF NOT EXISTS profile_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tagger_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  tagged_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  tag text NOT NULL CHECK (char_length(tag) > 0 AND char_length(tag) <= 30),
  created_at timestamptz DEFAULT now(),
  UNIQUE (tagger_id, tagged_id, tag)
);

ALTER TABLE profile_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tags"
  ON profile_tags FOR SELECT
  TO authenticated
  USING (auth.uid() = tagger_id);

CREATE POLICY "Users can insert own tags"
  ON profile_tags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tagger_id);

CREATE POLICY "Users can delete own tags"
  ON profile_tags FOR DELETE
  TO authenticated
  USING (auth.uid() = tagger_id);

-- Profile notes (private)
CREATE TABLE IF NOT EXISTS profile_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (author_id, subject_id)
);

ALTER TABLE profile_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notes"
  ON profile_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can insert own notes"
  ON profile_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own notes"
  ON profile_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own notes"
  ON profile_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);
