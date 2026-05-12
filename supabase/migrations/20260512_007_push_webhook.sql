-- TamirBul — Push Notification Webhook Trigger
-- Migration: 007_push_webhook
-- Tarih: 2026-05-12
-- work_orders.status değişince notify-status-change Edge Function'ı çağırır.
-- ÖN KOŞUL: Supabase Dashboard → Database → Webhooks bölümünden
--   "notify-status-change" adında bir webhook eklenmiş olmalı.
--   URL: https://dlfblfzcjtaqjbbdnosi.supabase.co/functions/v1/notify-status-change
--   Tablo: work_orders | Event: UPDATE | Filter: status

-- Alternatif: pg_net ile doğrudan DB trigger (pg_net extension gerektirir)

-- pg_net aktif mi kontrol et
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RAISE NOTICE 'pg_net extension bulunamadı. Webhook trigger pas geçildi.';
    RAISE NOTICE 'Supabase Dashboard → Database → Webhooks üzerinden manuel webhook ekle.';
    RETURN;
  END IF;
END;
$$;

-- pg_net varsa trigger fonksiyonu oluştur
CREATE OR REPLACE FUNCTION notify_work_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  function_url TEXT;
  service_key  TEXT;
BEGIN
  -- Status değişmediyse işlem yapma
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  function_url := current_setting('app.supabase_url', true) || '/functions/v1/notify-status-change';
  service_key  := current_setting('app.service_role_key', true);

  -- pg_net ile async HTTP POST
  IF function_url IS NOT NULL AND function_url != '/functions/v1/notify-status-change' THEN
    PERFORM net.http_post(
      url     := function_url,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'record',     row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wo_status_notify ON work_orders;
CREATE TRIGGER trg_wo_status_notify
  AFTER UPDATE OF status ON work_orders
  FOR EACH ROW EXECUTE FUNCTION notify_work_order_status_change();
