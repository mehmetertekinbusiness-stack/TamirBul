-- TamirBul — Enum Genişletme
-- Migration: 006_status_extend
-- Tarih: 2026-05-12
-- UYARI: ALTER TYPE ADD VALUE transaction dışında çalıştırılmalı.
--        Supabase Dashboard SQL Editor'de ayrı çalıştır veya
--        apply_migration.js BEGIN/COMMIT olmadan çağır.

-- Tamirci reddetme akışı için 'cancelled' durumu ekleniyor.
ALTER TYPE work_order_status_enum ADD VALUE IF NOT EXISTS 'cancelled';

-- WORK_ORDER_STATUSES sabitine de eklendi (lib/constants.tsx güncellendi).
