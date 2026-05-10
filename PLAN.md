# TamirBul — Fizibilite ve Geliştirme Planı
> Oluşturuldu: Mayıs 2026 | Durum: Fizibilite aşaması | Geliştirme başlamadı

---

## 1. PAZAR VERİLERİ (2025-2026 Güncel)

| Metrik | Rakam | Kaynak |
|---|---|---|
| Türkiye araç parkı | **33,7 milyon** (Ocak 2026) | TÜİK |
| Araçların ortalama yaşı | **14,2 yıl** | TÜİK 2025 |
| Kayıtlı bağımsız oto tamirci | **18.111** (%95,85'i bağımsız) | Rentechdigital 2025 |
| İstanbul tamirci sayısı | **3.711** | Rentechdigital 2025 |
| Sektör büyüklüğü (tamir/bakım) | **4,52 milyar USD → 6,98 milyar USD** (2030 tahmini, CAGR %6,09) | TechSciResearch |
| Aftermarket toplam | **8,5-9 milyar USD** (2025) | CAGR %8,2 |
| Yeni araç satışı 2025 | **1,3+ milyon** | ODD/ODMD |
| Dijital randevu penetrasyonu | Ölçülebilir veri yok — çok düşük | — |
| İnternet kullanımı | %90,9 | TÜİK 2025 |

**Kritik İçgörü:**
- 14,2 yıl ortalama yaş → yaşlı araç = daha sık bakım = bağımsız tamirciye yönelim
- 33,7M araçtan ~17,4M otomobil → yılda 40-50M bakım/servis işlemi potansiyeli
- Dijital penetrasyon neredeyse sıfır + internet kullanımı %90,9 = "first-mover" fırsatı açık

---

## 2. REKABET ANALİZİ

| Rakip | Odak | Zayıflık | Fırsat |
|---|---|---|---|
| Servisbir | İşletme yazılımı | 249 işletme, müşteri tarafı yok | Müşteri deneyimi tamamen boş |
| MYNDOS | Oto servis ERP | Desktop, ₺4.500/yıl | Mobil yok |
| Google Haritalar | Yer bulma | Randevu/takip/iletişim yok | Servis sonrası yok |
| Armut | Genel hizmet | Bid modeli, oto niş değil | Doğrudan randevu modeli |

**Sonuç:** Müşteri odaklı, randevu + iş emri takibi sunan Türkçe uygulama yok.

---

## 3. İŞ MODELİ

### Gelir Modelleri

| Model | Kısa Vade | Uzun Vade |
|---|---|---|
| **Freemium → Premium** (₺299/ay) | Ana gelir | Büyüme motoru |
| **AdMob** (müşteri tarafı) | İkincil | Ölçekle artar |
| **Yedek parça B2B ortaklık** | Hayır | Aloparca anlaşması sonrası |
| **E-fatura SaaS** | Hayır | Premium özellik |

### Premium Özellikler (₺299/ay)
- Haritada öne çıkma
- DVI (Dijital muayene raporu) fotoğraf gönderme
- Anlık mesaj/onay
- Sınırsız iş emri (ücretsiz: 30/ay)
- İstatistik dashboard
- E-arşiv fatura kesme (Paraşüt entegrasyonu)

### Fiyat Analizi
| Senaryo | 500 tamirci (%15 premium) | 2.000 tamirci (%20 premium) |
|---|---|---|
| Premium gelir | ₺22.425/ay | ₺119.600/ay |
| AdMob (5K müşteri DAU) | ~₺750/ay | ~₺3.750/ay |
| **Toplam** | ~₺23.175/ay | ~₺123.350/ay |

---

## 4. YEDEK PARÇA ENTEGRASYONU

### Türkiye Platformları
| Platform | API | B2B | Not |
|---|---|---|---|
| Aloparca.com | Yok (public) | **Var** (b2b.aloparca.com) | En umut verici ortak adayı |
| OtoDevi.com | Yok | Muhtemelen | İletişim gerekli |
| Yedekparca.com.tr | Yok | Bilinmiyor | — |
| OtoKoç | Kurumsal sözleşme | Evet | Orijinal parça kategorisi |

### Önemli Bulgu
Türkiye'de hiçbir yedek parça platformunun public REST API'ı yok. Global standart (PartsTech modeli) Türkiye'de mevcut değil = uzun vadeli boşluk fırsatı.

### Entegrasyon Yol Haritası

**MVP (0 maliyet):** Deep Link yönlendirme
- Tamirci parça adı + araç bilgisi girer
- Uygulama Aloparca/OtoDevi arama URL'ine yönlendirir
- Sipariş orada tamamlanır

**MVP + (düşük maliyet):** Tedarikçi Defteri
- Tamirci kendi tedarikçilerini (tel, WhatsApp) kaydeder
- İş emrinden tek tıkla WhatsApp sipariş mesajı gönderir
- API gerektirmez, mevcut alışkanlığa uyar

**Phase 2 (3-6 ay):** Aloparca B2B Ortaklığı
- Aloparca ile ticari görüşme: "uygulamamız üzerinden sipariş başına %X komisyon"
- WebView veya özel API ile uygulama içi entegrasyon

**Uzun vade (12+ ay):** Türkiye'nin PartsTech'i
- Birden fazla tedarikçiyi tek arama ekranında listele
- Tamirciye fiyat karşılaştırma, stok durumu, teslimat süresi
- Bu model kurmak büyük iş ama boşluk net

---

## 5. E-FATURA ENTEGRASYONu

### Mevzuat Özeti
- **Şu an (2025):** 3.000 TL üzeri fatura → e-arşiv zorunlu
- **2027:** Tüm faturalar e-arşiv/e-fatura zorunlu (tutar sınırı kalkar)
- **TamirBul tamircisi için:** E-arşiv fatura yeterli (ciro > 3M TL ise e-fatura sistemine geçiş)

### MVP Önerisi: Paraşüt API
- REST API v4, OAuth2, açık dokümantasyon (apidocs.parasut.com)
- Kurulum ücreti yok, aylık ~300-500 TL
- KOBİ dostu, Türk startup ekosisteminde en yaygın
- Akış: İş emri tamamla → API'ye POST → GİB'e iletilir → PDF müşteriye

### Riskler
- Mali mühür (KamuSM) tamircinin kendi adına alması gerekiyor → onboarding süreci uzar
- Eşikler her yıl değişiyor → düzenli güncelleme şart
- Phase 2'de (1.000+ tamirci) kurumsal entegratöre geçiş gerekebilir (İzibiz/Foriba)

---

## 6. MÜŞTERİ PANELİ ÖZELLİKLERİ

### MVP Kapsamı
| Özellik | Açıklama | Neva'dan % | Değer |
|---|---|---|---|
| **Canlı Tamir Takibi** | Kontrol → Tamir → Hazır bildirimleri | %65 | "Ne zaman hazır?" sorunu çözülür |
| **Dijital Muayene Raporu** | Fotoğraflı tamir kanıtı, renk kodlu | %20 | Güven krizi çözülür |
| **Anlık Mesaj + Onay** | Ek iş için fotoğraf + onay butonu | %40 | WhatsApp trafiği uygulamaya taşır |
| **Tamirci Değerlendirme** | Fiyat/teknik/iletişim puanları | %75 | Sosyal kanıt |
| **Tahmini Teslimat Güncellemesi** | Uzayan işte yeni saat bildirimi | %60 | Belirsizlik ortadan kalkar |
| **Dijital Servis Defteri** | Tüm tamir geçmişi otomatik kayıt | %55 | Elde tutma aracı |

### Phase 2
- Km/zaman bazlı bakım hatırlatıcısı
- Fiyat şeffaflığı ("İstanbul ortalaması")
- Araç bırakırken hasar tespiti (360° fotoğraf)
- Parça kalite seçimi (orijinal/muadil/yenilenmiş)

### Yenilikçi Fikirler (Rakiplerde Yok)
1. **"Usta Brifing" video:** Araç bırakırken 60 sn sesli video — usta teknik detayı görür/duyar
2. **QR Araç Kimlik Kartı:** Plaka+şasi bağlı, tüm geçmiş, ikinci el satışta alıcıya devredilebilir
3. **Sigorta Asistanı:** Kaza sonrası hasar raporu PDF → sigorta firmasına hazır; B2B iş modeli kapısı

---

## 7. TAMİRCİ PANELİ ÖZELLİKLERİ

### MVP
- Kayıt (adres, kategoriler, çalışma saati, fotoğraf)
- Hibrit onboarding: serbest kayıt + "Doğrulanmadı" rozeti → telefon doğrulamasıyla otomatik onay
- Gelen iş emirlerini gör / kabul et / reddet
- İş emri durum güncelleme (fotoğraf opsiyonel)
- Mesaj/onay akışı
- Tedarikçi defteri

### Premium
- Haritada öne çıkma
- DVI (detaylı fotoğraflı muayene raporu)
- E-arşiv fatura kesme
- İstatistik dashboard (aylık gelir, tamir kategorisi dağılımı)
- SMS bildirim

---

## 8. TEKNİK MİMARİ

### Neva'dan Devralınanlar (~%65)
- React Native + Expo SDK 54 — sıfır değişiklik
- Expo Router (file-based routing) — sıfır değişiklik
- Clerk auth — sıfır değişiklik
- Google Maps SDK — tamirci kategorisi ikonları eklenir
- AdMob entegrasyonu — sıfır değişiklik
- Push notification — metin değişir
- EAS build pipeline — bundle ID değişir

### Yeni Supabase Projesi (Neva ile tablo paylaşımı yok)
```
Yeni tablolar:
  vehicles          — araç profili (plaka, marka, model, yıl, km)
  repair_categories — sabit: motor/elektrik/kaporta/lastik/periyodik/klima/egzoz/yıkama
  shop_categories   — tamirci ↔ kategori
  work_orders       — iş emri (booking_id, vehicle_id, category_id, status, estimated_minutes)
  work_order_updates— iş emri log (status, note, photo_url)
  suppliers         — tedarikçi defteri (tamirci kendi tedarikçileri)

Neva'dan kopyalanacak (yeniden kullanılacak):
  shops, bookings, reviews, specialists, shop_hours
```

### Bundle ID Kararı
- Domain: nevaapp.co üzerinden işlem (mevcut karar)
- Öneri: `co.nevaapp.tamirbul` (karar verilmedi)

### Pilot
- Sadece İstanbul (3.711 tamirci potansiyeli)

---

## 9. EKRAN LİSTESİ

### Müşteri
| Ekran | Durum | Not |
|---|---|---|
| Auth | Neva kopyası | — |
| Onboarding | Neva + araç ekle adımı | — |
| Ana sayfa (harita+liste) | Neva + kategori filtresi | Tamirci ikonları yeni |
| Tamirci detay | Neva adapte | Kategori + çalışma saati |
| Randevu al | Neva kopyası | — |
| İş emirlerim | Neva adapte | Canlı durum takibi eklenir |
| Araçlarım | YENİ | Plaka/marka/model yönetimi |
| Ayarlar | Neva kopyası | — |

### Tamirci
| Ekran | Durum | Not |
|---|---|---|
| Auth + Kayıt | Neva kopyası | — |
| Dashboard | Neva adapte | İş emri kartları |
| İş emri detay | YENİ | Durum güncelle + fotoğraf |
| Dükkan yönetimi | Neva adapte | Kategori seçimi eklenir |
| Tedarikçi defteri | YENİ | WhatsApp sipariş akışı |

**Toplam: 13 ekran | Yeni: 3 | Adapte: 5 | Kopyala: 5**

---

## 10. AÇIK KARARLAR

| Karar | Durum |
|---|---|
| A) Supabase | Ayrı proje ✅ |
| B) Bundle ID | Henüz belirlenmedi (co.nevaapp.tamirbul önerisi) |
| C) Pilot şehir | İstanbul ✅ |
| D) Onboarding modeli | Hibrit (serbest + telefon doğrulama = otomatik onay) ✅ |
| E) Marka/renk | Farklı kimlik ✅ (renk paleti belirlenmedi) |
| F) Uygulama adı | "TamirBul" geçici — final karar yok |
| G) E-fatura | Paraşüt API (önerildi, onaylanmadı) |
| H) Yedek parça | Deep link MVP + Aloparca B2B görüşme (önerildi) |

---

## 11. RİSKLER

| Risk | Seviye | Önlem |
|---|---|---|
| Tamirci edinimi (arz tarafı) | Yüksek | 3 ay ücretsiz premium, İstanbul pilot, saha satış |
| "Randevu kültürü yok" | Orta | "Hemen git" + anlık kabul modu |
| E-fatura onboarding (mali mühür) | Orta | Opsiyonel bırak, talep gelince aktif et |
| Yedek parça API yok | Orta | Deep link MVP yeterli, B2B görüşme paralel |
| Neva fork bakım maliyeti | Orta | Shared UI component kütüphanesi (orta vadede) |

---

*Sonraki adım: Açık kararlar netleşince Sprint 1 planı ve Supabase proje kurulumu.*
