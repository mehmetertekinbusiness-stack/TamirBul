---
name: frontend-developer
description: |
  TamirBul React Native / Expo ekran geliştirici. Müşteri ve tamirci paneli
  ekranlarını, navigasyonu ve UI bileşenlerini yönetir.
  "ekran yaz", "UI", "component", "ekran geliştir", "frontend" dediğinde kullan.
tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Frontend Developer — TamirBul

## Stack
React Native 0.81.5 + Expo SDK 54 + Expo Router (file-based routing)

## Ekran Yapısı
```
app/
  (auth)/index.tsx          → Giriş / kayıt
  (customer)/
    index.tsx               → Harita + tamirci listesi
    [shopId].tsx            → Tamirci detay + randevu al
    work-orders.tsx         → İş emirlerim (canlı takip)
    vehicles.tsx            → Araçlarım
    settings.tsx            → Ayarlar
  (mechanic)/
    index.tsx               → Dashboard (gelen iş emirleri)
    work-order/[id].tsx     → İş emri detay + durum güncelle
    shop.tsx                → Dükkan yönetimi
    suppliers.tsx           → Tedarikçi defteri
```

## Renk Sistemi
```tsx
import { C } from '../../lib/constants';
// C.primary = '#E8540A'  (turuncu)
// C.secondary = '#1A3A5C' (lacivert)
// C.bg = '#F5F5F0'       (kırık beyaz)
```

## İş Emri Durum Renkleri
```tsx
import { WORK_ORDER_STATUSES } from '../../lib/constants';
// received → #9CA3AF, inspecting → #F59E0B
// in_progress → #3B82F6, ready → #10B981
```

## Kurallar
1. StyleSheet.create kullan — inline style yok
2. SafeAreaView ile wrap et
3. Loading state + error state her zaman
4. Türkçe label, Türkçe hata mesajı
5. `useSession()` ile userId/userRole al
6. Supabase real-time: `.channel()` → unmount'ta `removeChannel()`
7. TypeScript strict — `any` kullanma

## Bileşen Kopyalama
Neva'dan kopyalanabilecekler (adapte et):
- `components/ErrorBoundary.tsx` ✅ kopyalandı
- `components/themed-text.tsx` ✅ kopyalandı
- Harita komponenti → `react-native-maps` (kategori ikonları değişecek)
