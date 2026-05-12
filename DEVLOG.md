# TamirBul — Development Log
> Uygulama: Oto tamirci / lastikçi / servis randevu ve iş emri takip platformu (geçici proje adı)
> Geliştirici: Mehmet ERTEKİN | Başlangıç: Mayıs 2026
> Taban: Neva altyapısı (~%65 yeniden kullanım) | Pilot: İstanbul
> **Not:** Bu log bir bilgi tabanıdır — silme yok, yalnızca "⚠️ GEÇERSİZ" / "✅ AŞILDI" notları eklenir.
>
> ---
> ## NEVA DEVLOG REFERANSI
> Neva geliştirme geçmişi (hatalar, çözümler, mimari kararlar) aşağıda korunmaktadır.
> TamirBul geliştirirken aynı hatalara düşmemek için bu loga başvur.
> Neva özgün logu: ~/LocalAppPlatform/apps/neva/DEVLOG.md
> ---

## TamirBul Proje Notları

---

### [2026-05-12] Checkpoint 19:30 — ESLint Temizliği + DVI Fotoğraf + Değerlendirme + EAS Build

**Tamamlanan:**
- **ESLint konfigürasyonu** (`eslint.config.js`) tamamlandı — 0 hata, 0 uyarı
  - Kullanılmayan importlar kaldırıldı (Image, Clock, CheckCircle, WORK_ORDER_STATUSES)
  - JSX unescaped entity düzeltmeleri (`&apos;`)
  - `react-hooks/exhaustive-deps` kasıtlı noktalarda eslint-disable ile susturuldu
  - `import/first` ihlali — Colors import `lib/constants.tsx` başına taşındı
- **Node 20 kurulumu** (nvm) — `toReversed()` uyumsuzluğu (Node 18 → 20) çözüldü
- **Migration 008** uygulandı: `work-order-photos` bucket public yapıldı + `wo_photos_upload` policy eklendi
- **İş emrine fotoğraf desteği (DVI temel):**
  - `(mechanic)/work-order/[id].tsx`: galeri picker (`expo-image-picker`) + Supabase Storage upload
  - Fotoğraf durum güncellemesiyle birlikte `work_order_updates.photo_url`'e kaydediliyor
  - `(customer)/work-orders.tsx`: güncelleme geçmişinde fotoğraf thumbnail gösterimi
- **Müşteri değerlendirmesi:**
  - Teslim edilen iş emirlerinde `DetailSheet`'e 5 yıldız + yorum formu eklendi
  - `reviews` tablosuna INSERT (work_order_id, customer_id, shop_id, rating, comment)
  - `update_shop_rating()` trigger otomatik avg_rating / review_count güncelliyor
  - Duplicate önleme: `work_order_id` üzerinden kontrol, gönderi sonrası form kaybolur
- **EAS Build** tamamlandı ✓ — APK hazır:
  - Build ID: `7e288d39-6828-4898-ac4b-fb90612bc896`
  - Node 20 ile başarılı; Node 18'de `toReversed` hatası veriyordu

**Kararlar:**
- `work-order-photos` bucket public yapıldı (storage signed URL yerine direkt URL — MVP için yeterli)
- `reviews.work_order_id` FK sayesinde her iş emri için tek değerlendirme garanti (DB constraint)
- EAS CLI Node versiyonu: `/usr/local/bin/eas` (`.local/bin` değil), Node 20 gerekli

**Sorunlar / Çözümler:**
| # | Sorun | Çözüm | Durum |
|---|-------|-------|-------|
| T-12 | EAS build — `configs.toReversed is not a function` (Node 18) | nvm + Node 20 kuruldu, EAS bu sürümle çalıştırıldı | ✅ AŞILDI |
| T-13 | `@typescript-eslint/no-unused-vars` `_`-prefixed değişkenleri uyarı verdi | `eslint-config-expo/flat` içindeki TS plugin konfigüre edilemez — değişkenler doğrudan kaldırıldı | ✅ AŞILDI |

**Bekleyen:**
- EAS build APK'sı cihazda kurulup uçtan uca test edilecek
- Tamirci dashboard istatistikleri (aylık iş emri sayısı, kategori dağılımı)
- Anlık mesaj / onay akışı (müşteriye fotoğraf + "Kabul et / Reddet" butonu)
- Test altyapısı (Jest + React Native Testing Library) — backlog

---

### [2026-05-12] Checkpoint — Tamirci Kabul/Red + Push Notification + Migration'lar

**Tamamlanan:**
- **Supabase CLI login** — yeni cihazda `supabase link` tamamlandı, `config.toml` major_version 15→17 güncellendi
- **Migration 004** (security_fixes) uygulandı:
  - `wou_mechanic_insert` RLS: iş emri sahipliği doğrulaması eklendi
  - `shop_categories` ALL → INSERT + DELETE (explicit ayrım)
  - `suppliers` ALL → SELECT + INSERT + UPDATE + DELETE (explicit ayrım)
- **Migration 005** (schema_fixes) uygulandı:
  - `repair_shops`'a `district`, `avg_rating`, `review_count` kolonları eklendi
  - `reviews` INSERT/UPDATE/DELETE → `update_shop_rating()` trigger oluşturuldu
- **Migration 006** (status_extend) uygulandı — transaction dışı (`--no-tx`):
  - `work_order_status_enum`'a `cancelled` değeri eklendi
- **Migration 007** (push_webhook) uygulandı:
  - `work_orders.status` UPDATE → `notify_work_order_status_change()` trigger
  - `pg_net` olmadan graceful NOTICE ile pas geçiyor
- **Edge Function** `notify-status-change` deploy edildi (Expo Push API entegrasyonu)
- **`(mechanic)/work-orders.tsx`** tamamen yeniden yazıldı:
  - `received` durumundaki iş emirleri için **Kabul Et** / **Reddet** butonları
  - Kabul → status: `inspecting` + `work_order_updates` kaydı
  - Reddet → Alert onayı → status: `cancelled` + listeden kaldır
  - Header'da bekleyen iş emri rozeti (`X yeni`)
- **`(customer)/work-orders.tsx`**: `cancelled` için kırmızı uyarı kartı eklendi (timeline yerine)
- **`lib/constants.tsx`**: `cancelled` durumu eklendi, `received` etiketi → "Bekliyor"

**Kararlar:**
- Migration CLI tracking uyumsuz (dosya adı formatı farklı) → Management API ile direkt SQL çalıştırma yöntemi kalıcı çözüm
- Push notification için pg_net yerine Supabase Webhooks yöntemi tercih edilecek (Dashboard'dan manuel eklenecek)
- Supabase Management token: `sbp_e5754c42...` (CLI login ile ~/.supabase/access-token'da saklanıyor)

**Sorunlar / Çözümler:**
| # | Sorun | Çözüm | Durum |
|---|-------|-------|-------|
| T-08 | `sb_secret_` format token → Management API 401 | CLI login (`supabase login`) → `sbp_` token otomatik alındı | ✅ AŞILDI |
| T-09 | `supabase db push` → migration 001 zaten var, `42710` hata | Migration CLI tracking bypass — `supabase db query` ve Management API direkt SQL | ✅ AŞILDI |
| T-10 | Migration 006 `ALTER TYPE ADD VALUE` transaction içinde çalışmıyor | `--no-tx` flag ile transaction sarmalı olmadan uygulandı | ✅ AŞILDI |
| T-11 | `shop/[id].tsx` `district` ve `avg_rating` DB'de yoktu | Migration 005 ile kolonlar eklendi, rating trigger kuruldu | ✅ AŞILDI |

**Bekleyen:**
- Push notification tam akışı için: Supabase Dashboard → Database → Webhooks → `notify-status-change` URL ekle
- Edge Function env: `SUPABASE_SERVICE_ROLE_KEY` Dashboard → Functions → notify-status-change → Secrets'a ekle
- EAS build ile cihazda uçtan uca test
- ESLint config (`eslint.config.js`) — backlog
- Push to remote (`git push`)

---

### [2026-05-11] Yeni Cihaz Kurulumu + Skill Audit Oturumu

**Tamamlanan:**
- Yeni cihaza GitHub PAT ile klonlama: `neva`, `neva-dashboard`, `neva-legal`, `nevaapp-landing` (4 repo, veri kaybı yok)
- `neva` + `neva-dashboard` → `npm install` tamamlandı
- Claude Code global skill kurulumu: `superpowers`, `frontend-design`, `code-review`, `security-guidance` (resmi marketplace), `claude-mem` (thedotmack), `gstack` (garrytan — bun + playwright kuruldu)
- **ts-fix:** TypeScript 3 hata → 0 hata
  - `hooks/use-theme-color.ts`: Expo şablon `Colors.light/dark` yapısı → TamirBul flat Colors yapısına uyarlandı
  - `components/themed-text.tsx`: `'text'` → `'textPrimary'` (Colors'da `text` anahtarı yoktu)
- **Renk sistemi birleşimi:** `lib/constants.tsx` içindeki `C` objesi artık `constants/theme.ts → Colors`'dan türetiliyor; iki ayrı renk kaynağı → tek kaynak
- **Güvenlik düzeltmeleri** → `supabase/migrations/20260511_004_security_fixes.sql`:
  - `wou_mechanic_insert` RLS: sadece `updated_by` → iş emrinin tamircinin dükkanına ait olduğu doğrulaması eklendi
  - `shop_categories` ALL policy → `INSERT` + `DELETE` olarak ayrıldı (explicit op ayrımı)
  - `suppliers` ALL policy → `SELECT` + `INSERT` + `UPDATE` + `DELETE` olarak ayrıldı
- `.env.example` oluşturuldu (5 env değişkeni belgelendi)

**Sorunlar / Çözümler:**
| # | Sorun | Çözüm | Durum |
|---|-------|-------|-------|
| T-04 | `use-theme-color.ts`: `Colors.light` mevcut değil, Expo şablonu kalıntısı | `FlatColorKey` + `DarkColorKey` type alias + dark mode koşullu lookup | ✅ AŞILDI |
| T-05 | `themed-text.tsx`: `'text'` key Colors'da yok → TS hatası | `'textPrimary'` olarak güncellendi | ✅ AŞILDI |
| T-06 | Çift renk sistemi: `C` (constants.tsx) + `Colors` (theme.ts) senkronizasyon riski | `C` artık `Colors`'dan türetiliyor — tek kaynak | ✅ AŞILDI |
| T-07 | `wou_mechanic_insert` RLS: herhangi bir tamirci başka dükkanın iş emrine güncelleme ekleyebilir | Policy'e `work_order_id IN (shop'a ait work_orders)` koşulu eklendi | ✅ AŞILDI |

**Health Skoru (2026-05-11):**
- TypeScript: 0/0 hata ✅
- ESLint: yapılandırma dosyası yok (eslint.config.js eksik) — Sprint 1 backlog
- Test coverage: %0 — backlog
- `.env.example`: oluşturuldu ✅

**Bekleyen / Backlog:**
- ESLint config (`eslint.config.js`) oluşturulacak
- `20260511_004_security_fixes.sql` migration uygulanacak (`/migration-apply`)
- Test altyapısı (Jest + React Native Testing Library) kurulacak

---

### [2026-05-10] Checkpoint 22:30 — work-order/[id].tsx Detay Ekranı

**Tamamlanan:**
- `work-order/[id].tsx` incelendi — remote'da tam implementasyon mevcuttu
- `updated_by` eksikliği tespit edilip düzeltildi (RLS WITH CHECK zorunlu kılıyor)
- `useAuth` eklendi, `myUserId` state ile UUID `loadOrder`'da fetch ediliyor

**Sorunlar / Çözümler:**
| # | Sorun | Çözüm | Durum |
|---|-------|-------|-------|
| T-03 | `work_order_updates` insert — `updated_by` null → RLS WITH CHECK false → 42501 | `useAuth` + `users` sorgusu ile UUID alındı, insert'e eklendi | ✅ |

**Ekran özellikleri (work-order detay):**
- Header: geri butonu + durum pill
- Araç bölümü: plaka büyük font, marka/model/yıl
- 5 adımlı durum timeline (CheckCircle ikonlar)
- Tamirci notu: multiline, blur'da otosave
- Güncelleme geçmişi: durum + not + saat
- Footer aksiyon butonu: "X olarak işaretle" (son adımda kaybolur)

**Bekleyen:**
- `(customer)/index.tsx` — harita + tamirci listesi (sıradaki)
- `(customer)/vehicles.tsx` — araç yönetimi
- `(customer)/work-orders.tsx` — müşteri iş emri takibi
- EAS build ile cihazda test

---

### [2026-05-10] Checkpoint 22:00 — JWT Test + Auth Bug Fix + Mechanic Dashboard

**Tamamlanan:**
- Supabase Clerk JWT entegrasyonu doğrulandı: `resolved_jwks` aktif, RS256 key yüklü
- RLS policy'ler incelendi — tüm tablolar `current_setting('request.jwt.claims')::jsonb ->> 'sub'` kullanıyor
- Mechanic paneli remote'da hazır: dashboard (index), iş emirleri listesi, dükkan, tedarikçi, work-order detay
- `(mechanic)/_layout.tsx`: phosphor-react-native ikonlar (Wrench, ClipboardText, Storefront, AddressBook)

**Kararlar:**
- MCP Supabase bağlantısı Neva projesine bağlı — TamirBul için Management API kullanımına devam
- `users_self_read` RLS: filtre olmadan `.select('id')` sadece kendi satırını döndürüyor — tüm ekranlarda bu pattern kullanılıyor

**Sorunlar / Çözümler:**
| # | Sorun | Çözüm | Durum |
|---|-------|-------|-------|
| T-01 | sign-up.tsx'te `setActive()` öncesi Supabase insert — JWT yok → RLS 42501 sessiz hata | insert kaldırıldı; role/name `reg_role_` / `reg_name_` SecureStore key'lerine yazılıyor; `ensureUserAndGetRole` token hazır olunca insert yapıyor | ✅ |
| T-02 | Git object corruption — 9 boş obje, HEAD bozuk | boş objeler silindi, remote fetch, `reset --hard FETCH_HEAD` | ✅ |

**Bekleyen (Sprint 1):**
- `work-order/[id].tsx` detay ekranı — durum güncelleme + not ekleme
- `(customer)/index.tsx` — harita + tamirci listesi
- `(customer)/vehicles.tsx` — araç yönetimi
- `(customer)/work-orders.tsx` — müşteri iş emri takibi
- EAS build ile cihazda test

---

### [2026-05-09] Sprint 0 Tamamlandı — Altyapı Kurulumu

**Yapılanlar:**

**Proje İskeleti**
- Neva'dan fork, tamamen bağımsız proje olarak yapılandırıldı
- Expo SDK 54, Expo Router, Clerk auth, Supabase, Google Maps entegrasyonları kuruldu
- Bundle ID: `co.nevaapp.tamirbul`, EAS project: `ae0c922f-a67c-4589-bb8b-077ee1590fdc`

**Agents & Skills**
- 6 teknik agent oluşturuldu: backend-developer, frontend-developer, security-guardian, tester, db-architect, sprint-manager
- Skills: eas-build, migration-apply, devlog-update
- Hooks: TypeScript async check (PostToolUse), SessionStart mesajı, SessionEnd git commit

**Supabase Kurulumu**
- Proje oluşturuldu: `dlfblfzcjtaqjbbdnosi`
- Migration 001 (initial schema): 9 tablo, 2 enum, 3 trigger, tam RLS
  - users, vehicles, repair_shops, shop_categories, shop_hours
  - work_orders, work_order_updates, suppliers, reviews
- Migration 002 (storage): shop-photos (public), work-order-photos (private)
- **Not:** Doğrudan DB bağlantısı IPv6-only olduğu için çalışmıyor. Supabase Management API (`/v1/projects/{ref}/database/query`) ile uygulandı.

**EAS Env Variables**
- GOOGLE_MAPS_API_KEY, GOOGLE_PLACES_API_KEY ✅
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM ✅
- SUPABASE_URL, SUPABASE_ANON_KEY ✅
- CLERK_PUBLISHABLE_KEY → PLACEHOLDER (Clerk projesi kurulunca güncellenecek)

**Teknik Karar: Migration Yöntemi**
- `supabase db push --db-url` başarısız: pooler "Tenant or user not found" (tüm bölgeler denendi)
- Doğrudan DB host IPv6-only, bu ortam IPv4-only
- Çözüm: `sbp_3baa9217...` token ile Management API kullanıldı (hesap düzeyinde erişim)
- Script: `/tmp/apply_migration.js` — gelecek migration'lar için aynı yöntem kullanılacak

**Bekleyen (Sprint 1 öncesi):**
- Clerk projesi oluştur (TamirBul için ayrı) → CLERK_PUBLISHABLE_KEY EAS'e ekle

---

---

# NEVA REFERANS LOGU (8 Mayıs 2026 kopyası)


---

## Sorunlar & Çözümler Kataloğu
> Karşılaşılan tüm teknik sorunlar ve çözümleri. Gelecek uygulamalarda aynı sorunla zaman kaybetmemek için tutulur.

### Android / React Native

| # | Sorun | Kök Neden | Çözüm | Sprint |
|---|-------|-----------|-------|--------|
| A-01 | Harita pinleri sürekli yeniden çiziliyor, performans düşüyor | `<View>` marker ile `tracksViewChanges` Android bug | Custom marker yerine `pinColor` prop kullan | S17 |
| A-02 | MapViewScreen her state değişiminde remount oluyor, focus kayboluyor | Component fonksiyon içinde tanımlanmış → her render'da yeni referans | Harita JSX'ini inline `const mapViewJSX` olarak fonksiyon dışına al | S17 |
| A-03 | `TransactionTooLargeException` crash — büyük state Bundle'a sığmıyor | Android'de Bundle boyut limiti | `android:saveEnabled=false` config plugin (`withDisableSavedState`) | 22 Mar |
| A-04 | `android:launchMode` uyarısı — deep link / OAuth redirect sorunları | Expo Linking default ayarı | `android:launchMode=singleTask` app.config.js ile set et | 22 Mar |
| A-05 | Emülatör headless modda boot'ta sistem servisi hatası veriyor | AVD headless mod kısıtlaması | Emülatörü Android Studio'dan görsel modda başlat | S17 |
| A-06 | `expo-keep-awake` "Unable to activate keep awake" hatası | Expo SDK 54 uyumsuzluğu — non-critical | Görmezden gel, uygulama çalışmaya devam ediyor | S17 |

### Supabase / Backend

| # | Sorun | Kök Neden | Çözüm | Sprint |
|---|-------|-----------|-------|--------|
| B-01 | `places-nearby` Edge Function BOOT_ERROR | `std@0.168.0` `serve()` Deno runtime'da deprecate edilmiş | `serve(handler)` → `Deno.serve(handler)` | S17 |
| B-02 | `supabase db push` tüm migration'ları yeniden uygulamaya çalışıyor, conflict | Supabase CLI migration tracking sorunu | `supabase db push` kullanma; `node scripts/db.mjs "SQL"` ile direkt bağlantı | Genel |
| B-03 | Supabase Edge Function CLI deploy çalışmıyor | CLI auth token sorunu | `curl PATCH` + `/tmp/fn_payload.json` pattern ile deploy | S17 |
| B-04 | DB host `db.lseuuyjomkalddijicta.supabase.co` bağlanamıyor | IPv6 only, local ortam IPv4 | Pooler host kullan: `aws-1-ap-northeast-2.pooler.supabase.com:6543` | Genel |
| B-05 | Supabase Realtime filter'ları UPDATE/DELETE'de çalışmıyor | `REPLICA IDENTITY DEFAULT` — eski değeri broadcast etmiyor | `ALTER TABLE bookings REPLICA IDENTITY FULL` + `supabase_realtime` publication'a ekle | S19 |
| B-07 | `avg_rating` trigger hiçbir zaman hesaplamıyor — daima null | `update_shop_rating()` SECURITY DEFINER değil; RLS aktif reviews tablosunda; trigger çalışırken SELECT COUNT=0 döner | `CREATE OR REPLACE FUNCTION update_shop_rating() ... SECURITY DEFINER` + mevcut verileri manuel UPDATE ile düzelt | S18 (1 Nis) |
| B-06 | `getSession()` zaman zaman yanıt vermiyor, ekran takılıyor | Supabase Auth ağ gecikmesi | 8 saniyelik güvenlik timer + AsyncStorage & getSession paralel `Promise.all` | 22 Mar |

### Expo / Build

| # | Sorun | Kök Neden | Çözüm | Sprint |
|---|-------|-----------|-------|--------|
| C-01 | Native splash kapandığında beyaz flash görünüyor | `app.json` splash `backgroundColor: "#ffffff"` | Native splash arka planını `#0E0F1C` yap | S13 |
| C-02 | Auth yüklenirken kara ekran — JS splash gösterilmiyor | AsyncStorage ve getSession sıralı çalışıyor | `AsyncStorage.getItem` + `supabase.auth.getSession()` paralel başlat | S13 |
| C-03 | Auth navigate loop — aynı ekrana tekrar navigate edince uyarı | React Navigation aynı hedefe push | `useRef` ile son navigasyon hedefini takip et, aynıysa navigate etme | 22 Mar |
| C-04 | EAS build `eas.json`'daki `account` alanı hata veriyor | EAS CLI 18.4 uyumsuzluğu | `account` alanını `eas.json`'dan kaldır | S14 |
| C-05 | Berber salonum ekranında hizmet listesi "Henüz hizmet eklenmedi" gösteriyor — DB'de veri var | `services` tablosunda `created_at` kolonu yok; `.order('created_at')` query'i fail eder, data=null döner, state boş kalır | `salon.tsx`'te `.order('created_at')` kaldır | S18 (1 Nis) |

### UI / Test

| # | Sorun | Kök Neden | Çözüm | Sprint |
|---|-------|-----------|-------|--------|
| D-01 | ReviewModal SVG yıldızları `adb tap` ile seçilemiyor | SVG elementinde text/accessibility ID yok | `adb shell uiautomator dump` ile koordinat bul, bounds tabanlı tap | S17 |
| D-02 | `adb input text` Türkçe / URL-encoded metin bozuluyor | ADB text input encoding kısıtlaması | Test metnini ASCII-safe tut | S17 |

### Güvenlik

| # | Sorun | Kök Neden | Çözüm | Tarih |
|---|-------|-----------|-------|-------|
| G-01 | API key'ler (`SUPABASE_ANON`, `GOOGLE_MAPS_KEY`) source kodda hardcoded | `constants.tsx` statik string | `app.config.js extra` + EAS secrets'a taşındı; `constants.tsx` `expo-constants` üzerinden okur | 7 Nis |
| G-02 | Edge Function'larda prompt injection riski | `shop_name`/`query` sanitize edilmeden Claude prompt'una interpolate ediliyor | `[\r\n"\\]` strip + max length; `review-summary` ve `style-assistant` güncellendi | 7 Nis |
| G-03 | `whatsapp-notify` herhangi bir authenticated user gönderebilir | Rol kontrolü yoktu | DB'den rol sorgusu eklendi; sadece `berber`/`barber` rolü geçirebilir | 7 Nis |
| G-04 | Email enumeration: "Email not confirmed" hatası hesap varlığını ifşa ediyordu | Supabase auth error'u direkt client'a yansıtılıyordu | Generic hata mesajı: "E-posta veya şifre hatalı veya hesap doğrulanmamış" | 7 Nis |
| G-05 | `globalBanner.screen` arbitrary route push yapabiliyordu | Herhangi bir string `router.push()`'a gidiyordu | `ALLOWED` Set allowlist: sadece 4 bilinen route geçerli | 7 Nis |
| G-06 | `supabase.ts` SUPABASE_URL ve SUPABASE_ANON_KEY hardcoded git'e committed | Önceki pentest fix'i `lib/constants.tsx`'i düzeltti, `supabase.ts`'i atladı | `expo-constants` üzerinden `lib/constants`'tan import; hardcoded string kaldırıldı | 7 Nis R2 |
| G-07 | Privilege escalation: musteri → berber rolüne `users.UPDATE` ile self-yükseltme | `users_can_update_own_row` policy kolon kısıtlaması yoktu | DB BEFORE UPDATE trigger (`prevent_role_change`): `role` kolonu değiştirilemez | 7 Nis R2 |
| G-08 | Review yorum alanı prompt injection'a açıktı | `r.comment` sanitize edilmeden Claude prompt'una ekleniyor; yalnızca `shop_name` düzeltilmişti | `r.comment` → `[\r\n"\\]` strip + max 300 char; `review-summary` güncellendi | 7 Nis R2 |
| G-09 | `places-nearby` lat/lng/radius sınır kontrolü yoktu | Body parametreleri doğrudan Google API'ye iletiliyor; kota israfı riski | lat (-90/+90), lng (-180/+180) range check; radius 100-5000 arası clamp | 7 Nis R2 |
| G-10 | `whatsapp-notify` message boyutu sınırsız | Twilio'ya iletilmeden önce uzunluk kontrolü yoktu | `message.length > 1000` → 400 hatası | 7 Nis R2 |
| G-11 | `app.config.js` fallback değerleri hardcoded API key içeriyordu | `\|\|` fallback: env var yoksa APK'ya baked-in key giriyordu | Fallback değerleri kaldırıldı; `process.env.X` only | 7 Nis R2 |
| D-03 | Geçmiş saatler disabled yerine gizleniyor (test 4.4) | Bilinçli tasarım tercihi | ⚠️ TASARIM TERCİHİ — bloker değil; disabled UI backlog'da | S19 |
| D-04 | MapShopSheet Expo Router tarafından route olarak kaydediliyor; shop=undefined ile render → crash | `app/` altındaki tüm dosyalar Expo Router tarafından route sayılır | ✅ KALICI FIX: `components/MapShopSheet.tsx` e taşındı | S20 |
| D-05 | RNGH Pan gesture `if (!shop) return null` guard'ından sonra `useEffect`/`useAnimatedStyle` çağrılıyordu | React hooks kuralı: tüm hook'lar koşulsuz çağrılmalı | Tüm hook çağrıları guard'ın üstüne taşındı; date-effect içine `if (!shop) return` eklendi | S20 |
| D-06 | Swipe down hareketi kartı kapatmıyor | `vel > 900` eşiği çok yüksek; normal hızda swipe (vel≈400-600) kapatmıyor | `vel > 600` ve `pos > SH*0.72` olarak düşürüldü | S20 |

---

## 7 Nisan 2026 — Yapısal Sprint (commit 9eb5c2e)

Lansman öncesi mimari iyileştirmeler:

| # | İyileştirme | Etki |
|---|-------------|------|
| S-01 | `lib/session-context.tsx` (SessionCtx + useSession) | 5 ayrı onAuthStateChange listener → 1 (\_layout.tsx) |
| S-02 | barber/index.tsx: auth boilerplate kaldırıldı | useSession() ile context'ten okunuyor |
| S-03 | customer/bookings.tsx: auth boilerplate kaldırıldı | — |
| S-04 | customer/index.tsx: auth boilerplate kaldırıldı | — |
| S-05 | customer/settings.tsx: auth boilerplate kaldırıldı | — |
| S-06 | barber/index.tsx: Realtime UPDATE N+1 kapatıldı | Full reload → local state patch (joined alanlar korunuyor) |
| S-07 | barber/index.tsx: select('*') → spesifik kolonlar | Gereksiz veri çekilmesi önlendi |
| S-08 | ErrorBoundary: BookingsScreen + DashboardScreen | Crash recovery aktif kritik ekranlarda |

**Ertelenen:** push notification → Edge Function (Expo API public, 12 kullanıcı için risk yok — lansman sonrası)
**Ertelenen:** Supabase generated types (CLI auth sorunu — supabase gen types çalışmıyor)

## 7 Nisan 2026 — Performans & Kod Kalitesi Sprint (commit 2b59d79)

Kapsamlı kod denetimi + simplify taraması sonrası iyileştirmeler:

| # | İyileştirme | Etki |
|---|-------------|------|
| P-01 | `getTodayISO()` helper eklendi (lib/helpers.ts) | 6 dosyada tekrar eden `.toISOString().split('T')[0]` merkezileştirildi |
| P-02 | `STATUS.alternative` eklendi (bookings.tsx) | Hardcoded `#EEF2FF/#6366F1` renkleri kaldırıldı |
| P-03 | bookings.tsx `load()` → Promise.all | 2 Supabase sorgusu paralel; ~%30 hız kazanımı |
| P-04 | `Card` bileşeni modül düzeyine taşındı | FlatList memoization artık çalışır |
| P-05 | `ChangeRequestModal` setTimeout cleanup | `useRef` ile bellek sızıntısı kapatıldı |
| P-06 | `useMemo` filter/sort (customer/index) | 50 salon listesi her render'da yeniden hesaplanmıyor |
| P-07 | barber_shops + recentShopIds → Promise.all | İlk yükleme paralel; ilk açılış daha hızlı |
| P-08 | `onAuthStateChange` event guard (customer/index) | TOKEN_REFRESHED'de DB sorgusu kaldırıldı |
| P-09 | DB index: `reviews_customer_idx` | bookings.tsx load()'ında full table scan kaldırıldı |

## 11 Nisan 2026 — Clerk Auth Migration + Simplify (commit d270e4c, f9da609)

### Clerk Auth Migration
Supabase Auth tamamen kaldırıldı, Clerk ile değiştirildi.

| # | Değişiklik | Detay |
|---|------------|-------|
| C-01 | `supabase.ts` custom fetch override | `_clerkToken` → async `_getToken()` getter; her istekte taze token |
| C-02 | `_layout.tsx` ClerkProvider + AppLayout | `setTokenGetter(() => getToken({template:'supabase'}))` |
| C-03 | `session-context.tsx` | `Session\|null` → `AuthCtxType { userId, userRole }` |
| C-04 | `app/(auth)/index.tsx` | `supabase.auth.*` → `useSignIn/useSignUp/useOAuth` |
| C-05 | `app/verify-email.tsx` | OTP kodu akışı; Supabase insert hata handling + rollback |
| C-06 | `app/(barber)/*.tsx` | `session` → `userId` |
| C-07 | `app/(customer)/*.tsx` | `session` → `userId`; `getAuthToken()` Edge Function çağrıları |
| C-08 | DB Migration | `users.id` + FK kolonlar uuid → text; RLS policies `auth.uid()` → `(auth.jwt()->>'sub')` |
| C-09 | Clerk JWT Template | HS256, Supabase JWT secret signing key; Supabase RLS Clerk token kabul ediyor |

### Simplify Düzeltmeleri (commit d270e4c)
| # | Bulgu | Çözüm |
|---|-------|-------|
| S-01 | Token 60s sonra expire oluyordu | `_getToken` getter → her Supabase isteğinde taze token |
| S-02 | `verify-email.tsx` DB insert hata yok | try-catch + `signOut()` rollback eklendi |
| S-03 | `setSignInActive!` non-null assertion | `if (!setSignInActive) return` guard eklendi |
| S-04 | `getAuthToken()` helper | 3x `getClerkToken() ?? SUPABASE_ANON` → merkezi helper |
| S-05 | `handleSignOut` wrapper gereksiz | Kaldırıldı, `signOut` direkt referans |

### Build Sorunları (11 Nisan fiziksel cihaz testi)

| # | Sorun | Kök Neden | Çözüm |
|---|-------|-----------|-------|
| A-07 | `expo run:android` JAVA_HOME not set | Android Studio JBR yolunda değil | `export JAVA_HOME=.../android-studio/jbr` |
| A-08 | `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Yüklü APK farklı imzadan | `adb uninstall` sonra tekrar install |
| A-09 | `NoSuchMethodError: getStaticAsyncFunctions()` crash | `@clerk/clerk-expo` → `expo-auth-session` iç bağımlılığı `expo-crypto@55.0.14` (SDK 55) çekti; proje SDK 54 | `package.json` `overrides: { "expo-crypto": "~15.0.8" }` + `npm install` |
| A-10 | `IllegalArgumentException: App react context shouldn't be created before` | Expo Dev Launcher eski context temizlemeden yenisini oluşturuyor | `adb shell pm clear co.nevaapp.neva` ile app data sıfırla |

## 12 Nisan 2026 — DB Migration Doğrulama + Auth Fix (commit 9a8d9f3)

### DB Doğrulama Sonuçları
- `users.id` → `text` ✅ | FK'lar `public.users`'a bağlı, `auth.users` referansı yok ✅
- Tüm RLS policy'ler `auth.jwt()->>'sub'` kullanıyor ✅
- `users` tablosu boştu → kök neden bulundu

### Sorunlar & Çözümler

| # | Sorun | Kök Neden | Çözüm |
|---|-------|-----------|-------|
| B-08 | Kayıt sonrası kullanıcı `users` tablosuna eklenemiyor | `verify-email.tsx`'teki `supabase.from('users').insert()` `setActive` öncesinde çalışıyor; JWT yok + `users` tablosunda INSERT RLS policy yok → sessiz blok | `create-user` Edge Function oluşturuldu (service role key, RLS bypass, `user_` format doğrulama, idempotent) |
| B-09 | Edge Function Management API deploy'da URL import çalışmıyor | `esm.sh` URL import'ları bundle gerektiriyor; Management API raw TS kodu bundle etmiyor | `supabase-js` import yerine doğrudan REST API fetch kullanıldı |
| B-10 | Giriş ekranı `needs_second_factor` durumunda sessizce başarısız oluyor | Clerk instance'ında email OTP ikinci faktör zorunlu; kod `status !== 'complete'` için `else` branch yoktu | `needs_second_factor` → `prepareSecondFactor` + OTP input UI eklendi; dev'de `424242` test kodu çalışmıyor (nevaapp.co domain yok) → Clerk Dashboard'dan kapatılacak |

### Diğer Değişiklikler
- `settings.json` Stop hook → `SessionEnd` hook'a taşındı (her yanıtta değil, sadece kapanışta çalışır — token tasarrufu)
- Test hesapları oluşturuldu: `musteri@nevaapp.co` / `berber@nevaapp.co` (Clerk + Supabase users)
- Clerk secret key `.env`'e eklendi

### Bekleyen
- Clerk Dashboard → Multi-factor → Email verification code → Disable (nevaapp.co email yok, test hesapları ile giriş yapılamıyor)

## Son Durum
> Son güncelleme: 3 Mayıs 2026 | Dashboard redesign + 6 feature sprint

**Şu an:** Dashboard minimal/elite tasarıma kavuştu. 6 yeni özellik eklendi: Günlük Kasa, Müşteri Tercih Kartı, Sessiz Müşteri filtresi, Sadakat Damga Kartı, Bekleme Listesi, 24h WhatsApp hatırlatma (Twilio aktif olunca devreye girer).

**Sıradaki adım:** Dashboard'u test et (nevaapp.co/dashboard) → Feature 7 (Online Depozito) için iyzico/Papara araştır

### ⬜ Backlog — Feature 7: Online Depozito (bir sonraki sprint)
- Randevu oluştururken iyzico veya Papara ile %X ön ödeme
- `bookings` tablosuna `deposit_amount`, `deposit_paid` kolonu
- Ödeme durumu takibi + müşteri iade akışı
- Berber panel'de depozito raporu

---

## 3 Mayıs 2026 — Dashboard Redesign + 6 Feature Sprint

### Dashboard Redesign
Tüm dashboard sayfaları minimal/elite tasarıma (Linear.app/Vercel kalitesi) yeniden yazıldı.

**Design system:** CSS custom properties (--gold: #d4a574, --ink: #2D2320, --cream: #FAF8F5), DM Sans + Cormorant Garamond, 20px border-radius kartlar, micro-hover animasyonlar.

**Güncellenen sayfalar:** layout.tsx, page.tsx (Genel Bakış), bookings/page.tsx, customers/page.tsx, salon/page.tsx, reports/page.tsx

### 6 Feature — DB + UI

| # | Feature | DB | Dashboard UI |
|---|---------|-----|-------------|
| F-01 | 24h WhatsApp Hatırlatma | `bookings.reminder_sent_24h` + `send_24h_appointment_reminders()` + cron 07:00 UTC | — (Twilio aktif olunca çalışır) |
| F-02 | Günlük Kasa | `expenses` tablosu + RLS | `/dashboard/kasa` — takvim seçici, 3 stat kart, gider ekle/sil |
| F-03 | Müşteri Tercih Kartı | `customer_notes` tablosu + RLS | customers/page.tsx accordion'a not editörü eklendi |
| F-04 | Sadakat Damga Kartı | `loyalty_programs` + `loyalty_stamps` tabloları + RLS | `/dashboard/sadakat` — program kur, damga ekle/kullan |
| F-05 | Bekleme Listesi | `waitlist` tablosu + RLS | bookings/page.tsx'e "Bekleme" sekmesi eklendi |
| F-06 | Sessiz Müşteri | Mevcut `send_rebooking_reminders()` cron | customers/page.tsx'e "Sessiz" filtre sekmesi (60 gün) |

### Teknik Not — Clerk JWT + Supabase RLS
Yeni migration'larda `auth.uid()` ÇALIŞMAZ — Clerk user ID'leri UUID formatında değil.
Doğru pattern: `(auth.jwt() ->> 'sub')` (text karşılaştırma)
Aynı şekilde tablo FK'larında `customer_id text` (uuid değil) kullanılmalı.

---

## Son Durum
> Son güncelleme: 12 Nisan 2026 | DB fix + auth flow (commit 9a8d9f3)

**Şu an:** `create-user` Edge Function aktif, kayıt akışı çalışıyor. Giriş akışı MFA adımı eklendi ama Clerk Dashboard'dan second factor kapatılması bekleniyor.
**Sıradaki adım:** Clerk Dashboard → MFA kapat → giriş testi → tüm MANUAL_TEST → EAS production build

### ✅ Edge Functions Deploy Durumu (7 Nisan)
`review-summary`, `places-nearby`, `whatsapp-notify` → deploy edildi (curl PATCH pattern)

### ⚠️ app.config.js env var zorunluluğu
Fallback değerler kaldırıldı. Yerel geliştirmede `.env` veya EAS secrets olmadan Supabase bağlantısı çalışmaz:
```
SUPABASE_URL=https://lseuuyjomkalddijicta.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
GOOGLE_MAPS_API_KEY=AIzaSy...
```

### Geliştirme Araçları Kurulumu (1 Nisan 2026)
Bu oturumda geliştirme hızını artıracak yapılandırmalar kuruldu:
- **4 hook:** SessionStart (bekleyen test özeti), PostToolUse/Write (async TypeScript kontrol), PreCompact (git snapshot), Stop (otomatik commit)
- **13 izin:** adb, npx, node, git, supabase, eas — artık her komutta onay yok
- **Proje kılavuzu:** Proje bağlamı her oturumda otomatik yüklenir
- **tsconfig.json fix:** `supabase/functions/` hariç tutuldu (Deno ortamı, ayrı TypeScript)

**Bekleyen — senden (öncelik sırasıyla):**
1. ⬜ **7 Nisan:** nevaapp.co al (Cloudflare ~$11) + DNS CNAME → legal.nevaapp.co aktif
2. ⬜ Ekran görüntüleri — cihazda çek (1080×1920, min 4 adet: splash / liste / detay / randevu)
3. ⬜ Play Console dolduр: feature graphic + ekranlar + gizlilik URL + içerik anketi
4. ⬜ Production build: `~/.local/bin/eas build --platform android --profile production`
5. ⬜ AAB → Play Console yükle

**Production build:** `728ec557` — aşağıdaki fix'ler eksik, yeni build gerekiyor

**DB erişimi:** `node scripts/db.mjs "SQL"` veya `node scripts/db.mjs -f dosya.sql`

**Landing page:** `LocalAppPlatform/landing/` — HTML/CSS hazır, deploy için Vercel + DNS bekleniyor

**Lansman sonrası backlog:**
- Salon arama (isim bazlı)
- Favoriler listesi
- Splash ekranı animasyon detayları

---

## 5 Mayıs 2026 — Sprint B/C/D Performans Devamı (commit e9226dc, a768dda, 940985c)

### Sprint B — useCallback zinciri + ShopCard refactor + onboarding renk (commit e9226dc)

| Fix | Dosya | Etki |
|-----|-------|------|
| `loadBookings` → `useCallback([shop])` | barber/index.tsx | acceptChange deps zinciri kararlı |
| `confirmBooking` → `useCallback([shop])` + `bookingsRef` | barber/index.tsx | bookings dep kaldırıldı, stable |
| `acceptChange` → `useCallback([shop, loadBookings])` | barber/index.tsx | memo tam etkili |
| `openRejectModal` + `handleOpenChangeReject` → `useCallback([])` | barber/index.tsx | Sıfır dep, mükemmel stable |
| `ShopCard` → module scope + `memo()` | customer/index.tsx | Salon listesi gereksiz remount önlendi |
| `handleShopPress` → `useCallback([onShop])` | customer/index.tsx | Stable prop referansı |
| `#0B0D1A` → `#120B1A` | onboarding.tsx | Soğuk navy → sıcak plum (Zeynep) |

### Sprint C — Sıcak mesaj tonu + rejectBooking useCallback (commit a768dda)

| Olay | Eski | Yeni |
|------|------|------|
| Onay bildirimi | "X randevunuzu onayladı." | "Harika! X sizi bekliyor." |
| Değişiklik kabul | "X kabul etti. Yeni saatiniz..." | "Yeni saatiniz: ... — X sizi bekliyor." |
| Değişiklik red | "X talebinizi reddetti. Mevcut randevu geçerli." | "Değişiklik yapılamadı — mevcut randevunuz korunuyor." |
| İptal (alt.li) | "X alternatif saat önerdi" | "X size yeni bir saat önerdi" |
| İptal | "X randevunuzu reddetti." | "Üzgünüz, X bu sefer müsait değildi." |

Ayrıca: `rejectChangeConfirm` + `rejectBooking` → `useCallback([shop])`, `rejectBooking` bookingsRef pattern'ına geçti.

### Sprint D — Nötr salon tipi fallback + useMemo (commit 940985c)

| Fix | Dosya | Etki |
|-----|-------|------|
| `SALON_TYPES.default` eklendi (label:'Salon', accent gold) | constants.tsx | Sınıflandırılmamış salon tipi artık var |
| 4x `\|\|'berber'` → `\|\|'default'` | customer/index.tsx | Sınıflandırılmamış salonlar "Berber" görünmüyor |
| 3x `SALON_TYPES.berber` fallback → `SALON_TYPES.default` | customer/index.tsx | ShopCard + mapViewJSX + ProfileScreen |
| `claimedGoogleIds` → `useMemo([shops])` | customer/index.tsx | Her render'da yeniden Set oluşturulmuyor |
| `visibleGooglePlaces` → `useMemo([googlePlaces, claimedGoogleIds])` | customer/index.tsx | Her render'da yeniden filtre yok |

**Not:** `helpers.ts` `erkek → berber` mantığına dokunulmadı — erkek kullanıcı için doğru davranış.

**Teknik Borç (Sprint E):** `useReducer` salon.tsx (25 state, organizasyonel), marker `tracksViewChanges` audit.

---

## 5 Mayıs 2026 — Sprint E/F Performans Devamı (commit 2cb45fc, 99e508d)

### Sprint E — userId-dep useEffect ayrımı + fetchNearbyPlaces useCallback (commit 2cb45fc)

| Fix | Dosya | Etki |
|-----|-------|------|
| Mount-only useEffect ayrıldı: salon listesi + konum | customer/index.tsx | Her render'da tekrar çalışmıyor |
| `userId` useEffect ayrıldı: son ziyaretler | customer/index.tsx | Login-after-mount bug'ı düzeltildi |
| `fetchNearbyPlaces` → `useCallback([])` (useEffect'lerden önce tanımlandı) | customer/index.tsx | Deps zinciri kararlı; TS2448 hoisting hatası önlendi |
| `[filter, viewMode]` useEffect deps'e `fetchNearbyPlaces` eklendi | customer/index.tsx | React lint kuralına uygun |

**Not:** `const` hoisting sorunu — `useCallback` atanmış `const` hoisted değil; kullandığı `useEffect`'ten önce tanımlanmalı.

### Sprint F — ProfileScreen pure fn + useMemo (commit 99e508d)

| Fix | Dosya | Etki |
|-----|-------|------|
| `detectServiceGender` → module scope (pure fn) | customer/index.tsx | Her render'da yeniden oluşturulmuyor |
| `days` → `useMemo([shop.working_hours])` | customer/index.tsx | Salon değişince yeniden hesaplanır, diğer state'lerde yeniden hesaplanmaz |
| `selDay` → `useMemo([days, date])` | customer/index.tsx | Tarih seçilince güncellenir |
| `slots` → `useMemo([date, selDay])` | customer/index.tsx | Slot filtresi + "bugün" kontrolü memoized |

**Sprint Sonucu:** `npx tsc --noEmit` → 0 hata (tüm sprintler sonrası)

---

## 5 Mayıs 2026 — Sprint G Performans (commit 505a39f)

### Sprint G — customer/bookings.tsx Card memo + useCallback zinciri

| Fix | Dosya | Etki |
|-----|-------|------|
| `Card` → `memo(Card)` | bookings.tsx | FlatList'te gereksiz re-render önlendi |
| `bookingsRef` pattern eklendi | bookings.tsx | cancel/submitChangeRequest bookings dep'inden kurtuldu |
| `load` → `useCallback([userId])` | bookings.tsx | cancel/acceptAlternative deps zinciri kararlı |
| `cancel` → `useCallback([customerName, load])` | bookings.tsx | Stable prop — Card memo tam etkili |
| `acceptAlternative` → `useCallback([customerName, load])` | bookings.tsx | Stable prop — Card memo tam etkili |
| `submitChangeRequest` → `useCallback([load])` + bookingsRef | bookings.tsx | bookings dep kaldırıldı |
| `handleChangeRequest` + `handleReview` → `useCallback([])` | bookings.tsx | Inline arrow fn'ler kaldırıldı |
| `scheduleReminderNotifications` → module scope (pure fn) | bookings.tsx | Her render'da yeniden oluşturulmuyor |

**Not:** `submitChangeRequest` modal'dan çağrılır (FlatList değil), yine de bookingsRef pattern ile temizlendi.

---

## 5 Mayıs 2026 — Sprint H Performans (commit 8ba1e3d)

### Sprint H — customer/bookings.tsx useMemo + renderItem useCallback

| Fix | Dosya | Etki |
|-----|-------|------|
| `today` → `useMemo([])` | bookings.tsx | Mount'ta bir kez hesaplanır |
| `upcoming` → `useMemo([bookings, today])` | bookings.tsx | bookings değişince yeniden filtreler |
| `past` → `useMemo([bookings, upcoming])` | bookings.tsx | O(n) includes maliyeti memoized |
| `list` → `useMemo([tab, upcoming, past])` | bookings.tsx | Tab değişince yeniden hesaplanır |
| `renderItem` → `useCallback` | bookings.tsx | Sprint G memo(Card) ile zincir tamamlandı |
| `onRefresh` → `useCallback([load])` | bookings.tsx | RefreshControl stable prop |
| Modal `onClose`/`onSubmit` → `useCallback` | bookings.tsx | Her render yeni ref önlendi |

**Not:** `renderItem useCallback` + `Card memo` birlikte çalışmalı — Sprint G + H tamamlanınca FlatList optimize zinciri tam.

---

## 8 Mayıs 2026 — Sprint K Performans (commit 11bf3be)

### Sprint K — auth/index.tsx CountryPicker optimizasyonu

| Fix | Dosya | Etki |
|-----|-------|------|
| `CountryPicker` → `memo()` | auth/index.tsx | AuthScreen state değişiminde gereksiz render önlendi |
| `filtered` → `useMemo([search])` | auth/index.tsx | Her tuş vuruşunda tüm liste yeniden filtrelenmez |
| `handleClose` + `handleSelect` → `useCallback` | auth/index.tsx | Stable prop referansları |
| `renderItem` → `useCallback([selected, handleSelect])` | auth/index.tsx | FlatList memo zinciri tamamlandı |
| `keyExtractor={(_,i)=>String(i)}` → `c=>c.code` | auth/index.tsx | Index key kaldırıldı, kararlı key kullanılıyor |

**Perf-scout (8 Mayıs 2026) bulguları:**
- `salon.tsx` 🔴: 14 handler memoize değil, TimePicker FlatList inline renderItem — düşük öncelik (form ekranı)
- `auth/index.tsx` 🟡: CountryPicker → Sprint K ile çözüldü ✅
- `settings.tsx` 🟢, `onboarding.tsx` 🟢: kritik sorun yok

---

## 5 Mayıs 2026 — Sprint J Performans (commit 1b24342)

### Sprint J — MapShopSheet memo + useMemo + default fallback

| Fix | Dosya | Etki |
|-----|-------|------|
| `MapShopSheet` → `memo()` | MapShopSheet.tsx | Parent state değişimlerinde (filter, mapRegion, googlePlaces) yeniden render önlendi |
| `days` → `useMemo([shop?.working_hours, shop?.source])` | MapShopSheet.tsx | Salon değişince yeniden hesaplanır |
| `selDay` → `useMemo([days, date])` | MapShopSheet.tsx | Tarih seçilince güncellenir |
| `slots` → `useMemo([date, selDay])` | MapShopSheet.tsx | Slot filtresi + "bugün" kontrolü memoized |
| `useMemo`'lar hook guard'dan önce taşındı | MapShopSheet.tsx | React hooks kuralına uygun (optional chaining ile) |
| `\|\|'berber'` → `\|\|'default'` + `SALON_TYPES.default` | MapShopSheet.tsx | Sprint D tutarlılığı sağlandı |

---

## 5 Mayıs 2026 — Sprint I Performans (commit 07a77ed)

### Sprint I — renderItem useCallback + barber derived data useMemo

| Fix | Dosya | Etki |
|-----|-------|------|
| `renderItem` → `useCallback([handleShopPress])` | customer/index.tsx | ShopCard memo zinciri tamamlandı (Sprint B'den beri eksikti) |
| `onRefresh` → `useCallback([])` | customer/index.tsx | Inline async fn kaldırıldı |
| `today` → `useMemo([])` | barber/index.tsx | Her render'da new Date() çağrısı önlendi |
| `pending/changeRequests/pendingDisplay/todayB/confirmed/revenue/displayed` → `useMemo` | barber/index.tsx | 7 türetilmiş veri memoized |
| `renderItem` → `useCallback` | barber/index.tsx | BookingCard memo zinciri tamamlandı (Sprint A'dan beri eksikti) |
| `onRefresh` → `useCallback([loadBookings])` | barber/index.tsx | Inline async fn kaldırıldı |

**Kritik Bulgu:** Sprint A'da `BookingCard = memo()`, Sprint B'de tüm handler `useCallback` zinciri kuruldu — ama `renderItem` inline kaldığı için memo **4 sprint boyunca hiç çalışmamıştı**. Sprint I ile düzeldi.

---

## 5 Mayıs 2026 — DB Güvenlik + Sprint A Performans (commit 4b2001f, ffcd413)

### DB Güvenlik & Performans İyileştirmeleri (commit 4b2001f)

MCP Supabase araçlarıyla DB incelemesi yapıldı. 4 migration apply edildi.

| Migration | İçerik |
|-----------|--------|
| `20260504175821_add_missing_fk_indexes.sql` | 8 FK index: bookings(service_id, specialist_id), specialists(shop_id), waitlist(3), expenses(shop_id), loyalty_stamps(shop_id) |
| `20260504175837_fix_security_definer_and_search_path.sql` | 14 fonksiyon: `SET search_path = public` eklendi (SECURITY DEFINER fonksiyonlarda güvenlik açığıydı) |
| `20260504175937_revoke_public_security_definer_functions.sql` | REVOKE FROM PUBLIC + seçici GRANT: accept_alternative/delete_own_account → authenticated; get_taken_slots → anon+authenticated |
| `20260504180046_revoke_authenticated_system_functions.sql` | Trigger/cron fonksiyonları authenticated rolünden revoke edildi |

### Yeni Agents & Skills

| Tip | Ad | Amaç |
|-----|-----|------|
| Agent | `zeynep-reviewer` | UI/UX Zeynep personası denetimi (renk, metin, ikon, filtre) |
| Agent | `ts-guardian` | TypeScript hata analizi ve gruplama |
| Agent | `edge-function-dev` | Deno Edge Function uzmanı, güvenlik kuralları |
| Agent | `perf-scout` | React Native performans tarayıcısı |
| Skill | `zeynep-audit` | Ekranı Zeynep gözüyle denetler |
| Skill | `ts-fix` | tsc --noEmit → sıfır hataya ulaş |
| Skill | `devlog-update` | DEVLOG.md oturum kaydı |

### Performans Review — Tespit Edilen Sorunlar (18 kritik)

| # | Sorun | Dosya |
|---|-------|-------|
| P-R01 | `BookingCard` DashboardScreen içinde tanımlı → her render'da yeni referans, FlatList tüm item'ları remount ediyor | barber/index.tsx |
| P-R02 | Realtime merge'de `specialists` alanı kayboluyor | barber/index.tsx |
| P-R03 | `useEffect` dep `[]` — userId değişince realtime yeniden subscribe etmiyor | customer/bookings.tsx |
| P-R04 | `useEffect` dep `[]` — shop değişince servis/uzman listesi yenilenmiyor | barber/salon.tsx |
| P-R05 | Filtre sırası: Kuaför önce, Güzellik sonra (Zeynep personasına ters) | constants.tsx |
| P-R06 | Onboarding tagline: "Berber, kuaför..." (Zeynep personasına ters) | onboarding.tsx |

### Sprint A Fix'leri (commit ffcd413)

| Fix | Dosya | Etki |
|-----|-------|------|
| `BookingCard` → module scope + `memo()` | barber/index.tsx | FlatList gereksiz remount önlendi |
| Realtime merge: `specialists` korunuyor | barber/index.tsx | Uzman bilgisi kaybolmaz |
| `useEffect` dep `[userId]` | customer/bookings.tsx | Realtime userId değişince yeniden subscribe eder |
| `useEffect` dep `[shop.id]` | barber/salon.tsx | Shop değişince liste yenilenir |
| Filtre sırası: Güzellik > Kuaför > Berber | constants.tsx | Zeynep önceliği |
| Tagline: "Kuaför, güzellik..." | onboarding.tsx | Zeynep personası |

**Sprint B (sıradaki):** `useCallback` eksik handler'lar, `mapViewJSX` inline fix, 15+ state → `useReducer`, onboarding sıcak renk, mekanik mesaj tonu.

---

## 7 Nisan 2026 — Sızma Testi Round-2 (commit af186d3)

Önceki round'da (commit 2b26e73) 5 bulgu kapatılmıştı. Bu round'da kod tabanı yeniden incelendi; 6 yeni bulgu tespit edilip kapatıldı.

### Bulgular ve Düzeltmeler

| Bulgu | Seviye | Dosya | Düzeltme |
|-------|--------|-------|----------|
| `supabase.ts` hardcoded secret | CRITICAL | `supabase.ts` | `expo-constants` üzerinden `lib/constants` import |
| Privilege escalation (musteri→berber) | HIGH | DB migration | `prevent_role_change` BEFORE UPDATE trigger |
| Review comment prompt injection | HIGH | `functions/review-summary` | `r.comment` sanitize + 300 char limit |
| `places-nearby` input validation yok | MEDIUM | `functions/places-nearby` | lat/lng range + radius clamp (100-5000) |
| `whatsapp-notify` message sınırsız | MEDIUM | `functions/whatsapp-notify` | `message.length > 1000` kontrolü |
| `app.config.js` hardcoded fallback | LOW | `app.config.js` | `\|\|` fallback kaldırıldı, env-only |

### Kümülatif Güvenlik Skoru (R1 + R2)
- **11 toplam bulgu** tespit edildi ve kapatıldı (R1: 5, R2: 6)
- Kalan bilinen açık: **0 CRITICAL / 0 HIGH / 0 MEDIUM**
- L2 (test credentials CLAUDE.md) → lansman sonrası temizlenecek

---

## Sprint 19 — 2 Nisan 2026

### Zeynep Personası UI Güncellemeleri

#### Değişiklikler
1. **Renk paleti** (`lib/constants.tsx`): Zeynep personasına uygun güncellendi — altın accent, soft mor, parlak gül, taupe muted.
2. **SALON_TYPES**: Gradient ve `pinColor` renkleri güncellendi.
3. **FILTERS sırası**: Kuaför ve Güzellik öne alındı, Berber sona taşındı (hedef kitle kadın kullanıcı).
4. **CHANGE_REQUEST_REASONS**: `'Trafik / Geç kalacağım'` seçeneği eklendi.
5. **index.tsx**: 'Salon Keşfet' → 'Sana Yakın Salonlar', arama placeholder güncellendi.
6. **auth/index.tsx**: Tagline 'KUAFÖR · GÜZELLİK · RANDEVU' olarak güncellendi.
7. **store.config.json**: Play Store başlık ve açıklaması kuaför/güzellik odaklı yapıldı.

### Simplify Refactor (`1e8fc90`)

- **`fmtTime()`** helpers.ts'e eklendi; `fmtDate()` imzası `string|null|undefined` yapıldı
- **`(t||'').slice(0,5)`** → `fmtTime(t)` (bookings.tsx 8 yer, _layout.tsx 2 yer)
- **`STATUS` sabiti** BookingsScreen render dışına çıkarıldı (her render'da yeniden oluşturuluyordu)
- **`bannerColor/bannerBg`** tekrar hesaplamadan kurtarıldı → `BANNER_THEME` lookup objesi
- **`registerPushToken` çift çağrı** önlendi (`useRef` guard — ilk girişte 2x Supabase UPDATE gidiyordu)
- **`inp/lbl` inline style** → `StyleSheet.create` (auth/index.tsx)
- **`settings.tsx, bookings.tsx`** `session: any` → `Session` tipi

### TypeScript — Sıfır Hata (`aa173cf`)

**Önceki durum:** ~180 hata (fontWeight, never[], unknown catch, implicit any, NotificationBehavior)
**Sonuç:** `npx tsc --noEmit` → 0 hata, exit code 0

Düzeltilen kategoriler:
- `useState([])` → `useState<T[]>([])` tiplendi (bookings, services, photos, reviews, shops...)
- `useState(null)` → `useState<Session | null>(null)` tiplendi (5 dosya)
- `catch(e)` → `catch(e: any)` (25 yer)
- `fontWeight: string` → `'700' as const` literal tip
- Component prop destructuring tipleri eklendi (15+ bileşen)
- `NotificationBehavior`: `shouldShowBanner`, `shouldShowList` eklendi
- `SALON_TYPES`, `WH_DEFAULT`, `DAY_NAMES` → `Record<string, ...>` index signature
- `router.replace/push` → Expo Router uyumu için `as any`

### DB Temizliği (2 Nisan 2026)

- **Silindi:** `reviews` tablosundaki URL-encoded test yorumu (`Cok%20iyi%20hizmetvCok%20iyi%20hizmet`) — `id: c30f8aed`
- **Temizlendi:** `Mehmet,s` salonunun test Instagram URL'i (`https://instagram.com/nevaapp.co`) → NULL yapıldı

### Expo Go Mock Düzeltmeleri

#### Değişiklikler
1. **`lib/ads-mock.js`** eklendi: `ads-mock.ts` (TypeScript) → CommonJS `.js` versiyonuna dönüştürüldü. Metro alias'ları `.ts` modülleri CommonJS olarak resolve etmekte sorun yaşıyordu.
2. **`lib/notifications-mock.js`** eklendi: `expo-notifications` Expo Go'da çalışmıyor (SDK 53+ native build gerektirir). Metro'da mock'a yönlendiriliyor.
3. **`metro.config.js`** güncellendi: `expo-notifications` → `notifications-mock.js`, `react-native-google-mobile-ads` → `ads-mock.js` route eklendi.
4. **`app/(customer)/index.tsx`**: Import `../../lib/ads-mock` → `../../lib/ads-mock.js` (explicit extension).
5. **`.gitignore`**: `*.apk` ve `*.aab` eklendi (build artifact'ları repo'ya girmesin).

---

## Sprint 18 — 1 Nisan 2026

### Manuel Test Oturumu — Bölüm 2-3, 7, 8 (ADB Headless)

#### Bug Fix'ler
1. **`avg_rating` trigger SECURITY DEFINER** (`supabase`): `update_shop_rating()` RLS aktif `reviews` tablosuna erişince SELECT COUNT=0 dönüyordu. `SECURITY DEFINER` eklendi + mevcut veriler düzeltildi (Mehmet,s: avg=5.0, count=2).
2. **Hizmet listesi boş** (`app/(barber)/salon.tsx:147`): `services` tablosunda `created_at` kolonu yok; `.order('created_at')` query'i fail ediyor, data=null → "Henüz hizmet eklenmedi". `.order()` kaldırıldı.

#### Test Sonuçları
| # | Test | Sonuç |
|---|------|-------|
| 2.3-2.8 | Filtreler + sıralama | ✅ |
| 3.1, 3.3-3.7, 3.5c | Salon profili | ✅ |
| 7.1-7.9 | Berber panel tümü | ✅ |
| 8.1, 8.2, 8.5-8.8 | Salonum edit | ✅ |
| 8.3, 8.4 | Fotoğraf yükleme | ⚠️ file picker gerekli — manuel test |

#### DB Temizlenecek
- Mehmet,s Instagram URL: test değeri — gerçek URL girilmeli veya null yapılmalı
- reviews: URL-encoded test yorumu (`Cok%20iyi%20hizmetvCok%20iyi%20hizmet`) — silinecek

---

## Sprint 17 — 31 Mart 2026

### Manuel Test Oturumu — Bölüm 1, 2, 5

#### Test Sonuçları
| # | Test | Sonuç |
|---|------|-------|
| 1.1 | Müşteri girişi | ✅ |
| 1.3 | Yanlış şifre → hata mesajı | ✅ |
| 2.2 | Harita görünümü + pinler | ✅ |
| 2.9 | Harita pini tıklama → salon kartı | ✅ |
| 5.6 | "Değerlendirme Yaz" butonu — geçmiş confirmed randevuda görünür | ✅ |
| 5.7 | Yorum yaz (5 yıldız) + gönder → modal kapanır, DB'ye kaydedilir | ✅ |

#### Teknik Notlar
- `expo-keep-awake` hatası: "Unable to activate keep awake" — kritik değil, uygulama çalışmaya devam ediyor
- `SafeAreaView` deprecation uyarısı — kritik değil, bölünmüş uygulama için geçerli
- ReviewModal yıldız koordinatları UI automator dump ile bulundu (SVG element — text yok)
- Yorum metni `adb input text` URL encoding sorunu — test geçti, DB'deki test yorumu temizlenecek

#### Bekleyen Test
- Bölüm 2: filtreler (2.4-2.8), liste/harita geçiş (2.3)
- Bölüm 3: Salon profili
- Bölüm 4: Randevu alma
- Bölüm 5: 5.1-5.5
- Bölüm 6: Ayarlar
- Bölüm 7: Berber paneli
- Bölüm 8-10

---

## Sprint 14 — 30 Mart 2026

### Salon Claim Sistemi

**Amaç:** Google Places haritasındaki salonları sahiplenme başvurusu + suistimal koruması

#### DB Migration (`20260330_claim_requests.sql`) — Canlıya Uygulandı
- `barber_shops.google_place_id TEXT UNIQUE` kolonu eklendi
- `claim_requests` tablosu: user_id, google_place_id, place_name/address/phone/type, status
- `trg_claim_rate_limit` — günde max 3 başvuru
- `trg_prevent_multi_shop` — 1 kullanıcı = 1 salon
- `trg_auto_register_on_claim_approval` — admin status='approved' yaparsa barber_shops otomatik oluşur

#### Harita Filtresi (`app/(customer)/index.tsx`)
- Claim edilmiş Google salonları artık gri pin listesinden gizlenir
- `claimedGoogleIds` set'i ile `visibleGooglePlaces` hesaplanır

#### "Kayıt Ol" Butonu (`app/(customer)/index.tsx`)
- Butona `onPress` bağlandı — `claim_requests` tablosuna insert
- Loading state (`claimingShop`) + AlertUI feedback
- Tekrar başvuru: unique constraint → "Zaten başvurdunuz" mesajı
- Giriş yapmadan tıklama: "Giriş gerekli" mesajı

#### Admin Akışı (kod gerektirmez)
- Supabase Studio → `claim_requests` tablosu → `status = 'approved'` → trigger salon oluşturur
- Kullanıcı berber panelini açınca EditShopScreen'e düşer, bilgileri tamamlar

### Commit
`3fb7486` — feat: salon claim — başvuru sistemi, suistimal koruması ve harita filtresi

---

## Sprint 13 — 29 Mart 2026

### Lotus Animasyonu Tamamlandı
- `NevaSymbol.tsx` — Lotus bloom sırası düzeltildi: tomurcuk → yan yapraklar yatay → üst yaprak yükseliş
- `_layout.tsx` — Ring animasyonu: `out(cubic)`, her halka farklı süre (r1=7s / r4=11.2s), su hareketi ilüzyonu
- Splash timing: textDelay gerçek bloom süresine bağlandı, okuma süresi eklendi (isFirst 9.2s / returning 6.2s)

### Lansman Varlıkları Oluşturuldu
- `assets/feature-graphic.png` (1024×500) — Play Store feature graphic
- `assets/privacy-policy.html` — KVKK uyumlu gizlilik politikası
- `assets/images/icon.png` (1024×1024) + adaptive icon seti — lotus sembolü
- `store.config.json` — Türkçe store listing + privacyPolicyUrl
- Supabase: 4 Bursa salonu + 19 hizmet eklendi (Özgür Berber, Nilüfer Kuaför, Altın Makas, Glow Güzellik)

### GitHub Pages — Gizlilik Politikası
- `github.com/mehmetertekinbusiness-stack/neva-legal` oluşturuldu
- Custom domain yapılandırıldı: `legal.nevaapp.co` (DNS kaydı 7 Nisan'da eklenecek)

### Tam Kod Denetimi + Düzeltmeler
- **Splash performans:** `preventAutoHideAsync` + `hideAsync` eklendi, beyaz flash → koyu (`#0E0F1C`)
- **Paralel init:** AsyncStorage + getSession artık paralel çalışıyor, `isFirst=null` kara ekran yok
- **Dead code:** `role==='barber'` kontrolü kaldırıldı (DB'de sadece `'berber'` var)
- **Production log'ları:** `console.warn` → `__DEV__` guard (3 yer)
- **GitHub repo:** `BarberApp` → `neva` olarak yeniden adlandırıldı
- **Git remote:** güncellendi
- **`supabase/config.toml`:** `project_id = "BarberApp"` → `"neva"`
- **`eas.json`:** `account: "nevaapp"` eklendi
- **DB index'leri:** 6 performance index eklendi (bookings, barber_shops, services, reviews, shop_photos)
- **`photo_url`:** Deprecated kolon kaldırıldı
- **`PROJE_NOTALARI.md`:** `berberimgzililikpolitikasi` URL → `legal.nevaapp.co`

### Commit
`(bu oturum)` — feat: Lansman hazırlığı + lotus animasyon + lotus ikon + kod denetimi

---

## Sprint 19 — 28 Mart 2026

### Manuel Test Tamamlandı

Kalan 8 test senaryosu tamamlandı. Yöntem: kod inceleme + Supabase API + cihaz.

| Test | Sonuç |
|------|-------|
| 4.4 Geçmiş saat | ⚠️ Gizleniyor (disabled değil) — tasarım tercihi, bloker değil |
| 4.5 Dolu slot | ✅ |
| 4.7 Aynı gün tekrar randevu | ✅ DB unique constraint |
| 5.7 Yorum / tekrar yazılamaz | ✅ + avg_rating trigger |
| 7.9 Berber confirmed iptal | ✅ |
| 8.2 Salon bilgileri güncelle | ✅ (eklendi) |
| 8.5 Hizmet ekle | ✅ (eklendi) |
| 8.6 Hizmet sil | ✅ (eklendi) |

### Kod Değişikliği — `app/(barber)/salon.tsx`

`EditShopScreen`'de eksik olan 3 özellik eklendi:
- **Salon Bilgileri bölümü**: ad, adres, bio alanları + "Bilgileri Kaydet" butonu
- **Hizmetler bölümü**: mevcut hizmetler listesi, her birinin yanında silme (−) butonu
- **Yeni hizmet formu**: ad / fiyat / dakika alanları + "Hizmet Ekle" butonu

### Supabase DB Review

Tüm migration'lar incelendi. Notlar → `PLATFORM_NOTALARI.md#db-review-28-mart`.

---

## Teknik Bilgiler

**Stack:**
- React Native + Expo SDK 54 (Managed Workflow)
- Supabase (auth + database + realtime + storage + edge functions)
- Google Maps + Google Places API
- Twilio WhatsApp Business API
- AdMob (react-native-google-mobile-ads)
- EAS Build (Play Store build)

**Bağlantılar:**
- GitHub: https://github.com/mehmetertekinbusiness-stack/Neva
- Supabase: https://lseuuyjomkalddijicta.supabase.co
- Domain: nevaapp.co
- AdMob App ID: ca-app-pub-9932402430410890~6788196470

**DB Tabloları:** users, barber_shops, services, bookings, shop_photos

**Test hesapları:**
- Müşteri: musteri@nevaapp.co / neva2026
- Berber: berber@nevaapp.co / neva2026

---

## Sprint Geçmişi

### ✅ Sprint 1 — Türkçe Arayüz
- Tüm uygulama Türkçe'ye çevrildi
- Günaydın / İyi günler / İyi akşamlar selamlama

### ✅ Sprint 2 — Gerçek Zamanlı Müsaitlik
- Tarih/saat seçici (7 günlük ileriye)
- Dolu slotların gerçek zamanlı gösterimi
- Hizmet bazlı süre hesabı (duration_mins)

### ✅ Sprint 3 — WhatsApp Bildirimleri
- Twilio WhatsApp Business API entegrasyonu
- Supabase Edge Function: whatsapp-notify
- Randevu onay/red/iptal bildirimleri

### ✅ Sprint 4 — Ayarlar ve Gizlilik
- Hesap silme butonu
- Gizlilik politikası sayfası
- Çıkış yapma

### ✅ Sprint 5 — Premium Berber Paneli
- Büyük Onayla / Reddet butonları
- Reddetme sebebi seçimi (5 sebep)
- Alternatif saat teklifi

### ✅ Sprint 6 — Fotoğraf Galerisi & Sosyal Medya
- Kapak fotoğrafı yükleme
- Galeri (max 20 fotoğraf)
- Instagram / TikTok / Facebook link alanları

### ✅ Sprint 7 — Supabase Realtime
- Anlık randevu bildirimleri (berber paneli)
- Reddetme sebebi + alternatif saat teklifi

### ✅ Sprint 8 — Harita/Liste Toggle
- Google Maps harita görünümü
- Liste görünümü toggle
- Harita pinleri (salon türüne göre renkli)

### ✅ Sprint 9 — Google Places API
- Kayıtsız salonlar haritada görünüyor
- Supabase Edge Function: places-nearby
- WhatsApp butonu kayıtsız salonlar için
- Cinsiyet bazlı akıllı filtre

### ✅ Sprint 10 — Push Bildirimi & Harita Pin Fotoğrafları
- expo-notifications entegrasyonu
- Müşteri push bildirimi altyapısı
- Harita pin fotoğrafı düzeltmeleri
- Kullanıcı push token kaydı (Supabase)

### ✅ Sprint 11 — Çalışma Saatleri & AdMob
- Çalışma saatleri yönetimi (berber paneli)
- AdMob interstitial reklam (randevu başarı ekranı)
- Mehmet ERTEKİN tarafından tamamlandı

### ✅ Sprint 12 — Zeynep Güncellemesi (Tasarım)
- Salon kartı fotoğraf yüksekliği 140 → 200px
- Fiyat formatı: `₺X'den / başlayan`
- Fotoğrafsız salonlar liste sonuna itiliyor
- `sortBy` state + En Yakın / En Çok Puanlanan toggle
- Profil sayfası: Galeri bölümü Bio'dan önce
- Berber paneli: kapak fotoğrafı yoksa turuncu uyarı banner'ı
- DB: `push_token` kolonu `public.users` tablosuna eklendi
- DB: `working_hours` kolonu `barber_shops` tablosuna eklendi (JSONB)

### ✅ Sprint 14 — Değişiklik Talebi Akışı & Push Bildirim Altyapısı
- Mimari refactor: (tabs) → (auth)/(customer)/(barber) ayrımı
- Firebase FCM altyapısı (EAS secrets)
- Müşteri: değişiklik talep modalı + başarı ekranı
- Berber: değişiklik talepleri Bekleyen sekmesinde, turuncu border + DEĞİŞİKLİK etiketi
- Değişiklik kabul/red + müşteriye push bildirim

### 🔄 Sprint 20 — Müzakere Akışı Bug Fix + Tasarım Yenileme (26 Mart 2026)

**Commits:** e8455ee → 833c25a → af95a70 → a7abec2 (branch: dev/neva-sprint)

**Bug fix'ler (af95a70) — 7 kök neden:**
1. `_layout.tsx`: Berber banner öncelik — `n.change_request_date` önce kontrol edilmeli (karşı teklif vs kabul)
2. `bookings.tsx`: Upcoming filtre — `cancelled && change_request_date >= today` koşulu eklendi
3. `bookings.tsx`: `submitChangeRequest` hata yönetimi — sessiz `console.error` → `Alert.alert`
4. `(barber)/index.tsx`: `rejectBooking` — `alternative_date` her zaman set edilmeli (null da olsa)
5. `(barber)/index.tsx`: `changeRequests` filtresi — sadece `confirmed` değil, tüm `change_request_date` olanlar
6. `(barber)/index.tsx`: `hasChangeReq` — `isConfirmed &&` koşulu kaldırıldı (cancelled da çalışmalı)
7. `(barber)/index.tsx`: `acceptChange` — `status:'confirmed', cancelled_by:null` eklendi

**Tasarım (a7abec2):**
- **Splash — Glow Portal:** bg `#0B0D1A`, pulse halkaları (2 staggered cycle), `Scissors 52px` merkez daire, NEVA `56px/900w`, divider 48px, `SALON · RANDEVU` letterSpacing 5
- **Harita kartı — Photo Overlay:** 160px foto alanı, 3-katmanlı gradient simülasyonu (rgba 0.08/0.22/0.52), salon adı + NEVA badge + adres + rating foto üstünde, floating close button (28px daire)
- `Sparkle` / `Flower` import temizlendi

**DB:** Tüm migration'lar önceki oturumda uygulandı — bu oturumda DB değişikliği yok

**Dev build:** EAS `3a77a770` — ✅ TAMAMLANDI 26.03.2026, APK: ~/Downloads/neva-dev-20260326.apk

---

### ✅ Sprint 19 — İptal Bildirimleri & Global Banner Kişiselleştirme (25 Mart 2026)

- **DB:** `bookings.cancelled_by` kolonu eklendi (`'customer'` | `'barber'`) — kimin iptal ettiği takip edilir
- **DB:** `bookings` tablosu `REPLICA IDENTITY FULL` yapıldı + `supabase_realtime` publication'a eklendi → Realtime filter'ların UPDATE/DELETE'de çalışması garanti altına alındı
- **Berber tarafı global banner** — `_layout.tsx`'e `shopId` bazlı Realtime listener eklendi; müşteri iptal ettiğinde berbere "❌ Randevu İptal Edildi · [Müşteri Adı]" banner'ı gösterilir
- **Müşteri iptali:** `cancelled_by:'customer'` set edilir; berber push token'ı alınarak bildirim gönderilir (müşteri adıyla)
- **Berber reddi:** `cancelled_by:'barber'` set edilir
- **Berber tarafı Realtime:** `filter` parametresi kaldırıldı → REPLICA IDENTITY FULL + JS-side shop_id filtresi (daha güvenilir)
- **Global banner kişiselleştirme:** Tüm müşteri banner mesajları salon adıyla kişiselleştirildi (ör. "Neva Salonu randevunuzu onayladı")
- **Test:** `node scripts/test.mjs` → 56/61 geçti · 0 başarısız · 5 atlandı

### ✅ 24 Mart 2026 — Müzakere Akışı + Onboarding + Güvenlik

- **Global randevu bildirim sistemi** — Realtime dinleyici `_layout.tsx`'e taşındı (her ekranda çalışır)
- **Müşteri iptal akışı** — `confirmed` randevular iptal edilebilir; "Salon bilgilendirilecektir" uyarısı
- **Berber push bildirimi** — Müşteri iptalinde berber token alınarak bildirim gönderilir
- **Test suite genişletildi** — 16. bölüm: Müzakere (masa tenisi) A–F5 arası 16 senaryo
- **E-posta doğrulaması zorunlu** — `verify-email.tsx`, `_layout.tsx` navigate koruması, OAuth hariç
- **Premium splash screen** — Spring → Easing.out(Easing.cubic), daire + border ring, ambient orb'lar
- **Onboarding** — 3 slaytlı ilk açılış ekranı (AsyncStorage kontrolü)

### ✅ Play Store Hazırlığı & Bug Fixes (22 Mart 2026)
- **Google Maps API key** → EAS Secrets'a taşındı, app.config.js'den hardcoded key kaldırıldı
- **expo-build-properties** eklendi — android largeHeap: true
- **TransactionTooLargeException fix** — `android:saveEnabled=false` config plugin (withDisableSavedState)
- **android:launchMode=singleTask** — linking uyarısını engeller
- **Auth navigation loop fix** — useRef ile aynı hedefe tekrar navigate engellendi
- **Loading screen fix** — Stack her zaman render edilir, splash screen overlay olarak biner
- **Güvenlik timer** — 8 saniyede zorla geç (getSession hang durumunda)
- **Animasyonlu splash ekranı** — Scissors/Sparkle/Flower stagger animasyon, min 2sn gösterim
- **Play Console listing içeriği** hazırlandı (Türkçe açıklamalar, kategori, content rating)
- **Landing page** — `landing/` klasöründe HTML/CSS/gizlilik hazır (nevaapp.co için)
- **Dev build:** `d5e4399b` — tüm native fix'lerle çalışıyor
- **Production build:** `728ec557` — tamamlandı (bazı fix'ler eksik, yeni build gerekecek)

### ✅ Sprint 17 — WhatsApp Randevu Hatırlatma
- **DB:** `bookings.reminder_sent` boolean kolonu eklendi
- **pg_cron + pg_net** extension'ları etkinleştirildi
- **DB Fonksiyonu:** `send_appointment_reminders()` — önümüzdeki 1-3 saat içindeki confirmed randevuları bulur, müşteriye WhatsApp gönderir, `reminder_sent = true` set eder
- **Cron job:** `whatsapp-appointment-reminders` — her saat başı 06:00-23:00 TR saatinde çalışır (`0 3-20 * * *` UTC)
- Mevcut `whatsapp-notify` Edge Function kullanılıyor (yeni Edge Function gereksiz)
- Mesaj: salon adı, hizmet, saat + iptal yönlendirmesi
- Migration: `supabase/migrations/20260323_whatsapp_reminder.sql`

### ✅ Sprint 16 — Yorum/Puanlama + Çalışma Saatleri + Geri Bildirim
- **DB:** `reviews` tablosu oluşturuldu — booking_id UNIQUE, RLS (SELECT herkese, INSERT randevu sahibine geçmiş confirmed için)
- **DB:** `barber_shops` tablosuna `avg_rating` / `review_count` kolonu eklendi (trigger ile güncellenir)
- **Trigger:** `update_shop_rating()` — reviews INSERT/DELETE sonrası avg_rating cache güncellenir
- **Migration:** `supabase/migrations/20260322_sprint16_reviews.sql`
- **Müşteri — Salon listesi:** Açık/Kapalı badge (`isOpenNow` ile dinamik), `avg_rating` / `review_count` gösterimi
- **Müşteri — Salon profili:** Bugünün çalışma saatleri + Açık/Kapalı badge, tüm haftalık saatler, müşteri yorumları listesi
- **Müşteri — Randevularım:** Geçmiş confirmed randevulara "Değerlendirme Yaz" butonu, `ReviewModal` (1-5 yıldız + yorum)
- **Müşteri — Ayarlar:** DESTEK bölümü eklendi → "Geri Bildirim Gönder" butonu (WhatsApp'a yönlendirir)
- **helpers.ts:** `isOpenNow(wh)` fonksiyonu eklendi

### ✅ Sprint 15 — Güvenlik & Test Altyapısı
- **Bağımsız test scripti:** `scripts/test.mjs` — 36 senaryo, UI'sız çalışır, 29/36 geçiyor
- **DB güvenlik kısıtlamaları:**
  - Aynı müşteri aynı salon aynı gün duplicate randevu engeli (unique index)
  - Geçmiş tarihe randevu engeli (trigger)
  - Müşteri status escalation engeli (trigger)
- **Değişiklik talebi iyileştirmeleri:**
  - Müşteri mazeret seçmeden talep gönderemiyor (CHANGE_REQUEST_REASONS)
  - Berber değişikliği reddederken alternatif tarih/saat teklif edebiliyor
  - DB kolonları eklendi: `change_request_reason`
  - RLS politikaları güncellendi: müşteri change_request kolonlarını güncelleyebilir
- **UX:**
  - Berber girişinde ana ekran flash'ı giderildi
  - Müşteri ekranı Realtime subscription (berber kabulü/reddi anında yansır)
  - Berber onaylı randevuyu değişiklik bekliyorken de iptal edebilir
- **users tablosu RLS:** müşteriler birbirinin profilini göremez
- **DB erişim altyapısı:** `scripts/db.mjs` — Supabase Management API üzerinden SQL çalıştırma
- **Migration geçmişi:** `supabase/migrations/` — tüm şema değişiklikleri versiyonlandı

### ✅ Sprint 13 — Bug Fix & UX İyileştirmeleri
- Geçmiş saat slotları filtrelendi (bugün seçiliyse +30 dk buffer)
- Alternatif saat teklifi: tarih seçici pill'e çevrildi (bugün dahil 7 gün)
- Alternatif saat teklifi: çalışma saatleri + güncel saat filtresi
- Alternatif saat teklifi: dolu slotlar çizgili/pasif gösterimi
- Reddet modalı: sebep seçilmeden buton disabled + yönlendirici uyarı
- Berber girişinde otomatik panel sekmesine yönlendirme (role === 'berber')
- `AD_UNIT_ID` → `INTERSTITIAL_ID` typo düzeltmesi
- `TIME_OPTS` duplicate `23:00` temizlendi

---

## Play Store Hazırlığı (Mart 2026)

### Tamamlanan
- ✅ eas.json oluşturuldu
- ✅ Bundle ID: `co.nevaapp.neva`
- ✅ Android package: `co.nevaapp.neva`
- ✅ versionCode: 1 / buildNumber: "1"
- ✅ Android permissions tanımlandı
- ✅ expo-notifications plugin eklendi
- ✅ AdMob Banner (salon listesi altı) — ca-app-pub-9932402430410890/4162033135
- ✅ AdMob Interstitial (randevu sonrası) — ca-app-pub-9932402430410890/9222788120
- ✅ Uygulama adı "Neva" olarak güncellendi (slug: "neva")
- ✅ EAS login + production build alındı
- ✅ Supabase RLS politikaları eklendi (barber_shops, bookings, shop_photos, services)
- ✅ Rate limiting trigger eklendi (bookings — saatte max 10 randevu)

### Bekleyen
- ⬜ Google Maps API key → EAS Secrets'a taşı
- ⬜ Play Store ekran görüntüleri (min. 2, önerilen 8)
- ⬜ Türkçe uygulama açıklaması hazır — Play Store Console'a girilecek
- ⬜ Production build test et (cihazda)
- ⬜ Play Store Console'a yükle

---

## Güvenlik (Mart 2026)

### Tamamlanan
- ✅ barber_shops RLS — sadece sahibi güncelleyebilir/silebilir
- ✅ bookings RLS — müşteri/berber yetki ayrımı
- ✅ shop_photos RLS — sadece salon sahibi ekleyebilir/silebilir
- ✅ services RLS — sadece salon sahibi yönetebilir
- ✅ Booking rate limit trigger — saatte max 10 randevu talebi

### Tamamlanan (22 Mart 2026 eklendi)
- ✅ users tablosu RLS — müşteriler birbirinin profilini göremez (ALTER TABLE users ENABLE ROW LEVEL SECURITY + policy)

### Bekleyen (Lansman Sonrası)
- ⬜ Edge Function JWT auth (whatsapp-notify, places-nearby)
- ⬜ WhatsApp spam koruması (rate limiting)
- ⬜ Input validation — fiyat alanları (negatif değer engeli)
- ⬜ Google Maps API key → EAS Secrets
- ⬜ Server-side slot çakışma kontrolü

---

## Backlog (Lansman Sonrası)

Öncelik sırasına göre:

### 🔴 Yüksek Öncelik

**1. Çoklu Uzman / Masa Desteği**
- Salon sahipleri uzman/koltuk/masa ekleyebilmeli (isim, fotoğraf)
- Randevu alımında müşteri uzman seçebilmeli (ya da "farketmez")
- Aynı saat diliminde birden fazla uzman varsa paralel randevu alınabilmeli
- DB: `staff` tablosu (shop_id, name, photo_url, active) + `bookings.staff_id` kolonu
- Slot hesabı uzman bazlı yapılmalı (mevcut shop bazlı yerine)

**2. ✅ Randevu Hatırlatma WhatsApp Mesajı** — Tamamlandı (Sprint 17)

### 🟡 Orta Öncelik

**3. Sosyal Giriş (Google / Facebook OAuth)**
- Supabase Auth OAuth provider olarak Google ve Facebook desteği
- Kayıt olmadan tek tıkla giriş — müşteri edinim sürtünmesini azaltır
- Expo AuthSession ile implemente edilebilir
- Mevcut email/şifre akışı korunmalı, sosyal giriş ek seçenek olarak eklenmeli
- phone_number alanı ilk girişte isteğe bağlı tamamlatılabilir (WhatsApp için)

**4. Hazır Hizmet Şablonları**
- Kuaför/berber/güzellik salonu kategorilerine göre önceden tanımlı hizmet listesi
- Salon kaydı sırasında "Şablondan Ekle" seçeneği
- Örnek şablonlar:
  - Berber: Saç Kesimi, Sakal Tıraşı, Fön, Boya, Keratin
  - Güzellik: Manikür, Pedikür, Kalıcı Oje, Kirpik, Kaş Tasarımı
  - Kuaför: Saç Boyama, Röfle, Fön, Maske, Saç Kesimi
- Salon sahibi şablonu özelleştirebilmeli (fiyat, süre düzenleme)

### 🟢 Düşük Öncelik

**5. Uzman Fotoğrafları**
- Salon profil sayfasında "Ekibimiz" bölümü
- Uzman adı + fotoğrafı (çoklu uzman özelliğiyle bağlantılı)
- Müşteri randevu alırken uzman kartını görebilmeli

**— Mevcut Backlog —**
- Salon arama (isim bazlı)
- Favoriler listesi

---

## Notlar

- `sync.sh` ile branch yönetimi: `./sync.sh neva` / `./sync.sh platform`
- EAS CLI: `~/.local/bin/eas` (local kurulu)
- Expo başlatma: `npx expo start --clear` → Android: `a`
- Parantezli path'lerde tek tırnak kullan: `'app/(tabs)/index.tsx'`

## 2026-04-04 — Sprint 20: Test + Bug Fix + Specialists Başlangıç

### Sorunlar & Çözümler
- **Slot RLS bug:** Müşteri yalnızca kendi randevularını görüyordu → başka müşterilerin slotları bloke edilmiyordu. `get_taken_slots()` SECURITY DEFINER RPC ile düzeltildi.
- **Internet yokken sessiz başarısız:** auth/index.tsx catch bloğuna network hata mesajı eklendi.
- **generate_series(time):** PostgreSQL'de time türüyle çalışmıyor. Bir sonraki sprintte timestamp cast ile düzeltilecek.

### Tamamlananlar
- Bölüm 4, 5, 6, 10 manuel testleri tamamlandı (MANUAL_TEST.md güncellendi)
- `get_taken_slots()` RPC: cross-user slot blocking
- `specialists` tablosu migration yazıldı (DB uygulanmadı — generate_series sorunu)

### Sıradaki Sprint
- specialists migration fix (generate_series → timestamp cast)
- specialists DB uygulaması + salon.tsx UZMANLAR bölümü UI

---

## 9 Nisan 2026 — Platform Mimarisi Kararları

### Onaylanan Tech Stack (Tam Platform)

| Katman | Araç | Karar | Notlar |
|--------|------|-------|--------|
| Backend / DB | Supabase | Mevcut, kalıcı | PostgreSQL + RLS + Edge Functions |
| Auth | Clerk | Supabase Auth'tan migrate edilecek | Phase 3 |
| Email | Resend | Supabase SMTP olarak bağlı | Domain sonrası aktif |
| Deploy (web) | Vercel | Next.js web panel burada | dashboard.nevaapp.co |
| Deploy (landing) | Vercel | Landing page de buraya taşınacak | nevaapp.co |
| Payments | Stripe | Salon sahibi abonelik modeli | Phase 5 |
| Domain | Namecheap | nevaapp.co satın alınacak | ~$11 |
| DNS / CDN | Cloudflare | Namecheap NS → Cloudflare | Proxy + SSL |
| Version Control | GitHub | mehmetertekinbusiness-stack/neva | Mevcut |
| Analytics | PostHog | App + web event tracking | Phase 6 |
| Error Tracking | Sentry | Expo + Next.js SDK | Phase 6 |
| Vector DB | Pinecone | AI öneri sistemi | v2 sprint |

### Clerk Karar Gerekçesi
- React Native + Next.js (web panel) aynı Clerk instance — tek auth kaynağı
- Organizations: her salon = org, personel = member → ekip yönetimi hazır
- Stripe entegrasyonu resmi olarak destekleniyor (webhook → Customer sync)
- SMS OTP: Türk pazarı için kritik (telefon numarasıyla giriş)
- 10,000 MAU ücretsiz — launch için yeterli

### Vercel / Next.js Web Panel Kapsamı
Salon sahipleri nevaapp.co/dashboard üzerinden:
- Randevu takvimi görüntüleme ve yönetimi
- Salon profili düzenleme
- Abonelik planı yönetimi (Stripe)
- İstatistikler (PostHog verileri)

### Stripe Modeli
- A planı: Ücretsiz (sınırlı randevu/ay)
- B planı: Pro — aylık abonelik, sınırsız randevu + web panel + analytics
- Ödeme: Stripe Billing, düşük komisyon yöntemi (havale/IBAN alternatif değerlendiriliyor)
- Müşteri → salon ödemesi (v2): Phase 6+ sprint

### Phase Sırası
```
Phase 1 — Domain + Cloudflare + GitHub + Vercel (landing live)
Phase 2 — Resend aktif (domain sonrası 30 dk)
Phase 3 — Clerk migration (1 hafta)
Phase 4 — Next.js web panel (2 hafta)
Phase 5 — Stripe abonelik (1 hafta)
Phase 6 — Sentry + PostHog (paralel)
Phase 7 — Pinecone / AI öneri (v2)
```
- Bölüm 9 (bildirimler) manuel testi

---

## 18 Nisan 2026 — Sprint 21: Specialist UI + Müşteri Uzman Seçimi + Maestro E2E

### Tamamlananlar
- `specialists.working_hours` UI: salon.tsx'e gün toggle'ları eklendi (DAY_ORDER, IIFE, optimistic update)
- `toggleSpecDay()` — working_hours patch, item-level revert
- `toggleSpecialization()` — tag array toggle
- `updateSpecialist()` — optimistic revert, prevItem pattern
- Müşteri booking flow: uzman seçimi (`selSpec`, "Farketmez" + per-specialist kartları)
- `specialist_id` bookings insert'e eklendi
- `specialists(name, color)` join → berber randevu kartı
- `SPEC_COLORS` + `SPEC_PRESETS` → `lib/constants.tsx` (tek kaynak)
- `expo-calendar` entegrasyonu: `addToCalendar()`, `resolveCalendarId()` cache
- `expo-calendar` native modül guard: `try/require` wrapper (devbuild yok, crash önlendi)
- Maestro E2E framework kurulumu: 6 flow dosyası + `run_tests.sh`

### Sorunlar & Çözümler

| # | Sorun | Kök Neden | Çözüm | Sprint |
|---|-------|-----------|-------|--------|
| A-07 | Maestro `launchApp` her seferinde MIUI ana ekranı gösteriyor | MIUI, UIAutomator instrumentation başlarken foreground uygulamayı arka plana atıyor | `launchApp` kaldırıldı; `adb pm clear + am start` ile pre-launch, Maestro flow'ları mevcut uygulama üzerinde çalışıyor | S21 |
| A-08 | `INSTALL_FAILED_USER_RESTRICTED` — Maestro driver APK kurulamıyor | MIUI `no_install_unknown_sources_globally=1` kısıtlaması | `settings put global no_install_unknown_sources_globally 0` + `adb install -t -r` | S21 |
| A-09 | Maestro `wait: 6000` geçersiz komut | Maestro bu komutu tanımıyor | `extendedWaitUntil: visible: "..." timeout: 30000` ile değiştirildi | S21 |
| A-10 | `extendedWaitUntil` içinde `optional: true` geçersiz | Maestro syntax kısıtlaması | `tapOn: text: "..." optional: true` expanded form kullanılmalı | S21 |
| A-11 | Expo dev client server seçim ekranı `clearState` sonrası çıkıyor | Dev build state temizlenince Expo dev client Metro bağlantısını yeniden soruyor | `tapOn: "http://localhost:8081" optional: true` flow başına eklendi | S21 |

### Maestro Durumu
- **Platform uyumluluğu:** MIUI + dev build kombinasyonu E2E testleri verimsiz yapıyor
  - `launchApp` çalışmıyor (home ekranı görünüyor)
  - Her `pm clear` sonrası Expo dev client server ekranı geliyor (~8-10s bekleme)
  - Maestro driver APK MIUI security tarafından engelleniyor (her oturumda manuel fix)
  - Test süresi: 1 flow ~2-3 dakika (setup + Metro yükleme dahil)
- **Alternatif önerileri:** bkz. Bekleyen

### Bekleyen
- [ ] Maestro alternatifi değerlendirme: **detox** (react-native-specific, daha az MIUI sorunu) veya **production build + Maestro Cloud**
- [ ] `expo-calendar` → production EAS build'de native modül dahil edilmeli (yeni dev build)
- [ ] Clerk MFA bloker: Dashboard → email verification code disable
- [ ] EAS production build (specialist UI + uzman seçimi + calendar entegrasyonu)
- [ ] 6 Maestro flow'u production build üzerinde test et

---

## 1 Mayıs 2026 — Bug Fix + UI İyileştirme + Domain Kararı

### Tamamlananlar

| # | Değişiklik | Dosya |
|---|-----------|-------|
| B-11 | Exit butonu: `supabase.auth.signOut()` → `useClerk().signOut()` + Alert onayı | `(barber)/index.tsx` |
| B-12 | UUID stale closure bug: `rejectTargetRef` + `changeRejectTargetRef` ile sabit ref, guard eklendi | `(barber)/index.tsx` |
| B-13 | Splash erken NEVA sorunu: `isFirst===null` fallback sıfırlandı (sadece dark bg) | `_layout.tsx` |
| P-10 | Splash animasyon ~%30 hızlandı — lotus/halka/text süreleri orantılı kısaltıldı | `_layout.tsx` |
| U-01 | Kapak fotoğrafı portrait kırpma `aspect:[16,9]→[3:4]`, preview portrait düzeltme | `(barber)/salon.tsx` |
| U-02 | Berber galerisi: 3'lü kare → 2'li portrait grid, Dimensions hesaplama, lightbox modal | `(barber)/salon.tsx` |
| U-03 | Müşteri galerisi: thumbnail `120→SW*55%` portrait, lightbox tam ekran 4:3, dokunarak kapat | `(customer)/index.tsx` |
| U-04 | Hizmetler cinsiyet filtresi: Tümü/Bay/Bayan sekmeleri, keyword detection, cinsiyet uyumu öne çıkar | `(customer)/index.tsx` |
| P-11 | FlatList: `initialNumToRender:4`, `windowSize:4`, `updateCellsBatchingPeriod:50`, `fadeDuration:200` | `(customer)/index.tsx` |
| U-05 | ErrorBoundary: "Yeniden Dene" + "Ana Sayfaya Dön" (`router.replace('/(auth)')`) | `ErrorBoundary.tsx` |

### Commit: `e5b89ca`

### Tespit Edilen Açık Sorunlar
- 🔴 Google Maps harita çalışmıyor → GCP Console'da **Maps SDK for Android** aktif edilmeli (API key mevcut, SDK değil)
- 🟡 Clerk email verification bloker hâlâ açık (domain yok → OTP gelmiyor)
- 🟡 9.x bildirim testleri (Twilio trial, WhatsApp sender pasif)

### Domain Kararı
**Cloudflare Registrar** ile `nevaapp.co` alınacak (at-cost, DNS+CDN entegre, tek vendor).
Namecheap → Cloudflare NS devri planı iptal: direkt Cloudflare'den alınıyor.

### Sıradaki Adımlar
1. `nevaapp.co` → Cloudflare Registrar'dan al
2. Cloudflare DNS: `legal` CNAME → GitHub Pages
3. Clerk Dashboard: email verification disable
4. GCP: Maps SDK for Android aktif et
5. EAS production build

---

## 2 Mayıs 2026 — Domain & Altyapı Kurulumu

### Tamamlanan Altyapı

| Görev | Detay |
|-------|-------|
| `nevaapp.co` satın alındı | Porkbun — ~$9.58/yıl |
| Cloudflare DNS | Zone oluşturuldu, Porkbun NS güncellendi |
| `legal.nevaapp.co` | CNAME → mehmetertekinbusiness-stack.github.io |
| Resend domain doğrulandı | nevaapp.co, Tokyo bölgesi, SPF+DKIM+DMARC Cloudflare'e eklendi |
| Supabase SMTP | smtp.resend.com:465, noreply@nevaapp.co, RESEND_SMTP_KEY EAS'e eklendi |
| Zoho Mail | info@nevaapp.co aktif, MX+SPF+DKIM Cloudflare'de doğrulandı |
| Landing page | nevaapp.co canlıda (Vercel + GitHub: nevaapp-landing) |
| Google Maps | API key güncellendi (AIzaSyA0mX...), SHA-1 kısıtlaması eklendi |
| Clerk email verification | Disable edildi — kayıt bloğu kaldırıldı |
| EAS production build | Başlatıldı (2 Mayıs akşamı) |

### Cloudflare DNS Kayıtları (Özet)
- A/CNAME `@` → Vercel (a7e353c6bfeb9f17.vercel-dns-017.com)
- CNAME `www` → Vercel
- CNAME `legal` → GitHub Pages
- MX `@` → Zoho (mx.zoho.eu, mx2, mx3)
- TXT `@` → Zoho SPF
- TXT `zmail._domainkey` → Zoho DKIM
- MX `send` → Resend (amazonses)
- TXT `send` → Resend SPF
- TXT `resend._domainkey` → Resend DKIM
- TXT `_dmarc` → DMARC

### Teknik Notlar
- Porkbun'da domain alındıktan sonra Cloudflare zone oluşturup NS transfer yapıldı (tek vendor DNS)
- Zoho Mail free plan: 1 kullanıcı, 5GB depolama — lansman için yeterli
- Vercel proxy Cloudflare ile çakışıyor — Vercel DNS kayıtları proxied:false olmalı
- RESEND_SMTP_KEY (supabase-smtp) ve RESEND_API_KEY (uygulama) ayrı keyler — biri silinince diğeri etkilenmiyor

### Play Console İncelemesi (2 Mayıs 2026 — devam)

| Görev | Durum |
|-------|-------|
| EAS production build (versionCode:2) | ✅ AAB: uMPkWTSkyhcKNNrwNiigge.aab |
| Play Console kapalı test (Alpha) kurulumu | ✅ |
| Store assets (icon 512, feature graphic, 6 screenshot 1080x1920) | ✅ store-assets/ |
| Ad ID beyanı (Analiz) | ✅ |
| legal.nevaapp.co SSL (Let's Encrypt) | ✅ HTTPS 200 aktif |
| Play Console → İncelemeye gönder | ✅ 1.0.1 Beta, Türkiye, 18+ |
| Google Group: neva-beta-testers@googlegroups.com | ✅ Oluşturuldu |

### Bekleyen
- Play Console incelemesi onaylanınca → Google Group closed test'e ekle → opt-in URL al
- BetaTribe listing tamamla (7/7 checklist)
- FeatureGate kaydı
- SMTP test: yeni kullanıcı kaydı ile doğrulama maili kontrol
- Manuel test toplu: 1.4, 1.5, 1.6, 2.1, 2.2, 3.5d, 3.8, 3.9, 6.4, 8.3, 8.4, 9.1-9.5
