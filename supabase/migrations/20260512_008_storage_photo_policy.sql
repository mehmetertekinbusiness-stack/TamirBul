-- TamirBul — Work-order photos: public bucket + upload policy
-- Migration: 008_storage_photo_policy
-- work-order-photos bucket'ı public yapılıyor (uygulama içi direkt görüntüleme için)
-- ve authenticated kullanıcılara upload izni veriliyor.

UPDATE storage.buckets
SET public = true
WHERE name = 'work-order-photos';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'wo_photos_upload'
  ) THEN
    EXECUTE 'CREATE POLICY "wo_photos_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''work-order-photos'')';
  END IF;
END $$;
