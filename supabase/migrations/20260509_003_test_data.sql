-- TamirBul — Geliştirme Test Verisi
-- ⚠️ SADECE development ortamında uygula, production'da KULLANMA

-- Test tamircisi (mechanic kaydedildikten sonra UUID güncelle)
-- INSERT INTO repair_shops (owner_id, name, address, city, lat, lng, is_verified)
-- VALUES (
--   'MECHANIC_USER_UUID',
--   'Ahmet Usta Oto Tamir',
--   'Kadıköy, İstanbul',
--   'İstanbul',
--   40.9901,
--   29.0288,
--   true
-- );

-- Test kategorileri (shop_id güncelle)
-- INSERT INTO shop_categories (shop_id, category) VALUES
--   ('SHOP_UUID', 'motor'),
--   ('SHOP_UUID', 'elektrik'),
--   ('SHOP_UUID', 'periyodik');

-- Not: Gerçek test verisi Sprint 1 auth tamamlanınca eklenecek
SELECT 'Test data migration — Sprint 1 sonrası doldurulacak' as info;
