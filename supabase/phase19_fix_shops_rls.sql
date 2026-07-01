-- Phase 19: Fix Shops RLS Policies
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

-- Drop the recursive policy
DROP POLICY IF EXISTS "own shop" ON shops;

-- Create separate SELECT, INSERT, UPDATE, DELETE policies to prevent infinite recursion
CREATE POLICY "select own shop" ON shops FOR SELECT
  USING (id IN (SELECT get_user_shop_ids()));

CREATE POLICY "insert own shop" ON shops FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "update own shop" ON shops FOR UPDATE
  USING (id IN (SELECT get_user_shop_ids()));

CREATE POLICY "delete own shop" ON shops FOR DELETE
  USING (id IN (SELECT get_user_shop_ids()));
