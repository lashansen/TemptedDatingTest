/*
  # News Posts and Events

  ## Summary
  Two new tables to power the home page content feed:
  - `news_posts` – admin-authored news articles shown in the news section
  - `events` – upcoming events (online or in-person) shown in the events section

  ## New Tables

  ### news_posts
  - `id` (uuid, pk)
  - `title` (text) – headline
  - `body` (text) – article body / teaser text
  - `image_url` (text, nullable) – optional cover image
  - `author_id` (uuid, nullable) – references dating_profiles
  - `is_published` (boolean, default true)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### events
  - `id` (uuid, pk)
  - `title` (text)
  - `description` (text)
  - `event_date` (timestamptz) – when the event takes place
  - `location` (text, nullable) – physical location or "Online"
  - `image_url` (text, nullable)
  - `is_published` (boolean, default true)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Published records are readable by all authenticated users
  - Only admins (via admin_users) can insert/update/delete — enforced by checking admin_users table
*/

-- News posts
CREATE TABLE IF NOT EXISTS news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  image_url text,
  author_id uuid REFERENCES dating_profiles(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read published news"
  ON news_posts FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can insert news"
  ON news_posts FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE profile_id = auth.uid()));

CREATE POLICY "Admins can update news"
  ON news_posts FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE profile_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE profile_id = auth.uid()));

CREATE POLICY "Admins can delete news"
  ON news_posts FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE profile_id = auth.uid()));

-- Events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  event_date timestamptz NOT NULL,
  location text,
  image_url text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read published events"
  ON events FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE profile_id = auth.uid()));

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE profile_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE profile_id = auth.uid()));

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE profile_id = auth.uid()));

-- Seed sample news posts
INSERT INTO news_posts (title, body, is_published) VALUES
(
  'Velkommen til Heartline!',
  'Vi er glade for at byde dig velkommen til Heartline – Danmarks nye mødested for singler og par. Her kan du oprette din profil, søge efter ligesindede og sende beskeder. Vi håber du finder det du søger!',
  true
),
(
  'Ny funktion: Grupperum',
  'Vi har nu lanceret grupperum, hvor du kan deltage i fælles samtaler med andre medlemmer. Find et rum der passer til dine interesser, eller opret dit eget. Vi glæder os til at se dig der!',
  true
),
(
  'Tips til en god profil',
  'En god profil med et klart billede og en personlig beskrivelse får langt flere henvendelser. Husk at udfylde "Om mig" og "Hvad søger jeg" – det giver andre et godt indtryk af dig.',
  true
)
ON CONFLICT DO NOTHING;

-- Seed sample upcoming events
INSERT INTO events (title, description, event_date, location, is_published) VALUES
(
  'Online Speed Dating – Maj 2026',
  'Mød 10 nye mennesker på 30 minutter! Vi afholder vores månedlige online speed dating event. Tilmelding er gratis for premium-medlemmer.',
  '2026-05-10 19:00:00+02',
  'Online (Zoom)',
  true
),
(
  'Heartline Sommerfest – København',
  'Kom og mød andre Heartline-medlemmer til en hyggelig sommerfest i København. Der vil være musik, mad og masser af muligheder for at lære nye mennesker at kende.',
  '2026-06-21 15:00:00+02',
  'København, Danmark',
  true
),
(
  'Workshop: Sådan skriver du den perfekte besked',
  'Bliv klogere på hvordan du bryder isen og skriver beskeder der faktisk får svar. Online workshop med vores dating-ekspert.',
  '2026-05-28 20:00:00+02',
  'Online (Google Meet)',
  true
)
ON CONFLICT DO NOTHING;
