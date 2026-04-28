/*
  # Saved Searches

  ## Summary
  Adds a `saved_searches` table so users can save named filter presets
  and reload them instantly from the search page.

  ## New Tables

  ### saved_searches
  - `id` (uuid, pk)
  - `profile_id` (uuid) - the profile that owns this saved search
  - `name` (text) - user-chosen label, max 50 chars
  - `filters` (jsonb) - serialised Filters object
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled; only the owning profile can read / insert / delete their own searches
*/

CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES dating_profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 50),
  filters jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved searches"
  ON saved_searches FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own saved searches"
  ON saved_searches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);
