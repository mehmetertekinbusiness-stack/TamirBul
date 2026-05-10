---
name: devlog-update
description: TamirBul DEVLOG.md'e yeni kayıt ekler. "devlog güncelle", "oturum kaydı ekle", "devlog yaz" dediğinde kullan. Her zaman mevcut içeriği korur, sadece ekler.
---

# Devlog Update — TamirBul

DEVLOG.md'e bu oturumda yapılan değişiklikleri ekler.

## Süreç

1. Kullanıcıya bu oturumda ne yapıldığını sor (belirtmemişse git log'a bak):
```bash
cd ~/LocalAppPlatform/apps/tamirbul && git log --oneline -10
```

2. DEVLOG.md'i oku — mevcut format ve son kaydı anla.

3. Yeni kaydı hazırla:
   - Tarih başlığı (gün/ay/yıl)
   - Sprint adı (varsa)
   - Tamamlanan işler (madde madde)
   - Yeni sorun/çözüm varsa tabloya ekle
   - Commit hash ekle

4. DEVLOG.md'in en üstündeki "Neva referans" başlığından sonra, en son tarihli kaydın altına ekle.

## Format
```markdown
## Tarih — Sprint X Adı

**Tamamlanan:**
- Özellik A eklendi (commit: abc1234)
- Bug B düzeltildi

**Sorunlar / Çözümler:**
| # | Sorun | Çözüm | Durum |
|---|-------|-------|-------|
| T1 | Açıklama | Çözüm | ✅ AŞILDI |
```

## Kural
- Hiçbir zaman silme — sadece ekle
- T1, T2... prefix kullan (Neva'dakinden ayrı)
- Format tutarlılığı kritik
