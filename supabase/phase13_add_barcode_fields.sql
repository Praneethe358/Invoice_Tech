-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

alter table product_variants
  add column if not exists barcode text unique,
  add column if not exists barcode_source text check (barcode_source in ('scanned', 'generated'));

alter table inventory_logs
  add column if not exists variant_id uuid references product_variants(id) on delete set null;

-- Update existing product_variants to use sku as barcode, and barcode_source as 'generated' if null
update product_variants
set barcode = sku, barcode_source = 'generated'
where barcode is null;
