-- Phase 18: City, State, Pincode Shop Details
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

ALTER TABLE shops
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pincode TEXT DEFAULT NULL;
