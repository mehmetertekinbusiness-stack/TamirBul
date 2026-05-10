---
name: sprint-manager
description: |
  TamirBul proje yöneticisi ve sprint koordinatörü. Sprint planlaması,
  önceliklendirme, ilerleme takibi ve blokaj çözümü.
  "sprint planla", "ne yapacağız", "öncelik sırala", "proje durumu" dediğinde kullan.
tools:
  - Read
  - Glob
  - Bash
---

# Sprint Manager — TamirBul

## Sprint Listesi

### Sprint 0 — Altyapı (1 hafta) ← ŞU AN
**Hedef:** Geliştirmeye hazır proje
- [x] Proje iskeleti (Neva fork)
- [x] Skills + agents tanımlandı
- [x] Proje settings.json + hooks
- [x] Supabase proje oluştu → dlfblfzcjtaqjbbdnosi
- [x] EAS project oluştur → ae0c922f-a67c-4589-bb8b-077ee1590fdc
- [x] EAS env: GOOGLE_MAPS_API_KEY, GOOGLE_PLACES_API_KEY, TWILIO_* ayarlandı
- [x] EAS env: SUPABASE_URL, SUPABASE_ANON_KEY ayarlandı
- [x] EAS env: CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY ayarlandı
- [x] Temel DB şeması migration (001 + 002 uygulandı)
- [x] Clerk proje oluştur (tamirbul için ayrı) → topical-moccasin-85.clerk.accounts.dev

### Sprint 1 — Auth + Tamirci Kayıt (1 hafta)
**Hedef:** Tamirci uygulamaya kaydolabiliyor
- [ ] Clerk auth ekranı (giriş + kayıt)
- [ ] Role seçimi (customer/mechanic)
- [ ] Tamirci profil oluşturma (dükkan adı, adres, kategoriler)
- [ ] Hibrit onboarding (serbest kayıt → "Doğrulanmadı" rozeti)
- [ ] Push token kayıt

### Sprint 2 — Müşteri Harita + Tamirci Keşfi (1 hafta)
**Hedef:** Müşteri tamirci bulabiliyor
- [ ] Google Maps entegrasyonu (kategori ikonları)
- [ ] Tamirci listesi (filtre: kategori, mesafe)
- [ ] Tamirci detay sayfası
- [ ] Çalışma saatleri gösterimi
- [ ] "Açık / Kapalı" durumu

### Sprint 3 — İş Emri Akışı (1 hafta)
**Hedef:** Tam iş emri döngüsü çalışıyor
- [ ] Araç kaydı (plaka, marka, model)
- [ ] İş emri oluştur (araç + kategori + açıklama)
- [ ] Tamirci: kabul/reddet
- [ ] Durum güncelleme (received→delivered)
- [ ] Fotoğraf yükleme (DVI)
- [ ] Push notification (her durum değişikliğinde)

### Sprint 4 — Canlı Takip + Mesajlaşma (1 hafta)
**Hedef:** Müşteri gerçek zamanlı takip ediyor
- [ ] Supabase real-time iş emri takibi
- [ ] Anlık mesaj (tamirci → müşteri)
- [ ] Ek iş onayı (fotoğraf + onay butonu)
- [ ] Tahmini teslimat güncellemesi

### Sprint 5 — Review + Tedarikçi (1 hafta)
**Hedef:** Sosyal kanıt + tamirci araçları
- [ ] Değerlendirme sistemi (fiyat/teknik/iletişim)
- [ ] Tedarikçi defteri (CRUD)
- [ ] WhatsApp sipariş mesajı (deep link)
- [ ] Aloparca deep link yönlendirme

### Sprint 6 — Premium + AdMob (1 hafta)
**Hedef:** Gelir modeli aktif
- [ ] Premium özellik kilidi (₺299/ay)
- [ ] Haritada öne çıkma
- [ ] İstatistik dashboard (tamirci)
- [ ] AdMob banner (müşteri tarafı)

### Sprint 7 — Test + Lansman Hazırlığı (1 hafta)
**Hedef:** Play Store'a hazır
- [ ] Tüm test senaryolarını geç
- [ ] TypeScript 0 hata
- [ ] Store assets (ikon, ekran görüntüsü, açıklama)
- [ ] Privacy policy + ToS
- [ ] Production EAS build
- [ ] Play Console kapalı test → açık test

## Kural
- Her sprint sonunda çalışan bir demo olmalı
- Bloklayan sorun 1 günden fazla sürmemeli → eskalasyon
- Supabase RLS her sprint'te security-guardian denetiminden geçer
