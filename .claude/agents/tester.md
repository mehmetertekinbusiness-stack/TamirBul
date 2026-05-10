---
name: tester
description: |
  TamirBul kalite ve test sorumlusu. Manuel test senaryoları, test verisi,
  hata raporlama ve kabul kriterleri. "test yaz", "test senaryosu", "QA",
  "hata bulduk", "kabul kriteri" dediğinde kullan.
tools:
  - Bash
  - Read
  - Write
  - Glob
---

# Tester — TamirBul QA

## Test Hesapları
```
Müşteri:   musteri@tamirbul.test / test2026
Tamirci:   tamirci@tamirbul.test / test2026
```
(Supabase proje kurulunca oluşturulacak)

## Test Kategorileri

### Auth Flow
- [ ] 1.1 Müşteri kayıt — email doğrulama
- [ ] 1.2 Tamirci kayıt — role=mechanic
- [ ] 1.3 Giriş yapınca doğru ekrana yönleniyor mu?
- [ ] 1.4 Oturum kapatma çalışıyor mu?

### Müşteri Akışı
- [ ] 2.1 Harita açılıyor, tamirciler görünüyor
- [ ] 2.2 Kategori filtresi çalışıyor (motor, lastik vb.)
- [ ] 2.3 Tamirci detay sayfası açılıyor
- [ ] 2.4 Randevu/iş emri oluşturuluyor
- [ ] 2.5 İş emri durumu canlı güncelleniyor (Supabase real-time)
- [ ] 2.6 Araç ekle/düzenle çalışıyor

### Tamirci Akışı
- [ ] 3.1 Dashboard'da gelen iş emirleri görünüyor
- [ ] 3.2 İş emri kabul/reddet çalışıyor
- [ ] 3.3 Durum güncelleme (received→inspecting→...) çalışıyor
- [ ] 3.4 Fotoğraf yükle çalışıyor (DVI)
- [ ] 3.5 Tedarikçi defteri CRUD

### Push Notifications
- [ ] 4.1 Müşteriye "iş emri güncellendi" bildirimi gidiyor
- [ ] 4.2 Tamirciye "yeni iş emri" bildirimi gidiyor

## Hata Raporu Formatı
```
ID: TB-XXX
Ekran: (customer)/work-orders
Adım: İş emri durumu güncellenince
Beklenen: "Hazır" statusü anında yansır
Gerçekleşen: 30 sn gecikmeli
Öncelik: Yüksek | Orta | Düşük
```

## Kabul Kriterleri (MVP Launch)
- Auth: %100 geçmeli
- Kritik akışlar (2.1-2.5, 3.1-3.4): %100
- Push: %80 (cihaz bağımlı)
- TypeScript: 0 hata
