---
name: ts-fix
description: TamirBul projesindeki TypeScript hatalarını tara ve düzelt. "typescript hata düzelt", "tsc fix", "tip hataları temizle", "ts-fix" dediğinde kullan.
---

# TS Fix — TamirBul

TypeScript hatalarını tarar, gruplar ve düzeltir.

## Süreç

1. TypeScript kontrolü yap:
```bash
cd /home/mhmt/LocalAppPlatform/apps/tamirbul
npx tsc --noEmit 2>&1
```

2. Hata analizi — dosya bazında grupla, kritikten başla:
   - `app/` ekranları
   - `lib/` yardımcılar
   - `components/`

3. Her düzeltmeyi ayrı `Edit` komutuyla uygula.

4. Düzeltme sonrası tekrar `npx tsc --noEmit` çalıştır.
   - 0 hata → commit öner
   - Hata kaldıysa → tekrar döngü

## Kısıt
`supabase/functions/` — Deno ortamı, kontrol etme.

## Bilinen Kalıplar
- `fontWeight` tip hatası: `'700' as const` yerine `'700'`
- `never[]` state: explicit tip ekle `useState<Tip[]>([])`
- Null safety: `?.` yerine tip guard kullan

## Başarı Kriteri
`npx tsc --noEmit` → çıktı yok (0 hata).
