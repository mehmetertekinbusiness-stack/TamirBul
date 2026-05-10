---
name: eas-build
description: TamirBul için EAS build tetikler. "build al", "production build", "apk üret", "eas build" dediğinde kullan. Profil: production (AAB, Play Store) veya development (APK, cihaza yükle).
disable-model-invocation: true
---

# EAS Build — TamirBul

## Ön Koşullar

```bash
export JAVA_HOME=/home/mhmt/Documents/android-studio-2024.2.2.13-linux/android-studio/jbr
EAS=~/.local/bin/eas
cd ~/LocalAppPlatform/apps/tamirbul
```

## Profiller

| Profil | Çıktı | Kullanım |
|--------|-------|----------|
| `production` | AAB | Play Store yüklemesi |
| `development` | APK | Cihaza direkt yükle |

## ⚠️ Önkoşul Kontrol

EAS build'den önce şunların dolu olduğunu doğrula:
- `app.config.js` → `extra.eas.projectId` PLACEHOLDER değil mi?
- `google-services.json` — EAS secret'a yüklü mü?
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CLERK_PUBLISHABLE_KEY` EAS env'de var mı?

Eksik varsa build öncesi kullanıcıyı uyar.

## Adımlar

1. Kullanıcıya hangi profil istediğini sor (belirtmemişse).

2. `app.config.js`'de `version` ve `versionCode` kontrol et.

3. Build tetikle:
```bash
cd ~/LocalAppPlatform/apps/tamirbul
export JAVA_HOME=/home/mhmt/Documents/android-studio-2024.2.2.13-linux/android-studio/jbr
~/.local/bin/eas build --platform android --profile [PROFİL] --non-interactive
```

4. Build URL'ini kullanıcıya ver.

## Production Build Sonrası
- `versionCode` artır
- DEVLOG.md güncelle
- Play Console'a yükleme için AAB indirme linki ver

## Önemli
- EAS project ID: `ae0c922f-a67c-4589-bb8b-077ee1590fdc` ✅
- EAS account: `nevaapp` (Neva ile aynı hesap, farklı proje)
- Bundle ID: `co.nevaapp.tamirbul` (geçici)
- EAS env değişkenleri (tümü ayarlandı ✅):
  - GOOGLE_MAPS_API_KEY, GOOGLE_PLACES_API_KEY
  - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
  - SUPABASE_URL, SUPABASE_ANON_KEY
  - CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
- Clerk domain: topical-moccasin-85.clerk.accounts.dev
