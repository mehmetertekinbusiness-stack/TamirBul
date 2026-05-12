// Supabase Edge Function — notify-status-change
// Tetikleyici: work_orders tablosunda status değiştiğinde DB webhook'u bu fonksiyonu çağırır.
// Payload: { record: WorkOrder, old_record: WorkOrder }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  inspecting:  { title: 'Aracınız inceleniyor', body: 'Tamirci aracınızı incelemeye aldı.' },
  in_progress: { title: 'Onarım başladı',        body: 'Aracınızın onarım işlemi devam ediyor.' },
  ready:       { title: '🎉 Aracınız hazır!',     body: 'Aracınızı teslim alabilirsiniz.' },
  delivered:   { title: 'Teslim tamamlandı',      body: 'İş emriniz kapatıldı. İyi yolculuklar!' },
  cancelled:   { title: 'İş emri reddedildi',     body: 'Tamirci iş emrinizi kabul edemedi. Başka bir tamirci seçebilirsiniz.' },
};

serve(async (req) => {
  try {
    const { record, old_record } = await req.json();

    // Durum değişmediyse ya da mesaj tanımı yoksa işlem yapma
    if (record.status === old_record?.status) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }
    const msg = STATUS_MESSAGES[record.status];
    if (!msg) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no_message' }), { status: 200 });
    }

    // Müşterinin push token'ını al
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userRes = await fetch(
      `${supabaseUrl}/rest/v1/users?id=eq.${record.customer_id}&select=push_token`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    const users = await userRes.json();
    const pushToken = users?.[0]?.push_token;

    if (!pushToken) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no_push_token' }), { status: 200 });
    }

    // Expo Push Notification gönder
    const pushRes = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to:    pushToken,
        title: msg.title,
        body:  msg.body,
        data:  { workOrderId: record.id, status: record.status },
        sound: 'default',
      }),
    });

    const pushData = await pushRes.json();
    return new Response(JSON.stringify({ sent: true, expo: pushData }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
