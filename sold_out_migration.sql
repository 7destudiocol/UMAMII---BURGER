-- Run this in the Supabase SQL Editor to add the sold_out column to products
ALTER TABLE umamii_products ADD COLUMN IF NOT EXISTS sold_out BOOLEAN DEFAULT false;
