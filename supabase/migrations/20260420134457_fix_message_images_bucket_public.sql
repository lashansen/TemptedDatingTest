/*
  # Fix message-images storage bucket visibility

  1. Changes
    - Set `message-images` bucket to public so uploaded image URLs are accessible
    - Add SELECT policy so anyone can view message images

  2. Notes
    - The bucket existed but was private, causing image URLs to return 403/404
    - Upload and delete policies remain restricted to authenticated owners
*/

UPDATE storage.buckets
SET public = true
WHERE id = 'message-images';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Anyone can view message images'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Anyone can view message images"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'message-images')
    $policy$;
  END IF;
END $$;
