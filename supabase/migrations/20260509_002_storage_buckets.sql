-- TamirBul — Storage Buckets
-- Migration: 002_storage_buckets

-- Shop fotoğrafları (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-photos',
  'shop-photos',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- İş emri / DVI fotoğrafları (private — sadece ilgili taraflar görür)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'work-order-photos',
  'work-order-photos',
  false,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ─── Storage RLS ──────────────────────────────────────────────────────────────

-- shop-photos: herkes okuyabilir, sadece dükkan sahibi yükleyebilir
CREATE POLICY "shop_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'shop-photos');

CREATE POLICY "shop_photos_owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'shop-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM repair_shops
      WHERE owner_id IN (
        SELECT id FROM users
        WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
      )
    )
  );

-- work-order-photos: sadece iş emrindeki müşteri ve tamirci erişebilir
CREATE POLICY "wo_photos_related_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'work-order-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM work_orders
      WHERE
        customer_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub')
        OR shop_id IN (
          SELECT id FROM repair_shops WHERE owner_id IN (
            SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
          )
        )
    )
  );

CREATE POLICY "wo_photos_mechanic_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'work-order-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM work_orders
      WHERE shop_id IN (
        SELECT id FROM repair_shops WHERE owner_id IN (
          SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
        )
      )
    )
  );
