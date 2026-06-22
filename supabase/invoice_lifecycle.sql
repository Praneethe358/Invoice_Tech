-- ═══════════════════════════════════════════
-- TruBill Invoice — Invoice Lifecycle System SQL Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ═══════════════════════════════════════════

-- 1. Add fields to invoices table
alter table invoices 
  add column if not exists sent_at timestamptz,
  add column if not exists sent_by uuid references auth.users(id),
  add column if not exists delivery_status text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_reason text;

-- 2. Map existing statuses
update invoices set delivery_status = 'failed', status = 'sent' where status = 'failed';
update invoices set status = 'sent' where status = 'created';

-- 3. Add constraint on status column
alter table invoices 
  drop constraint if exists invoices_status_check;

alter table invoices 
  add constraint invoices_status_check 
  check (status in ('draft', 'saved', 'sent', 'cancelled'));

-- 4. Create Audit Logs table
create table if not exists invoice_audit_logs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('created', 'saved', 'sent', 'cancelled')),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table invoice_audit_logs enable row level security;

-- Policies for RLS
drop policy if exists "own audit logs" on invoice_audit_logs;
create policy "own audit logs" on invoice_audit_logs for all
  using (shop_id in (select id from shops where auth_user_id = auth.uid()));

-- 5. Atomic Transaction: Create Invoice (Draft or Saved)
create or replace function create_invoice_sec(
  p_shop_id uuid,
  p_customer_phone text,
  p_customer_name text,
  p_customer_gstin text,
  p_payment_status text,
  p_amount_paid numeric,
  p_payment_method text,
  p_payment_note text,
  p_items jsonb,
  p_subtotal numeric,
  p_total_cgst numeric,
  p_total_sgst numeric,
  p_total_gst numeric,
  p_total numeric,
  p_status text, -- 'draft' or 'saved'
  p_user_id uuid
) returns jsonb as $$
declare
  v_next_num int;
  v_prefix text;
  v_invoice_number text;
  v_invoice_id uuid;
  v_item jsonb;
  v_prod_id uuid;
  v_stock_qty int;
  v_track_inventory boolean;
  v_cust_id uuid;
  v_customer_spent numeric;
  v_customer_invoices int;
  v_total_billed numeric;
  v_total_paid numeric;
  v_variant_stock int;
  v_total_credit numeric;
  v_total_debit numeric;
begin
  -- Lock shop row and get/increment invoice number
  select next_invoice_number, invoice_prefix into v_next_num, v_prefix 
  from shops where id = p_shop_id for update;
  
  v_invoice_number := v_prefix || '-' || lpad(v_next_num::text, 4, '0');
  update shops set next_invoice_number = next_invoice_number + 1 where id = p_shop_id;

  -- Insert invoice
  insert into invoices (
    shop_id,
    invoice_number,
    customer_phone,
    customer_name,
    customer_gstin,
    payment_status,
    amount_paid,
    paid_at,
    items,
    total,
    status,
    uses_items_table,
    uses_payments_table,
    subtotal,
    total_cgst,
    total_sgst,
    total_gst
  ) values (
    p_shop_id,
    v_invoice_number,
    p_customer_phone,
    p_customer_name,
    p_customer_gstin,
    p_payment_status,
    case when p_status = 'draft' then 0 else p_amount_paid end,
    case when p_status = 'saved' and p_payment_status = 'paid' then now() else null end,
    p_items,
    p_total,
    p_status,
    true,
    case when p_status = 'draft' then false else (p_payment_status = 'paid' or p_payment_status = 'partial') end,
    p_subtotal,
    p_total_cgst,
    p_total_sgst,
    p_total_gst
  ) returning id into v_invoice_id;

  -- Insert into invoice_items
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into invoice_items (
      invoice_id,
      name,
      hsn_code,
      price,
      qty,
      gst_rate,
      cgst,
      sgst,
      line_total,
      variant_id
    ) values (
      v_invoice_id,
      (v_item->>'name'),
      (v_item->>'hsn_code'),
      (v_item->>'price')::numeric,
      (v_item->>'quantity')::int,
      (v_item->>'gst_rate')::numeric,
      (v_item->>'cgst')::numeric,
      (v_item->>'sgst')::numeric,
      (v_item->>'line_total')::numeric,
      (v_item->>'variant_id')::uuid
    );
  end loop;

  -- Write created audit log
  insert into invoice_audit_logs (invoice_id, shop_id, user_id, action)
  values (v_invoice_id, p_shop_id, p_user_id, 'created');

  -- If status is saved, perform all business logic
  if p_status = 'saved' then
    -- Process Inventory
    for v_item in select * from jsonb_array_elements(p_items) loop
      select id, stock_qty, track_inventory into v_prod_id, v_stock_qty, v_track_inventory
      from products where shop_id = p_shop_id and name = (v_item->>'name') limit 1;
      
      if v_prod_id is not null then
        update products set 
          last_used_at = now(),
          use_count = coalesce(use_count, 0) + 1
        where id = v_prod_id;

        if v_track_inventory = true then
          if (v_item->>'variant_id') is not null then
            select stock_qty into v_variant_stock from product_variants where id = (v_item->>'variant_id')::uuid;
            if v_variant_stock < (v_item->>'quantity')::int then
              raise exception 'INSUFFICIENT_STOCK: %', (v_item->>'name');
            end if;

            update product_variants set stock_qty = stock_qty - (v_item->>'quantity')::int where id = (v_item->>'variant_id')::uuid;

            insert into inventory_logs (shop_id, product_id, invoice_id, variant_id, change_qty, previous_qty, new_qty, reason)
            values (
              p_shop_id,
              v_prod_id,
              v_invoice_id,
              (v_item->>'variant_id')::uuid,
              -(v_item->>'quantity')::int,
              v_variant_stock,
              v_variant_stock - (v_item->>'quantity')::int,
              'invoice'
            );
          else
            if v_stock_qty < (v_item->>'quantity')::int then
              raise exception 'INSUFFICIENT_STOCK: %', (v_item->>'name');
            end if;

            update products set stock_qty = stock_qty - (v_item->>'quantity')::int where id = v_prod_id;

            insert into inventory_logs (shop_id, product_id, invoice_id, change_qty, previous_qty, new_qty, reason)
            values (
              p_shop_id,
              v_prod_id,
              v_invoice_id,
              -(v_item->>'quantity')::int,
              v_stock_qty,
              v_stock_qty - (v_item->>'quantity')::int,
              'invoice'
            );
          end if;
        end if;
      end if;
    end loop;

    -- Process Payments
    if p_payment_status = 'paid' or p_payment_status = 'partial' then
      insert into payments (
        invoice_id,
        shop_id,
        customer_phone,
        amount,
        payment_method,
        note,
        paid_at
      ) values (
        v_invoice_id,
        p_shop_id,
        p_customer_phone,
        p_amount_paid,
        p_payment_method,
        coalesce(p_payment_note, case when p_payment_status = 'paid' then 'Paid on invoice creation' else 'Partial payment on invoice creation' end),
        now()
      );
    end if;

    -- Process Customer Ledger
    -- Get or create customer
    insert into customers (shop_id, phone, name, tag, total_invoices, total_spent, gstin)
    values (
      p_shop_id,
      p_customer_phone,
      coalesce(p_customer_name, 'CUSTOMER'),
      'regular',
      0,
      0,
      p_customer_gstin
    )
    on conflict (shop_id, phone) do update
    set 
      name = coalesce(p_customer_name, customers.name),
      gstin = coalesce(p_customer_gstin, customers.gstin);

    -- Sync customer totals
    select count(*), coalesce(sum(total), 0) into v_customer_invoices, v_total_billed
    from invoices where shop_id = p_shop_id and customer_phone = p_customer_phone and status in ('saved', 'sent');

    select coalesce(sum(amount), 0) into v_total_paid
    from payments where shop_id = p_shop_id and customer_phone = p_customer_phone
    and invoice_id in (select id from invoices where shop_id = p_shop_id and customer_phone = p_customer_phone and status in ('saved', 'sent'));

    select coalesce(sum(total), 0) into v_total_credit
    from credit_debit_notes
    where shop_id = p_shop_id 
      and customer_phone = p_customer_phone 
      and note_type = 'credit';

    select coalesce(sum(total), 0) into v_total_debit
    from credit_debit_notes
    where shop_id = p_shop_id 
      and customer_phone = p_customer_phone 
      and note_type = 'debit';

    update customers set
      total_invoices = v_customer_invoices,
      total_spent = v_total_paid,
      outstanding_balance = greatest(0, v_total_billed + v_total_debit - v_total_paid - v_total_credit)
    where shop_id = p_shop_id and phone = p_customer_phone;

    -- Write saved audit log
    insert into invoice_audit_logs (invoice_id, shop_id, user_id, action)
    values (v_invoice_id, p_shop_id, p_user_id, 'saved');
  end if;

  return jsonb_build_object('id', v_invoice_id, 'invoice_number', v_invoice_number);
end;
$$ language plpgsql;

-- 6. Atomic Transaction: Promote Draft Invoice to Saved Status
create or replace function save_invoice_tx(
  p_invoice_id uuid,
  p_user_id uuid
) returns boolean as $$
declare
  v_shop_id uuid;
  v_status text;
  v_customer_phone text;
  v_customer_name text;
  v_customer_gstin text;
  v_payment_status text;
  v_amount_paid numeric;
  v_payment_method text;
  v_payment_note text;
  v_total numeric;
  v_item record;
  v_prod_id uuid;
  v_stock_qty int;
  v_track_inventory boolean;
  v_customer_invoices int;
  v_total_billed numeric;
  v_total_paid numeric;
  v_variant_stock int;
  v_total_credit numeric;
  v_total_debit numeric;
begin
  -- Get invoice info
  select shop_id, status, customer_phone, customer_name, customer_gstin, payment_status, amount_paid, total
  into v_shop_id, v_status, v_customer_phone, v_customer_name, v_customer_gstin, v_payment_status, v_amount_paid, v_total
  from invoices where id = p_invoice_id;

  if v_status != 'draft' then
    raise exception 'Invoice is not in draft status';
  end if;

  -- Process Inventory
  for v_item in select name, qty, variant_id from invoice_items where invoice_id = p_invoice_id loop
    select id, stock_qty, track_inventory into v_prod_id, v_stock_qty, v_track_inventory
    from products where shop_id = v_shop_id and name = v_item.name limit 1;

    if v_prod_id is not null then
      update products set 
        last_used_at = now(),
        use_count = coalesce(use_count, 0) + 1
      where id = v_prod_id;

      if v_track_inventory = true then
        if v_item.variant_id is not null then
          select stock_qty into v_variant_stock from product_variants where id = v_item.variant_id;
          if v_variant_stock < v_item.qty then
            raise exception 'INSUFFICIENT_STOCK: %', v_item.name;
          end if;

          update product_variants set stock_qty = stock_qty - v_item.qty where id = v_item.variant_id;

          insert into inventory_logs (shop_id, product_id, invoice_id, variant_id, change_qty, previous_qty, new_qty, reason)
          values (
            v_shop_id,
            v_prod_id,
            p_invoice_id,
            v_item.variant_id,
            -v_item.qty,
            v_variant_stock,
            v_variant_stock - v_item.qty,
            'invoice'
          );
        else
          if v_stock_qty < v_item.qty then
            raise exception 'INSUFFICIENT_STOCK: %', v_item.name;
          end if;

          update products set stock_qty = stock_qty - v_item.qty where id = v_prod_id;

          insert into inventory_logs (shop_id, product_id, invoice_id, change_qty, previous_qty, new_qty, reason)
          values (
            v_shop_id,
            v_prod_id,
            p_invoice_id,
            -v_item.qty,
            v_stock_qty,
            v_stock_qty - v_item.qty,
            'invoice'
          );
        end if;
      end if;
    end if;
  end loop;

  -- Process Payments
  if v_payment_status = 'paid' or v_payment_status = 'partial' then
    -- Verify if payment already exists
    if not exists (select 1 from payments where invoice_id = p_invoice_id) then
      insert into payments (
        invoice_id,
        shop_id,
        customer_phone,
        amount,
        payment_method,
        note,
        paid_at
      ) values (
        p_invoice_id,
        v_shop_id,
        v_customer_phone,
        v_amount_paid,
        'cash',
        case when v_payment_status = 'paid' then 'Paid on invoice creation' else 'Partial payment on invoice creation' end,
        now()
      );
    end if;
  end if;

  -- Update status
  update invoices set 
    status = 'saved',
    uses_payments_table = (v_payment_status = 'paid' or v_payment_status = 'partial'),
    paid_at = case when v_payment_status = 'paid' then now() else null end
  where id = p_invoice_id;

  -- Update Customer Ledger / outstanding
  insert into customers (shop_id, phone, name, tag, total_invoices, total_spent, gstin)
  values (
    v_shop_id,
    v_customer_phone,
    coalesce(v_customer_name, 'CUSTOMER'),
    'regular',
    0,
    0,
    v_customer_gstin
  )
  on conflict (shop_id, phone) do update
  set 
    name = coalesce(v_customer_name, customers.name),
    gstin = coalesce(v_customer_gstin, customers.gstin);

  -- Sync customer totals
  select count(*), coalesce(sum(total), 0) into v_customer_invoices, v_total_billed
  from invoices where shop_id = v_shop_id and customer_phone = v_customer_phone and status in ('saved', 'sent');

  select coalesce(sum(amount), 0) into v_total_paid
  from payments where shop_id = v_shop_id and customer_phone = v_customer_phone
  and invoice_id in (select id from invoices where shop_id = v_shop_id and customer_phone = v_customer_phone and status in ('saved', 'sent'));

  select coalesce(sum(total), 0) into v_total_credit
  from credit_debit_notes
  where shop_id = v_shop_id 
    and customer_phone = v_customer_phone 
    and note_type = 'credit';

  select coalesce(sum(total), 0) into v_total_debit
  from credit_debit_notes
  where shop_id = v_shop_id 
    and customer_phone = v_customer_phone 
    and note_type = 'debit';

  update customers set
    total_invoices = v_customer_invoices,
    total_spent = v_total_paid,
    outstanding_balance = greatest(0, v_total_billed + v_total_debit - v_total_paid - v_total_credit)
  where shop_id = v_shop_id and phone = v_customer_phone;

  -- Audit log
  insert into invoice_audit_logs (invoice_id, shop_id, user_id, action)
  values (p_invoice_id, v_shop_id, p_user_id, 'saved');

  return true;
end;
$$ language plpgsql;

-- 7. Atomic Transaction: Cancel Invoice (Reverse everything)
create or replace function cancel_invoice_tx(
  p_invoice_id uuid,
  p_user_id uuid,
  p_reason text
) returns boolean as $$
declare
  v_shop_id uuid;
  v_status text;
  v_customer_phone text;
  v_item record;
  v_prod_id uuid;
  v_stock_qty int;
  v_track_inventory boolean;
  v_customer_invoices int;
  v_total_billed numeric;
  v_total_paid numeric;
  v_variant_stock int;
  v_total_credit numeric;
  v_total_debit numeric;
begin
  select shop_id, status, customer_phone into v_shop_id, v_status, v_customer_phone
  from invoices where id = p_invoice_id;

  if v_status = 'cancelled' then
    raise exception 'Invoice is already cancelled';
  end if;

  if v_status = 'draft' then
    raise exception 'Draft invoices cannot be cancelled, they must be deleted';
  end if;

  -- 1. Restore stock
  for v_item in select name, qty, variant_id from invoice_items where invoice_id = p_invoice_id loop
    select id, stock_qty, track_inventory into v_prod_id, v_stock_qty, v_track_inventory
    from products where shop_id = v_shop_id and name = v_item.name limit 1;

    if v_prod_id is not null then
      update products set 
        use_count = greatest(0, coalesce(use_count, 0) - 1)
      where id = v_prod_id;

      if v_track_inventory = true then
        if v_item.variant_id is not null then
          select stock_qty into v_variant_stock from product_variants where id = v_item.variant_id;

          update product_variants set stock_qty = stock_qty + v_item.qty where id = v_item.variant_id;

          insert into inventory_logs (shop_id, product_id, invoice_id, variant_id, change_qty, previous_qty, new_qty, reason)
          values (
            v_shop_id,
            v_prod_id,
            p_invoice_id,
            v_item.variant_id,
            v_item.qty,
            v_variant_stock,
            v_variant_stock + v_item.qty,
            'return'
          );
        else
          update products set stock_qty = stock_qty + v_item.qty where id = v_prod_id;

          insert into inventory_logs (shop_id, product_id, invoice_id, change_qty, previous_qty, new_qty, reason)
          values (
            v_shop_id,
            v_prod_id,
            p_invoice_id,
            v_item.qty,
            v_stock_qty,
            v_stock_qty + v_item.qty,
            'return'
          );
        end if;
      end if;
    end if;
  end loop;

  -- 2. Delete payments associated with this invoice (Reversing payment calculations)
  delete from payments where invoice_id = p_invoice_id;

  -- 3. Update invoice status
  update invoices set 
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_reason = p_reason
  where id = p_invoice_id;

  -- 4. Sync customer ledger / outstanding
  select count(*), coalesce(sum(total), 0) into v_customer_invoices, v_total_billed
  from invoices where shop_id = v_shop_id and customer_phone = v_customer_phone and status in ('saved', 'sent');

  select coalesce(sum(amount), 0) into v_total_paid
  from payments where shop_id = v_shop_id and customer_phone = v_customer_phone
  and invoice_id in (select id from invoices where shop_id = v_shop_id and customer_phone = v_customer_phone and status in ('saved', 'sent'));

  select coalesce(sum(total), 0) into v_total_credit
  from credit_debit_notes
  where shop_id = v_shop_id 
    and customer_phone = v_customer_phone 
    and note_type = 'credit';

  select coalesce(sum(total), 0) into v_total_debit
  from credit_debit_notes
  where shop_id = v_shop_id 
    and customer_phone = v_customer_phone 
    and note_type = 'debit';

  update customers set
    total_invoices = v_customer_invoices,
    total_spent = v_total_paid,
    outstanding_balance = greatest(0, v_total_billed + v_total_debit - v_total_paid - v_total_credit)
  where shop_id = v_shop_id and phone = v_customer_phone;

  -- 5. Write cancelled audit log
  insert into invoice_audit_logs (invoice_id, shop_id, user_id, action)
  values (p_invoice_id, v_shop_id, p_user_id, 'cancelled');

  return true;
end;
$$ language plpgsql;
