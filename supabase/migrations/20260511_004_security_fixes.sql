-- TamirBul — Güvenlik Düzeltmeleri
-- Migration: 004_security_fixes
-- Tarih: 2026-05-11
-- Kaynak: security-review + plan-eng-review bulguları

-- ─── Fix 1: wou_mechanic_insert — iş emri sahipliği doğrulaması ──────────────
-- Eski policy sadece updated_by'ı kontrol ediyordu.
-- Herhangi bir tamirci, başkasının dükkanına ait iş emirlerine güncelleme ekleyebilirdi.
DROP POLICY IF EXISTS "wou_mechanic_insert" ON work_order_updates;

CREATE POLICY "wou_mechanic_insert" ON work_order_updates FOR INSERT
  WITH CHECK (
    -- Güncelleyen kullanıcı kendisi olmalı
    updated_by IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub')
    AND
    -- İş emri, bu tamircinin dükkanına ait olmalı
    work_order_id IN (
      SELECT wo.id FROM work_orders wo
      JOIN repair_shops rs ON rs.id = wo.shop_id
      JOIN users u ON u.id = rs.owner_id
      WHERE u.clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  );

-- ─── Fix 2: shop_categories ALL policy — explicit operasyon ayrımı ────────────
-- ALL policy WITH CHECK olmadan UPDATE/DELETE'e de izin veriyordu.
DROP POLICY IF EXISTS "shop_cats_owner_write" ON shop_categories;

CREATE POLICY "shop_cats_owner_insert" ON shop_categories FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT id FROM repair_shops WHERE owner_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
      )
    )
  );

CREATE POLICY "shop_cats_owner_delete" ON shop_categories FOR DELETE
  USING (
    shop_id IN (
      SELECT id FROM repair_shops WHERE owner_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
      )
    )
  );

-- ─── Fix 3: suppliers ALL policy — explicit operasyon ayrımı ─────────────────
DROP POLICY IF EXISTS "suppliers_owner_all" ON suppliers;

CREATE POLICY "suppliers_owner_select" ON suppliers FOR SELECT
  USING (
    shop_id IN (
      SELECT id FROM repair_shops WHERE owner_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
      )
    )
  );

CREATE POLICY "suppliers_owner_insert" ON suppliers FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT id FROM repair_shops WHERE owner_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
      )
    )
  );

CREATE POLICY "suppliers_owner_update" ON suppliers FOR UPDATE
  USING (
    shop_id IN (
      SELECT id FROM repair_shops WHERE owner_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
      )
    )
  );

CREATE POLICY "suppliers_owner_delete" ON suppliers FOR DELETE
  USING (
    shop_id IN (
      SELECT id FROM repair_shops WHERE owner_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
      )
    )
  );
