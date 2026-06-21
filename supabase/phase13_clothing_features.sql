-- ═══════════════════════════════════════════
-- TruBill Invoice — Phase 13: Clothing Features
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ═══════════════════════════════════════════

-- 1. Customers: price_tier column
alter table customers 
  add column if not exists price_tier text default 'retail' check (price_tier in ('retail', 'wholesale'));

-- 2. Products: wholesale_price and season_tag columns
alter table products 
  add column if not exists wholesale_price numeric(10,2),
  add column if not exists season_tag text;

-- 3. Product Variants table
create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size text not null,
  color text not null,
  sku text not null unique,
  stock_qty integer not null default 0,
  low_stock_threshold integer not null default 5,
  created_at timestamptz not null default now()
);

-- Enable RLS for product_variants
alter table product_variants enable row level security;

-- Drop policy if exists and create
drop policy if exists "own product variants" on product_variants;
create policy "own product variants" on product_variants for all
  using (
    product_id in (
      select id from products where shop_id in (
        select id from shops where auth_user_id = auth.uid()
      )
    )
  );

-- 4. Invoices and Returns schema additions
alter table invoice_items 
  add column if not exists variant_id uuid references product_variants(id) on delete set null;

alter table credit_debit_notes 
  add column if not exists return_condition text check (return_condition in ('tags_intact', 'worn', 'altered'));

alter table cdn_items 
  add column if not exists variant_id uuid references product_variants(id) on delete set null;
