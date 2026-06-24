-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

-- 1. Add whatsapp_invoices_sent column to shops table
alter table shops
  add column if not exists whatsapp_invoices_sent integer not null default 0;
