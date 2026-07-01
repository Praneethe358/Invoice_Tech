# Database RLS Policy Fix for Shop Onboarding

## Root Cause
When registering any new shop, the signup flow calls Supabase `insert` on the `shops` table. 

Recently, the following policy was added to the `shops` table:
```sql
CREATE POLICY "own shop" ON shops FOR ALL
  USING (id IN (SELECT get_user_shop_ids()));
```

And `get_user_shop_ids()` was defined as:
```sql
CREATE OR REPLACE FUNCTION get_user_shop_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM shops WHERE auth_user_id = auth.uid()
  UNION
  SELECT shop_id FROM staff WHERE auth_user_id = auth.uid() AND status = 'active';
$$;
```

Because this is a `FOR ALL` policy, PostgreSQL uses it as both the `USING` condition (for SELECT, UPDATE, DELETE) and the `WITH CHECK` condition (for INSERT).

During a new user registration:
1. The user's auth account is created.
2. The user client attempts to insert the new shop row.
3. PostgreSQL evaluates the RLS policy check: `id IN (SELECT get_user_shop_ids())`.
4. The `get_user_shop_ids()` function executes, but since the transaction is not yet complete and the shop is only now being inserted, the select query returns an empty set.
5. The check fails, throwing: `new row violates row-level security policy for table "shops"`.

This aborted the shop creation but left the user auth account created in Supabase auth, leading to the *"account created but it is not opening"* state.

---

## The Solution
To fix this, we split the `shops` policy:
1. Allow authenticated users to **insert** their own shop rows directly based on their `auth_user_id`.
2. Restrict **select, update, and delete** operations to only the owner and active staff using `get_user_shop_ids()`.

---

## How to Apply the Fix

### Option A: Run in Supabase SQL Editor (Recommended)
Copy the following SQL commands and run them in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql):

```sql
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
```

---

## Codebase Alignment
The following migration files have been created/updated in the codebase to align with this fix:
- `supabase/migrations/20260701000000_fix_shops_rls.sql` (New Migration)
- `supabase/phase19_fix_shops_rls.sql` (Phase Update)
- `supabase/migrations/20260630000200_staff_rls_policies.sql` (Retroactive fix to original migration file)
