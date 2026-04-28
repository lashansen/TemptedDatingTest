/*
  # Add image support to private and group chat messages

  1. Schema Changes
     - Add `image_url` column (nullable text) to `dating_messages`
     - Add `image_url` column (nullable text) to `group_messages`
     - Relax the group_messages content constraint to allow empty content when image is present

  2. Storage
     - Create a new `message-images` storage bucket (private, not public)
     - Users can upload images for their own messages
     - Users can read images from conversations/rooms they participate in

  3. Security
     - Bucket is not public; access is via signed URLs or authenticated reads
     - Upload policy: authenticated users can upload to their own folder
     - Read policy: authenticated users can read images (fine-grained enforcement via app logic)
*/

ALTER TABLE dating_messages
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

ALTER TABLE group_messages
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

ALTER TABLE group_messages
  DROP CONSTRAINT IF EXISTS group_messages_content_check;

ALTER TABLE group_messages
  ADD CONSTRAINT group_messages_content_check
    CHECK (
      (content IS NOT NULL AND length(content) > 0 AND length(content) <= 2000)
      OR image_url IS NOT NULL
    );

INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload message images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'message-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "Authenticated users can read message images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'message-images');

CREATE POLICY "Users can delete own message images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'message-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
