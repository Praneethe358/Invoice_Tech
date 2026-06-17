-- ═══════════════════════════════════════════
-- SQL Cleanup: Remove Unused Database Ledger Calculation Objects
-- Run this in your Supabase SQL Editor to drop the tables, triggers, and functions
-- ═══════════════════════════════════════════

-- 1. Drop Triggers
DROP TRIGGER IF EXISTS trigger_sync_invoice_to_ledger ON invoices CASCADE;
DROP TRIGGER IF EXISTS trigger_sync_invoice_delete_to_ledger ON invoices CASCADE;
DROP TRIGGER IF EXISTS trigger_sync_payment_to_ledger ON payments CASCADE;
DROP TRIGGER IF EXISTS trigger_sync_payment_delete_to_ledger ON payments CASCADE;

-- 2. Drop Functions
DROP FUNCTION IF EXISTS sync_invoice_to_ledger() CASCADE;
DROP FUNCTION IF EXISTS sync_invoice_delete_to_ledger() CASCADE;
DROP FUNCTION IF EXISTS sync_payment_to_ledger() CASCADE;
DROP FUNCTION IF EXISTS sync_payment_delete_to_ledger() CASCADE;
DROP FUNCTION IF EXISTS get_customer_ledger_with_balances(uuid,uuid,timestamptz,timestamptz,integer,integer) CASCADE;

-- 3. Drop Unused Tables
DROP TABLE IF EXISTS customer_ledger_entries CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
