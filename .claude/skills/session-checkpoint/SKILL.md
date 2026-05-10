---
name: session-checkpoint
description: >
  TamirBul oturumunda 30 dakika sessizlik olduğunda veya kullanıcı "checkpoint", "kaydet",
  "ara kayıt", "oturum kaydet" dediğinde çalışır. Yapılan tüm önemli işleri DEVLOG.md'e
  yazar, git commit atar, memory'yi günceller. Veri kaybını önler.
triggers:
  - "checkpoint"
  - "kaydet"
  - "ara kayıt"
  - "oturum kaydet"
  - "ne yaptık"
  - "durum kaydet"
---

# Session Checkpoint — TamirBul

Oturumdaki önemli her şeyi kalıcı hale getirir. 30 dk sessizlik veya explicit çağrı.

## Adım 1 — Oturum Özetini Çıkar

Konuşma geçmişine bak. Şunları tespit et:
- Tamamlanan teknik işler (dosya yazıldı, migration uygulandı, config değişti)
- Alınan kararlar (mimari, isimlendirme, yaklaşım)
- Karşılaşılan sorunlar ve çözümler
- EAS / Supabase / Clerk gibi dış servis değişiklikleri
- Bekleyen / yarım bırakılan işler

## Adım 2 — Git Durumu

```bash
cd ~/LocalAppPlatform/apps/tamirbul
git status
git diff --stat
```

Staged olmayan değişiklik varsa:
```bash
git add -u
```

## Adım 3 — DEVLOG.md Güncelle

DEVLOG.md'i oku (ilk 80 satır yeterli — format anlamak için):
```bash
head -80 ~/LocalAppPlatform/apps/tamirbul/DEVLOG.md
```

Yeni checkpoint kaydı ekle — "TamirBul Proje Notları" bölümünün hemen altına, mevcut en son kaydın ÜSTÜNE:

```markdown
### [YYYY-AA-GG] Checkpoint HH:MM — [Kısa Başlık]

**Tamamlanan:**
- ...

**Kararlar:**
- ...

**Sorunlar / Çözümler:**
| # | Sorun | Çözüm | Durum |
|---|-------|-------|-------|
| T? | ... | ... | ✅ |

**Bekleyen:**
- ...
```

## Adım 4 — Git Commit

```bash
cd ~/LocalAppPlatform/apps/tamirbul
git add -u
git commit -m "chore: checkpoint $(date '+%Y-%m-%d %H:%M')"
```

Commit mesajı CLAUDE.md formatına uygun olsun: `tip: açıklama`.
Checkpoint için `chore:` kullan.

## Adım 5 — Memory Güncelle (Değişiklik Varsa)

Eğer bu oturumda öğrenilen yeni teknik bilgi, kritik karar veya mimari değişiklik varsa:
- `/home/mhmt/.claude/projects/-home-mhmt/memory/project_neva_tech.md` benzeri bir dosya oluştur/güncelle
- MEMORY.md index'ine ekle

## Kurallar

- Silinmiş satır olmaz — sadece ekle
- T1, T2... prefix (Neva'dan ayrı numara sistemi)
- Boş checkpoint atmaz — anlatacak bir şey yoksa kullanıcıya sor
- Co-Authored-By ekleme — sadece Mehmet ERTEKİN author
