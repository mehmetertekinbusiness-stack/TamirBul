---
name: migration-apply
description: TamirBul Supabase migration dosyasını doğrudan veritabanına uygular. "migration uygula", "db push", "sql çalıştır", "migration apply" dediğinde kullan. supabase db push çalışmıyor — bu skill Management API ile direkt SQL çalıştırır.
disable-model-invocation: false
---

# Migration Apply — TamirBul

Supabase pooler IPv4 üzerinden bağlanamıyor (proje IPv6-only). Bunun yerine Supabase Management API kullanılır.

## Bağlantı Yöntemi: Management API

```
Endpoint: https://api.supabase.com/v1/projects/dlfblfzcjtaqjbbdnosi/database/query
Token:    SUPABASE_MANAGEMENT_TOKEN
Method:   POST, body: { "query": "<SQL>" }
```

## Uygulama Adımları

1. Migration SQL dosyasını oku
2. RLS kontrolü yap (her tabloda `ENABLE ROW LEVEL SECURITY` var mı?)
3. Aşağıdaki script ile uygula:

```javascript
const https = require('https');
const fs = require('fs');

const TOKEN = 'SUPABASE_MANAGEMENT_TOKEN';
const PROJECT = 'dlfblfzcjtaqjbbdnosi';

function runQuery(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${TOKEN}`
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) resolve(JSON.parse(data));
        else reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 300)}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const sql = fs.readFileSync(process.argv[2], 'utf8');
runQuery(`BEGIN;\n${sql}\nCOMMIT;`)
  .then(() => console.log('Migration uygulandı ✓'))
  .catch(e => { console.error('HATA:', e.message); process.exit(1); });
```

Çalıştırma:
```bash
node --dns-result-order=ipv4first /tmp/apply_migration.js <DOSYA_YOLU>
```

## Tablo Doğrulama

```bash
node --dns-result-order=ipv4first -e "
const https = require('https');
const body = JSON.stringify({ query: 'SELECT table_name FROM information_schema.tables WHERE table_schema=\'public\' ORDER BY table_name' });
const options = {
  hostname: 'api.supabase.com',
  path: '/v1/projects/dlfblfzcjtaqjbbdnosi/database/query',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Authorization': 'Bearer SUPABASE_MANAGEMENT_TOKEN' }
};
const req = https.request(options, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>JSON.parse(d).forEach(r=>console.log(r.table_name))); });
req.on('error',e=>console.error(e.message));
req.write(body);
req.end();
"
```

## Mevcut Durum (Mayıs 2026)

- [x] 001_initial_schema.sql — uygulandı
- [x] 002_storage_buckets.sql — uygulandı
  - Buckets: shop-photos (public), work-order-photos (private)
- [ ] Sonraki migration'lar Sprint 1+ ile gelecek

## TamirBul Şema Özeti
- Tablolar: users, vehicles, repair_shops, shop_categories, shop_hours, work_orders, work_order_updates, suppliers, reviews
- Enums: repair_category_enum (8 kategori), work_order_status_enum (5 durum)
- Roller: `customer` ve `mechanic`
- Her tabloda RLS aktif
