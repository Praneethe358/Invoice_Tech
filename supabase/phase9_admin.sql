-- ═══════════════════════════════════════════
-- Phase 9: Admin Dashboard — Database Changes
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════

-- 1. Admin table
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) 
    on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

create policy "admin reads own row" on admins
  for select using (auth.uid() = auth_user_id);

-- 2. Subscription tracking on shops
alter table shops
  add column if not exists subscription_status text 
    not null default 'trial',
  add column if not exists trial_ends_at timestamptz,
  add column if not exists subscription_ends_at timestamptz,
  add column if not exists subscription_started_at timestamptz,
  add column if not exists subscription_notes text;

-- 3. Backfill trial_ends_at for existing shops
update shops 
set trial_ends_at = created_at + interval '14 days'
where trial_ends_at is null;

-- 4. Insert Praneeth as admin
insert into admins (auth_user_id) 
values ('a24f626f-c941-4759-b9d4-6e4f3039555e')
on conflict do nothing;
