-- TamirBul — Şema Düzeltmeleri
-- Migration: 005_schema_fixes
-- Tarih: 2026-05-12
-- repair_shops: eksik kolonlar ekle + rating trigger

-- ─── 1. district kolonu ────────────────────────────────────────────────────────
ALTER TABLE repair_shops ADD COLUMN IF NOT EXISTS district TEXT;

-- ─── 2. avg_rating + review_count (denormalize, trigger ile güncel tutulur) ───
ALTER TABLE repair_shops
  ADD COLUMN IF NOT EXISTS avg_rating   NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS review_count INT NOT NULL DEFAULT 0;

-- ─── 3. Mevcut reviews'dan başlangıç değerlerini doldur ───────────────────────
UPDATE repair_shops rs SET
  avg_rating   = sub.avg_r,
  review_count = sub.cnt
FROM (
  SELECT shop_id,
         ROUND(AVG(rating)::numeric, 2) AS avg_r,
         COUNT(*)                        AS cnt
  FROM reviews
  GROUP BY shop_id
) sub
WHERE rs.id = sub.shop_id;

-- ─── 4. Trigger: reviews INSERT/UPDATE/DELETE → shop rating güncelle ───────────
CREATE OR REPLACE FUNCTION update_shop_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  target_shop_id UUID;
BEGIN
  target_shop_id := COALESCE(NEW.shop_id, OLD.shop_id);
  UPDATE repair_shops SET
    avg_rating   = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE shop_id = target_shop_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE shop_id = target_shop_id)
  WHERE id = target_shop_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_update_rating ON reviews;
CREATE TRIGGER trg_reviews_update_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_shop_rating();
