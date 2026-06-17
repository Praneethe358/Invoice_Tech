-- ═══════════════════════════════════════════
-- TruBill Invoice — Supabase Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ═══════════════════════════════════════════

-- shops table
create table shops (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  invoice_prefix text not null default 'INV',
  next_invoice_number integer not null default 1,
  created_at timestamptz not null default now()
);

-- products (saved catalog)
create table products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  created_at timestamptz not null default now()
);

-- invoices
create table invoices (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  invoice_number text not null,
  customer_phone text not null,
  customer_name text,
  payment_status text not null default 'paid',
  items jsonb not null,
  total numeric(10,2) not null,
  status text not null default 'created',
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════
-- Row Level Security
-- Each shop can only see its own data
-- ═══════════════════════════════════════════

alter table shops enable row level security;
alter table products enable row level security;
alter table invoices enable row level security;

create policy "own shop" on shops for all
  using (auth.uid() = auth_user_id);

create policy "own products" on products for all
  using (shop_id in (select id from shops where auth_user_id = auth.uid()));

create policy "own invoices" on invoices for all
  using (shop_id in (select id from shops where auth_user_id = auth.uid()));

-- ═══════════════════════════════════════════
-- Storage: shop-logos
-- ═══════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('shop-logos', 'shop-logos', true)
on conflict (id) do nothing;

create policy "Public Access" on storage.objects for select
  using (bucket_id = 'shop-logos');

create policy "Shop owners can upload logos" on storage.objects for insert
  with check (
    bucket_id = 'shop-logos' and
    auth.role() = 'authenticated'
  );

create policy "Shop owners can update logos" on storage.objects for update
  using (
    bucket_id = 'shop-logos' and
    auth.role() = 'authenticated'
  );

-- ═══════════════════════════════════════════
-- Customers table (Phase 3)
-- ═══════════════════════════════════════════

create table customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  name text not null,
  phone text not null,
  tag text not null default 'regular',
  total_invoices integer not null default 0,
  total_spent numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(shop_id, phone)
);

alter table customers enable row level security;

create policy "own customers" on customers for all
  using (
    shop_id in (select id from shops where auth_user_id = auth.uid())
  );

-- ═══════════════════════════════════════════
-- Payment Tracking (Phase 4)
-- ═══════════════════════════════════════════

alter table invoices 
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists amount_paid numeric(10,2) not null default 0,
  add column if not exists payment_note text,
  add column if not exists paid_at timestamptz,
  add column if not exists sent_reminders integer not null default 0;

-- ═══════════════════════════════════════════
-- Phase 5 Database Changes
-- ═══════════════════════════════════════════

-- Add shop classification and GST fields to shops
alter table shops
  add column if not exists shop_type text not null default 'other',
  add column if not exists gst_registered boolean not null default false,
  add column if not exists gstin text,
  add column if not exists business_type text not null default 'both',
  add column if not exists inventory_enabled boolean not null default false,
  add column if not exists onboarding_completed boolean not null default false;

-- Add HSN and GST fields to products catalog
alter table products
  add column if not exists hsn_code text,
  add column if not exists gst_rate numeric(5,2) not null default 0;

-- New invoice_items table (replaces items JSONB in invoices)
create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  name text not null,
  hsn_code text,
  price numeric(10,2) not null,
  qty integer not null default 1,
  gst_rate numeric(5,2) not null default 0,
  cgst numeric(10,2) not null default 0,
  sgst numeric(10,2) not null default 0,
  line_total numeric(10,2) not null,
  created_at timestamptz not null default now()
);

alter table invoice_items enable row level security;

create policy "own invoice items" on invoice_items for all
  using (
    invoice_id in (
      select id from invoices where shop_id in (
        select id from shops where auth_user_id = auth.uid()
      )
    )
  );

-- Add a flag to distinguish old vs new invoices:
alter table invoices
  add column if not exists uses_items_table boolean not null default false;

-- GST totals on invoices
alter table invoices
  add column if not exists subtotal numeric(10,2),
  add column if not exists total_cgst numeric(10,2) not null default 0,
  add column if not exists total_sgst numeric(10,2) not null default 0,
  add column if not exists total_gst numeric(10,2) not null default 0;

-- ═══════════════════════════════════════════
-- Phase 6 Database Changes
-- ═══════════════════════════════════════════

-- Payments table: each row = one payment received
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  customer_phone text not null,
  amount numeric(10,2) not null,
  payment_method text not null default 'cash',
  -- 'cash' | 'upi' | 'bank_transfer' | 'other'
  note text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table payments enable row level security;

create policy "own payments" on payments for all
  using (
    shop_id in (
      select id from shops where auth_user_id = auth.uid()
    )
  );

-- Add outstanding_balance to customers for quick lookup
alter table customers
  add column if not exists outstanding_balance numeric(10,2) not null default 0;

-- Add flag to distinguish old vs new invoices
alter table invoices
  add column if not exists uses_payments_table boolean not null default false;

-- ═══════════════════════════════════════════
-- Phase 7 Database Changes
-- ═══════════════════════════════════════════

-- Inventory fields on products
alter table products
  add column if not exists stock_qty integer not null default 0,
  add column if not exists low_stock_threshold integer not null default 5,
  add column if not exists track_inventory boolean not null default false,
  add column if not exists is_favorite boolean not null default false,
  add column if not exists category text,
  add column if not exists last_used_at timestamptz,
  add column if not exists use_count integer not null default 0;

-- Inventory history log
create table if not exists inventory_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete set null,
  change_qty integer not null,
  -- negative = stock deducted (invoice sent)
  -- positive = stock added (manual restock)
  previous_qty integer not null,
  new_qty integer not null,
  reason text not null default 'invoice',
  -- 'invoice' | 'restock' | 'adjustment' | 'return'
  created_at timestamptz not null default now()
);

alter table inventory_logs enable row level security;

create policy "own inventory logs" on inventory_logs for all
  using (
    shop_id in (
      select id from shops where auth_user_id = auth.uid()
    )
  );

