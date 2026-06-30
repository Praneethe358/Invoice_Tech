-- Migration: Add missing staff columns (name, invite_sent_at, joined_at)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

ALTER TABLE staff ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ;
