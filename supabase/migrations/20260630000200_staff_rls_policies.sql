-- Create security helper function to resolve shop IDs for the current user
create or replace function get_user_shop_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select id from shops where auth_user_id = auth.uid()
  union
  select shop_id from staff where auth_user_id = auth.uid() and status = 'active';
$$;

-- Recreate policies for shops
drop policy if exists "own shop" on shops;
create policy "own shop" on shops for all
  using (id in (select get_user_shop_ids()));

-- Recreate policies for products
drop policy if exists "own products" on products;
create policy "own products" on products for all
  using (shop_id in (select get_user_shop_ids()));

-- Recreate policies for invoices
drop policy if exists "own invoices" on invoices;
create policy "own invoices" on invoices for all
  using (shop_id in (select get_user_shop_ids()));

-- Recreate policies for customers
drop policy if exists "own customers" on customers;
create policy "own customers" on customers for all
  using (shop_id in (select get_user_shop_ids()));

-- Recreate policies for invoice_items
drop policy if exists "own invoice items" on invoice_items;
create policy "own invoice items" on invoice_items for all
  using (invoice_id in (select id from invoices where shop_id in (select get_user_shop_ids())));

-- Recreate policies for payments
drop policy if exists "own payments" on payments;
create policy "own payments" on payments for all
  using (shop_id in (select get_user_shop_ids()));

-- Recreate policies for inventory_logs
drop policy if exists "own inventory logs" on inventory_logs;
create policy "own inventory logs" on inventory_logs for all
  using (shop_id in (select get_user_shop_ids()));

-- Recreate policies for suppliers
drop policy if exists "own suppliers" on suppliers;
create policy "own suppliers" on suppliers for all
  using (shop_id in (select get_user_shop_ids()));

-- Recreate policies for purchases
drop policy if exists "own purchases" on purchases;
create policy "own purchases" on purchases for all
  using (shop_id in (select get_user_shop_ids()));

-- Recreate policies for purchase_items
drop policy if exists "own purchase items" on purchase_items;
create policy "own purchase items" on purchase_items for all
  using (purchase_id in (select id from purchases where shop_id in (select get_user_shop_ids())));

-- Recreate policies for credit_debit_notes
drop policy if exists "own credit debit notes" on credit_debit_notes;
create policy "own credit debit notes" on credit_debit_notes for all
  using (shop_id in (select get_user_shop_ids()));

-- Recreate policies for cdn_items
drop policy if exists "own cdn items" on cdn_items;
create policy "own cdn items" on cdn_items for all
  using (cdn_id in (select id from credit_debit_notes where shop_id in (select get_user_shop_ids())));

-- Recreate policies for data_exports
drop policy if exists "own exports" on data_exports;
create policy "own exports" on data_exports for all
  using (shop_id in (select get_user_shop_ids()));

-- Recreate policies for product_variants
drop policy if exists "own product variants" on product_variants;
create policy "own product variants" on product_variants for all
  using (product_id in (select id from products where shop_id in (select get_user_shop_ids())));

-- Recreate policies for audit_logs
drop policy if exists "own shop audit logs" on audit_logs;
create policy "own shop audit logs" on audit_logs for select
  using (shop_id in (select get_user_shop_ids()));

-- Recreate policies for staff
drop policy if exists "own shop staff" on staff;
create policy "own shop staff" on staff for all
  using (shop_id in (select get_user_shop_ids()) or auth_user_id = auth.uid());
