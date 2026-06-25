-- Phase 17: Wholesale Price, GST rate slabs, and Cost/Min Selling Prices
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

-- 1. Ensure wholesale_price exists in products (it was added in phase 13, but let's make sure)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC(10, 2) DEFAULT NULL;

-- 2. Add cost_price and min_selling_price columns to product_variants table
ALTER TABLE product_variants
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS min_selling_price NUMERIC(10, 2) DEFAULT NULL;

-- 3. Add passcode column to shops and staff tables for roles-aware manager approval passcode
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS passcode TEXT DEFAULT NULL;

ALTER TABLE staff
ADD COLUMN IF NOT EXISTS passcode TEXT DEFAULT NULL;
