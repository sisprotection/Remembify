
DROP POLICY IF EXISTS "alert sounds public read" ON storage.objects;
CREATE POLICY "alert sounds own read" ON storage.objects FOR SELECT
  USING (bucket_id = 'alert-sounds' AND auth.uid()::text = (storage.foldername(name))[1]);
UPDATE storage.buckets SET public = false WHERE id = 'alert-sounds';
