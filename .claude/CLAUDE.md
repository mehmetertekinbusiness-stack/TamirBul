# TamirBul — Claude Code Proje Kılavuzu

## Proje Özeti
İstanbul pilot, oto tamirci randevu ve iş emri takip uygulaması.
Müşteri (tamirci bul, iş emri takip et) + Tamirci paneli (iş emri yönet, müşteri bildir).
**LocalAppPlatform portföyü** — Neva'dan fork, tamamen bağımsız proje.

## Teknik Altyapı
- **Framework:** React Native + Expo SDK 54 (Expo Router file-based routing)
- **Backend:** Supabase (ayrı proje — Neva ile tablo paylaşımı yok)
- **Auth:** Clerk (customer / mechanic rolleri)
- **Build:** EAS CLI (`~/.local/bin/eas`)
- **Bundle ID:** `co.nevaapp.tamirbul` (geçici, lansman öncesi finallenecek)

## Rol Sistemi
- `customer` → `/(customer)/` ekranları
- `mechanic` → `/(mechanic)/` ekranları

## Dizin Yapısı
```
app/
  (auth)/        # Giriş / kayıt
  (customer)/    # Müşteri ekranları (harita, iş emirleri, araçlarım)
  (mechanic)/    # Tamirci paneli (dashboard, iş emri detay, tedarikçiler)
  _layout.tsx    # Root layout, Clerk auth, yönlendirme
lib/
  constants.tsx  # C renkler, SUPABASE_URL/ANON, REPAIR_CATEGORIES
  supabase.ts    # (YOK — root supabase.ts kullanılır)
  helpers.ts     # Yardımcı fonksiyonlar
  session-context.tsx  # Global userId/userRole context
supabase.ts      # Supabase client (Clerk token getter ile)
constants/
  theme.ts       # Colors objesi — TamirBul renk sistemi
supabase/
  migrations/    # DB migration'ları
```

## Marka Kararları (Mayıs 2026)
- Ana renk: Turuncu `#E8540A`
- Vurgu: Lacivert `#1A3A5C`
- Arka plan: Kırık Beyaz `#F5F5F0`
- İsim: TamirBul (geçici — final karar belirlenmedi)

## Kritik Kurallar
- `supabase.ts` root'ta — `lib/` içinde DEĞIL
- RLS aktif tüm tablolarda
- `mechanic` rolü (Neva'daki `berber` değil)
- Expo Go'da ads/notifications mock kullanılır (metro.config.js)

## Servis Bilgileri
- **Supabase:** project ref `dlfblfzcjtaqjbbdnosi` | Migration: Management API ile (`sbp_3baa9217...`)
- **Clerk:** `topical-moccasin-85.clerk.accounts.dev` | JWKS: dashboard'dan Supabase'e eklenecek (Sprint 1)
- **EAS:** tüm env değişkenleri ayarlı (SUPABASE_*, CLERK_*, GOOGLE_*, TWILIO_*)

## Açık Kararlar
- Supabase ↔ Clerk JWT entegrasyonu: Dashboard → Authentication → Third-party (Sprint 1 başında)
- AdMob IDs: PLACEHOLDER (lansımdan önce)
- E-fatura (Paraşüt API): onaylanmadı, Phase 2
- Yedek parça: Deep link MVP (Aloparca), Phase 2'de B2B

## Geliştirme Komutları
```bash
npx expo start --port 8082   # Neva 8081 kullanıyor
npx tsc --noEmit
```
