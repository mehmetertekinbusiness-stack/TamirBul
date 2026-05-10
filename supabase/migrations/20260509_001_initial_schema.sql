-- TamirBul — Temel Şema
-- Migration: 001_initial_schema
-- Uygula: migration-apply skill veya supabase db push

-- ─── Enum Tipleri ─────────────────────────────────────────────────────────────

CREATE TYPE repair_category_enum AS ENUM (
  'motor',
  'elektrik',
  'kaporta',
  'lastik',
  'periyodik',
  'klima',
  'egzoz',
  'yikama'
);

CREATE TYPE work_order_status_enum AS ENUM (
  'received',
  'inspecting',
  'in_progress',
  'ready',
  'delivered'
);

-- ─── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id    TEXT UNIQUE NOT NULL,
  role        TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'mechanic')),
  full_name   TEXT,
  phone       TEXT,
  push_token  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_self_read"   ON users FOR SELECT USING (clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub');
CREATE POLICY "users_self_update" ON users FOR UPDATE USING (clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub');
CREATE POLICY "users_insert"      ON users FOR INSERT WITH CHECK (clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub');

-- ─── Vehicles ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plate       TEXT NOT NULL,
  brand       TEXT NOT NULL,
  model       TEXT NOT NULL,
  year        INT,
  km          INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id, plate)
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_owner_all" ON vehicles
  USING (owner_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'))
  WITH CHECK (owner_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'));

CREATE INDEX idx_vehicles_owner ON vehicles(owner_id);

-- ─── Repair Shops ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS repair_shops (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  address      TEXT,
  city         TEXT NOT NULL DEFAULT 'İstanbul',
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  description  TEXT,
  phone        TEXT,
  is_verified  BOOLEAN NOT NULL DEFAULT false,
  is_premium   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE repair_shops ENABLE ROW LEVEL SECURITY;

-- Herkese okuma (harita keşfi için)
CREATE POLICY "shops_public_read"  ON repair_shops FOR SELECT USING (true);
-- Sadece sahibi düzenleyebilir
CREATE POLICY "shops_owner_write"  ON repair_shops FOR ALL
  USING (owner_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'))
  WITH CHECK (owner_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'));

-- Harita sorgusu için
CREATE INDEX idx_shops_location ON repair_shops(lat, lng);
CREATE INDEX idx_shops_city     ON repair_shops(city);

-- ─── Shop Categories ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shop_categories (
  shop_id   UUID NOT NULL REFERENCES repair_shops(id) ON DELETE CASCADE,
  category  repair_category_enum NOT NULL,
  PRIMARY KEY (shop_id, category)
);

ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_cats_public_read" ON shop_categories FOR SELECT USING (true);
CREATE POLICY "shop_cats_owner_write" ON shop_categories FOR ALL
  USING (shop_id IN (
    SELECT id FROM repair_shops WHERE owner_id IN (
      SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  ));

-- ─── Shop Hours ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shop_hours (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     UUID NOT NULL REFERENCES repair_shops(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Pazar
  open_time   TIME NOT NULL DEFAULT '09:00',
  close_time  TIME NOT NULL DEFAULT '18:00',
  is_closed   BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(shop_id, day_of_week)
);

ALTER TABLE shop_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_hours_public_read" ON shop_hours FOR SELECT USING (true);
CREATE POLICY "shop_hours_owner_write" ON shop_hours FOR ALL
  USING (shop_id IN (
    SELECT id FROM repair_shops WHERE owner_id IN (
      SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  ));

-- ─── Work Orders ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS work_orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id        UUID NOT NULL REFERENCES users(id),
  shop_id            UUID NOT NULL REFERENCES repair_shops(id),
  vehicle_id         UUID REFERENCES vehicles(id),
  category           repair_category_enum NOT NULL,
  status             work_order_status_enum NOT NULL DEFAULT 'received',
  description        TEXT,
  estimated_minutes  INT,
  mechanic_note      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Müşteri: kendi iş emirlerini görür
CREATE POLICY "wo_customer_read" ON work_orders FOR SELECT
  USING (customer_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'));

-- Tamirci: kendi dükkanına gelen iş emirlerini görür
CREATE POLICY "wo_mechanic_read" ON work_orders FOR SELECT
  USING (shop_id IN (
    SELECT id FROM repair_shops WHERE owner_id IN (
      SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  ));

-- Müşteri: iş emri oluşturabilir
CREATE POLICY "wo_customer_insert" ON work_orders FOR INSERT
  WITH CHECK (customer_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'));

-- Tamirci: durum güncelleyebilir
CREATE POLICY "wo_mechanic_update" ON work_orders FOR UPDATE
  USING (shop_id IN (
    SELECT id FROM repair_shops WHERE owner_id IN (
      SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  ));

CREATE INDEX idx_wo_customer ON work_orders(customer_id, created_at DESC);
CREATE INDEX idx_wo_shop     ON work_orders(shop_id, status, created_at DESC);

-- ─── Work Order Updates (İş Emri Günlüğü) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS work_order_updates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id  UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  status         work_order_status_enum NOT NULL,
  note           TEXT,
  photo_url      TEXT,
  updated_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE work_order_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wou_related_read" ON work_order_updates FOR SELECT
  USING (work_order_id IN (
    SELECT id FROM work_orders
    WHERE customer_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub')
       OR shop_id IN (
         SELECT id FROM repair_shops WHERE owner_id IN (
           SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
         )
       )
  ));

CREATE POLICY "wou_mechanic_insert" ON work_order_updates FOR INSERT
  WITH CHECK (updated_by IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'));

CREATE INDEX idx_wou_work_order ON work_order_updates(work_order_id, created_at DESC);

-- ─── Suppliers (Tedarikçi Defteri) ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS suppliers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id    UUID NOT NULL REFERENCES repair_shops(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  phone      TEXT,
  whatsapp   TEXT,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_owner_all" ON suppliers
  USING (shop_id IN (
    SELECT id FROM repair_shops WHERE owner_id IN (
      SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'
    )
  ));

-- ─── Reviews ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id  UUID UNIQUE NOT NULL REFERENCES work_orders(id),
  customer_id    UUID NOT NULL REFERENCES users(id),
  shop_id        UUID NOT NULL REFERENCES repair_shops(id),
  rating         INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_read"    ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_customer_write" ON reviews FOR INSERT
  WITH CHECK (customer_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::jsonb->>'sub'));

CREATE INDEX idx_reviews_shop ON reviews(shop_id, created_at DESC);

-- ─── Updated At Trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at        BEFORE UPDATE ON users        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_shops_updated_at        BEFORE UPDATE ON repair_shops FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_work_orders_updated_at  BEFORE UPDATE ON work_orders  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Storage Buckets ──────────────────────────────────────────────────────────
-- Bu SQL'ler dashboard'dan ya da ayrı bir adımda yapılacak:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('shop-photos', 'shop-photos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('work-order-photos', 'work-order-photos', false);
