-- TamirBul — Push Notification Webhook Trigger
-- Migration: 007_push_webhook
-- Tarih: 2026-05-12
-- work_orders.status değişince notify-status-change Edge Function'ı çağırır.
-- ÖN KOŞUL: pg_net extension aktif olmalı.
--   CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
-- Edge Function --no-verify-jwt ile deploy edilmeli (auth header gerekmez).

CREATE OR REPLACE FUNCTION notify_work_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  PERFORM extensions.http_post(
    url     := 'https://dlfblfzcjtaqjbbdnosi.supabase.co/functions/v1/notify-status-change',
    body    := jsonb_build_object(
                 'record',     row_to_json(NEW),
                 'old_record', row_to_json(OLD)
               )::text,
    headers := '{"Content-Type":"application/json"}'::jsonb
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Bildirim hatası iş akışını engellemez
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_wo_status_notify ON work_orders;
CREATE TRIGGER trg_wo_status_notify
  AFTER UPDATE OF status ON work_orders
  FOR EACH ROW EXECUTE FUNCTION notify_work_order_status_change();
