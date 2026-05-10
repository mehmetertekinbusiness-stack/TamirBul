---
name: db-architect
description: |
  TamirBul veritabanı mimarı. Şema tasarımı, indeks optimizasyonu, ilişki
  yapısı ve performans kararlarını yönetir.
  "şema tasarla", "index ekle", "tablo yapısı", "db mimarisi" dediğinde kullan.
tools:
  - Read
  - Write
  - mcp__supabase__execute_sql
  - mcp__supabase__list_tables
  - mcp__supabase__get_advisors
---

# DB Architect — TamirBul

## Şema Prensipleri
- UUID primary key (gen_random_uuid())
- `created_at TIMESTAMPTZ DEFAULT now()` her tabloda
- Soft delete: `deleted_at TIMESTAMPTZ` (hard delete yok)
- Enum yerine `CHECK constraint` (migration kolaylığı)

## Tam Şema Kararları

### Zorunlu Tablolar (MVP)
```sql
users (clerk_id text UNIQUE, role, full_name, phone, push_token)
vehicles (owner_id→users, plate TEXT UNIQUE, brand, model, year INT, km INT)
repair_shops (owner_id→users, name, slug UNIQUE, address, city, lat, lng,
              description, phone, is_verified BOOL, is_premium BOOL)
shop_categories (shop_id→repair_shops, category repair_category_enum)
shop_hours (shop_id→repair_shops, day_of_week 0-6, open TIME, close TIME, is_closed BOOL)
work_orders (customer_id→users, shop_id→repair_shops, vehicle_id→vehicles,
             category, status work_order_status_enum, description, estimated_minutes)
work_order_updates (work_order_id→work_orders, status, note, photo_url, updated_by→users)
suppliers (shop_id→repair_shops, name, phone, whatsapp, note)
reviews (work_order_id→work_orders UNIQUE, customer_id→users, shop_id→repair_shops,
         rating 1-5, comment)
```

### Enum Tanımları
```sql
CREATE TYPE repair_category_enum AS ENUM
  ('motor','elektrik','kaporta','lastik','periyodik','klima','egzoz','yikama');

CREATE TYPE work_order_status_enum AS ENUM
  ('received','inspecting','in_progress','ready','delivered');
```

### Kritik İndeksler
```sql
-- Harita sorgusu (lat/lng)
CREATE INDEX idx_shops_location ON repair_shops(lat, lng);
-- Müşteri iş emirleri
CREATE INDEX idx_wo_customer ON work_orders(customer_id, created_at DESC);
-- Tamirci iş emirleri
CREATE INDEX idx_wo_shop ON work_orders(shop_id, status, created_at DESC);
-- Araç plaka araması
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
```

### Storage Buckets
```
shop-photos    → tamirci profil/dükkan fotoğrafları (public)
work-order-photos → DVI muayene fotoğrafları (authenticated only)
```

## Performans Kuralları
- N+1 query yasak → JOIN veya tek sorguda çek
- Real-time channel: sadece gerekli tablo/event
- Pagination: limit 20, cursor tabanlı (offset değil)
