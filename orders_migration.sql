-- ============================================================
-- UMAMI BURGER — Orders migration
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS umamii_orders (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    items        JSONB NOT NULL,          -- [{name, quantity, price, category, image}]
    total        DECIMAL(10, 2) NOT NULL,
    customer_name TEXT,                  -- optional name the customer entered
    customer_note TEXT,                  -- optional note / delivery address
    status       TEXT NOT NULL DEFAULT 'pending',  -- pending | confirmed | rejected
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (public insert, only authenticated can read/update)
ALTER TABLE umamii_orders ENABLE ROW LEVEL SECURITY;

-- Allow the public (anon) to INSERT new orders
CREATE POLICY "Public can place orders"
    ON umamii_orders FOR INSERT
    WITH CHECK (true);

-- Allow the anon key to SELECT/UPDATE orders (admin uses same anon key)
CREATE POLICY "Anon can manage orders"
    ON umamii_orders FOR ALL
    USING (true)
    WITH CHECK (true);
