-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

-- Fix RLS policy on invoice_audit_logs to support staff members as well as shop owners
drop policy if exists "own audit logs" on invoice_audit_logs;

create policy "own audit logs" on invoice_audit_logs for all
  using (shop_id in (select get_user_shop_ids()));
