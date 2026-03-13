-- Migration: Add sort_order column to umamii_products
-- This allows drag-and-drop reordering of products in the admin catalog.
-- Run this in the Supabase SQL editor once.

ALTER TABLE "umamii_products"
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Initialize sort_order based on current row id order (alphabetical by name within category)
-- so existing products get a baseline order.
UPDATE "umamii_products" p
SET sort_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY category, name) AS rn
  FROM "umamii_products"
) sub
WHERE p.id = sub.id;
