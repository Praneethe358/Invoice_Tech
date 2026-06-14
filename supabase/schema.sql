-- ═══════════════════════════════════════════
-- Vynkrova Invoice — Supabase Schema
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
