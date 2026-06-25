-- Phase 16: Resolve Product ID by Variant ID in Invoice Lifecycle SQL Triggers
-- Run this migration in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Atomic Transaction: Create Invoice (Draft or Saved)
CREATE OR REPLACE FUNCTION create_invoice_sec(
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
) RETURNS jsonb AS $$
DECLARE
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
BEGIN
  -- Lock shop row and get/increment invoice number
  SELECT next_invoice_number, invoice_prefix INTO v_next_num, v_prefix 
  FROM shops WHERE id = p_shop_id FOR UPDATE;
  
  v_invoice_number := v_prefix || '-' || LPAD(v_next_num::text, 4, '0');
  UPDATE shops SET next_invoice_number = next_invoice_number + 1 WHERE id = p_shop_id;

  -- Insert invoice
  INSERT INTO invoices (
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
  ) VALUES (
    p_shop_id,
    v_invoice_number,
    p_customer_phone,
    p_customer_name,
    p_customer_gstin,
    p_payment_status,
    CASE WHEN p_status = 'draft' then 0 ELSE p_amount_paid END,
    CASE WHEN p_status = 'saved' AND p_payment_status = 'paid' then now() ELSE NULL END,
    p_items,
    p_total,
    p_status,
    true,
    CASE WHEN p_status = 'draft' then false ELSE (p_payment_status = 'paid' or p_payment_status = 'partial') END,
    p_subtotal,
    p_total_cgst,
    p_total_sgst,
    p_total_gst
  ) RETURNING id INTO v_invoice_id;

  -- Insert into invoice_items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO invoice_items (
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
    ) VALUES (
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
  END LOOP;

  -- Write created audit log
  INSERT INTO invoice_audit_logs (invoice_id, shop_id, user_id, action)
  VALUES (v_invoice_id, p_shop_id, p_user_id, 'created');

  -- If status is saved, perform all business logic
  IF p_status = 'saved' THEN
    -- Process Inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      IF (v_item->>'variant_id') IS NOT NULL THEN
        SELECT product_id INTO v_prod_id FROM product_variants WHERE id = (v_item->>'variant_id')::uuid;
        IF v_prod_id IS NOT NULL THEN
          SELECT stock_qty, track_inventory INTO v_stock_qty, v_track_inventory
          FROM products WHERE id = v_prod_id;
        END IF;
      ELSE
        SELECT id, stock_qty, track_inventory INTO v_prod_id, v_stock_qty, v_track_inventory
        FROM products WHERE shop_id = p_shop_id AND name = (v_item->>'name') LIMIT 1;
      END IF;
      
      IF v_prod_id IS NOT NULL THEN
        UPDATE products SET 
          last_used_at = now(),
          use_count = COALESCE(use_count, 0) + 1
        WHERE id = v_prod_id;

        IF v_track_inventory = true THEN
          IF (v_item->>'variant_id') IS NOT NULL THEN
            SELECT stock_qty INTO v_variant_stock FROM product_variants WHERE id = (v_item->>'variant_id')::uuid;
            IF v_variant_stock < (v_item->>'quantity')::int THEN
              RAISE EXCEPTION 'INSUFFICIENT_STOCK: %', (v_item->>'name');
            END IF;

            UPDATE product_variants SET stock_qty = stock_qty - (v_item->>'quantity')::int WHERE id = (v_item->>'variant_id')::uuid;

            INSERT INTO inventory_logs (shop_id, product_id, invoice_id, variant_id, change_qty, previous_qty, new_qty, reason)
            VALUES (
              p_shop_id,
              v_prod_id,
              v_invoice_id,
              (v_item->>'variant_id')::uuid,
              -(v_item->>'quantity')::int,
              v_variant_stock,
              v_variant_stock - (v_item->>'quantity')::int,
              'invoice'
            );
          ELSE
            IF v_stock_qty < (v_item->>'quantity')::int THEN
              RAISE EXCEPTION 'INSUFFICIENT_STOCK: %', (v_item->>'name');
            END IF;

            UPDATE products SET stock_qty = stock_qty - (v_item->>'quantity')::int WHERE id = v_prod_id;

            INSERT INTO inventory_logs (shop_id, product_id, invoice_id, change_qty, previous_qty, new_qty, reason)
            VALUES (
              p_shop_id,
              v_prod_id,
              v_invoice_id,
              -(v_item->>'quantity')::int,
              v_stock_qty,
              v_stock_qty - (v_item->>'quantity')::int,
              'invoice'
            );
          END IF;
        END IF;
      END IF;
    END LOOP;

    -- Process Payments
    IF p_payment_status = 'paid' OR p_payment_status = 'partial' THEN
      INSERT INTO payments (
        invoice_id,
        shop_id,
        customer_phone,
        amount,
        payment_method,
        note,
        paid_at
      ) VALUES (
        v_invoice_id,
        p_shop_id,
        p_customer_phone,
        p_amount_paid,
        p_payment_method,
        COALESCE(p_payment_note, CASE WHEN p_payment_status = 'paid' then 'Paid on invoice creation' ELSE 'Partial payment on invoice creation' END),
        now()
      );
    END IF;

    -- Process Customer Ledger
    -- Get or create customer
    INSERT INTO customers (shop_id, phone, name, tag, total_invoices, total_spent, gstin)
    VALUES (
      p_shop_id,
      p_customer_phone,
      COALESCE(p_customer_name, 'CUSTOMER'),
      'regular',
      0,
      0,
      p_customer_gstin
    )
    ON CONFLICT (shop_id, phone) DO UPDATE
    SET 
      name = COALESCE(p_customer_name, customers.name),
      gstin = COALESCE(p_customer_gstin, customers.gstin);

    -- Sync customer totals
    SELECT COUNT(*), COALESCE(SUM(total), 0) INTO v_customer_invoices, v_total_billed
    FROM invoices WHERE shop_id = p_shop_id AND customer_phone = p_customer_phone AND status IN ('saved', 'sent');

    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM payments WHERE shop_id = p_shop_id AND customer_phone = p_customer_phone
    AND invoice_id IN (SELECT id FROM invoices WHERE shop_id = p_shop_id AND customer_phone = p_customer_phone AND status IN ('saved', 'sent'));

    SELECT COALESCE(SUM(total), 0) INTO v_total_credit
    FROM credit_debit_notes
    WHERE shop_id = p_shop_id 
      AND customer_phone = p_customer_phone 
      AND note_type = 'credit';

    SELECT COALESCE(SUM(total), 0) INTO v_total_debit
    FROM credit_debit_notes
    WHERE shop_id = p_shop_id 
      AND customer_phone = p_customer_phone 
      AND note_type = 'debit';

    UPDATE customers SET
      total_invoices = v_customer_invoices,
      total_spent = v_total_paid,
      outstanding_balance = GREATEST(0, v_total_billed + v_total_debit - v_total_paid - v_total_credit)
    WHERE shop_id = p_shop_id AND phone = p_customer_phone;

    -- Write saved audit log
    INSERT INTO invoice_audit_logs (invoice_id, shop_id, user_id, action)
    VALUES (v_invoice_id, p_shop_id, p_user_id, 'saved');
  END IF;

  RETURN jsonb_build_object('id', v_invoice_id, 'invoice_number', v_invoice_number);
END;
$$ LANGUAGE plpgsql;

-- 2. Atomic Transaction: Promote Draft Invoice to Saved Status
CREATE OR REPLACE FUNCTION save_invoice_tx(
  p_invoice_id uuid,
  p_user_id uuid
) RETURNS boolean as $$
DECLARE
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
BEGIN
  -- Get invoice info
  SELECT shop_id, status, customer_phone, customer_name, customer_gstin, payment_status, amount_paid, total
  INTO v_shop_id, v_status, v_customer_phone, v_customer_name, v_customer_gstin, v_payment_status, v_amount_paid, v_total
  FROM invoices WHERE id = p_invoice_id;

  IF v_status != 'draft' THEN
    RAISE EXCEPTION 'Invoice is not in draft status';
  END IF;

  -- Process Inventory
  FOR v_item IN SELECT name, qty, variant_id FROM invoice_items WHERE invoice_id = p_invoice_id LOOP
    IF v_item.variant_id IS NOT NULL THEN
      SELECT product_id INTO v_prod_id FROM product_variants WHERE id = v_item.variant_id;
      IF v_prod_id IS NOT NULL THEN
        SELECT stock_qty, track_inventory INTO v_stock_qty, v_track_inventory
        FROM products WHERE id = v_prod_id;
      END IF;
    ELSE
      SELECT id, stock_qty, track_inventory INTO v_prod_id, v_stock_qty, v_track_inventory
      FROM products WHERE shop_id = v_shop_id AND name = v_item.name LIMIT 1;
    END IF;

    IF v_prod_id IS NOT NULL THEN
      UPDATE products SET 
        last_used_at = now(),
        use_count = COALESCE(use_count, 0) + 1
      WHERE id = v_prod_id;

      IF v_track_inventory = true THEN
        IF v_item.variant_id IS NOT NULL THEN
          SELECT stock_qty INTO v_variant_stock FROM product_variants WHERE id = v_item.variant_id;
          IF v_variant_stock < v_item.qty THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: %', v_item.name;
          END IF;

          UPDATE product_variants SET stock_qty = stock_qty - v_item.qty WHERE id = v_item.variant_id;

          INSERT INTO inventory_logs (shop_id, product_id, invoice_id, variant_id, change_qty, previous_qty, new_qty, reason)
          VALUES (
            v_shop_id,
            v_prod_id,
            p_invoice_id,
            v_item.variant_id,
            -v_item.qty,
            v_variant_stock,
            v_variant_stock - v_item.qty,
            'invoice'
          );
        ELSE
          IF v_stock_qty < v_item.qty THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: %', v_item.name;
          END IF;

          UPDATE products SET stock_qty = stock_qty - v_item.qty WHERE id = v_prod_id;

          INSERT INTO inventory_logs (shop_id, product_id, invoice_id, change_qty, previous_qty, new_qty, reason)
          VALUES (
            v_shop_id,
            v_prod_id,
            p_invoice_id,
            -v_item.qty,
            v_stock_qty,
            v_stock_qty - v_item.qty,
            'invoice'
          );
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Process Payments
  IF v_payment_status = 'paid' OR v_payment_status = 'partial' THEN
    -- Verify if payment already exists
    IF NOT EXISTS (SELECT 1 FROM payments WHERE invoice_id = p_invoice_id) THEN
      INSERT INTO payments (
        invoice_id,
        shop_id,
        customer_phone,
        amount,
        payment_method,
        note,
        paid_at
      ) VALUES (
        p_invoice_id,
        v_shop_id,
        v_customer_phone,
        v_amount_paid,
        'cash',
        CASE WHEN v_payment_status = 'paid' then 'Paid on invoice creation' ELSE 'Partial payment on invoice creation' END,
        now()
      );
    END IF;
  END IF;

  -- Update status
  UPDATE invoices SET 
    status = 'saved',
    uses_payments_table = (v_payment_status = 'paid' or v_payment_status = 'partial'),
    paid_at = CASE WHEN v_payment_status = 'paid' then now() ELSE NULL END
  WHERE id = p_invoice_id;

  -- Update Customer Ledger / outstanding
  INSERT INTO customers (shop_id, phone, name, tag, total_invoices, total_spent, gstin)
  VALUES (
    v_shop_id,
    v_customer_phone,
    COALESCE(v_customer_name, 'CUSTOMER'),
    'regular',
    0,
    0,
    v_customer_gstin
  )
  ON CONFLICT (shop_id, phone) DO UPDATE
  SET 
    name = COALESCE(v_customer_name, customers.name),
    gstin = COALESCE(v_customer_gstin, customers.gstin);

  -- Sync customer totals
  SELECT COUNT(*), COALESCE(SUM(total), 0) INTO v_customer_invoices, v_total_billed
  FROM invoices WHERE shop_id = v_shop_id AND customer_phone = v_customer_phone AND status IN ('saved', 'sent');

  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payments WHERE shop_id = v_shop_id AND customer_phone = v_customer_phone
  AND invoice_id IN (SELECT id FROM invoices WHERE shop_id = v_shop_id AND customer_phone = v_customer_phone AND status IN ('saved', 'sent'));

  SELECT COALESCE(SUM(total), 0) INTO v_total_credit
  FROM credit_debit_notes
  WHERE shop_id = v_shop_id 
    AND customer_phone = v_customer_phone 
    AND note_type = 'credit';

  SELECT COALESCE(SUM(total), 0) INTO v_total_debit
  FROM credit_debit_notes
  WHERE shop_id = v_shop_id 
    AND customer_phone = v_customer_phone 
    AND note_type = 'debit';

  UPDATE customers SET
    total_invoices = v_customer_invoices,
    total_spent = v_total_paid,
    outstanding_balance = GREATEST(0, v_total_billed + v_total_debit - v_total_paid - v_total_credit)
  WHERE shop_id = v_shop_id AND phone = v_customer_phone;

  -- Audit log
  INSERT INTO invoice_audit_logs (invoice_id, shop_id, user_id, action)
  VALUES (p_invoice_id, v_shop_id, p_user_id, 'saved');

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 3. Atomic Transaction: Cancel Invoice (Reverse everything)
CREATE OR REPLACE FUNCTION cancel_invoice_tx(
  p_invoice_id uuid,
  p_user_id uuid,
  p_reason text
) RETURNS boolean as $$
DECLARE
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
BEGIN
  SELECT shop_id, status, customer_phone INTO v_shop_id, v_status, v_customer_phone
  FROM invoices WHERE id = p_invoice_id;

  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'Invoice is already cancelled';
  END IF;

  IF v_status = 'draft' THEN
    RAISE EXCEPTION 'Draft invoices cannot be cancelled, they must be deleted';
  END IF;

  -- 1. Restore stock
  FOR v_item IN SELECT name, qty, variant_id FROM invoice_items WHERE invoice_id = p_invoice_id LOOP
    IF v_item.variant_id IS NOT NULL THEN
      SELECT product_id INTO v_prod_id FROM product_variants WHERE id = v_item.variant_id;
      IF v_prod_id IS NOT NULL THEN
        SELECT stock_qty, track_inventory INTO v_stock_qty, v_track_inventory
        FROM products WHERE id = v_prod_id;
      END IF;
    ELSE
      SELECT id, stock_qty, track_inventory INTO v_prod_id, v_stock_qty, v_track_inventory
      FROM products WHERE shop_id = v_shop_id AND name = v_item.name LIMIT 1;
    END IF;

    IF v_prod_id IS NOT NULL THEN
      UPDATE products SET 
        use_count = GREATEST(0, COALESCE(use_count, 0) - 1)
      WHERE id = v_prod_id;

      IF v_track_inventory = true THEN
        IF v_item.variant_id IS NOT NULL THEN
          SELECT stock_qty INTO v_variant_stock FROM product_variants WHERE id = v_item.variant_id;

          UPDATE product_variants SET stock_qty = stock_qty + v_item.qty WHERE id = v_item.variant_id;

          INSERT INTO inventory_logs (shop_id, product_id, invoice_id, variant_id, change_qty, previous_qty, new_qty, reason)
          VALUES (
            v_shop_id,
            v_prod_id,
            p_invoice_id,
            v_item.variant_id,
            v_item.qty,
            v_variant_stock,
            v_variant_stock + v_item.qty,
            'return'
          );
        ELSE
          UPDATE products SET stock_qty = stock_qty + v_item.qty WHERE id = v_prod_id;

          INSERT INTO inventory_logs (shop_id, product_id, invoice_id, change_qty, previous_qty, new_qty, reason)
          VALUES (
            v_shop_id,
            v_prod_id,
            p_invoice_id,
            v_item.qty,
            v_stock_qty,
            v_stock_qty + v_item.qty,
            'return'
          );
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- 2. Delete payments associated with this invoice (Reversing payment calculations)
  DELETE FROM payments WHERE invoice_id = p_invoice_id;

  -- 3. Update invoice status
  UPDATE invoices SET 
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_reason = p_reason
  WHERE id = p_invoice_id;

  -- 4. Sync customer ledger / outstanding
  SELECT COUNT(*), COALESCE(SUM(total), 0) INTO v_customer_invoices, v_total_billed
  FROM invoices WHERE shop_id = v_shop_id AND customer_phone = v_customer_phone AND status IN ('saved', 'sent');

  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payments WHERE shop_id = v_shop_id AND customer_phone = v_customer_phone
  AND invoice_id IN (SELECT id FROM invoices WHERE shop_id = v_shop_id AND customer_phone = v_customer_phone AND status IN ('saved', 'sent'));

  SELECT COALESCE(SUM(total), 0) INTO v_total_credit
  FROM credit_debit_notes
  WHERE shop_id = v_shop_id 
    AND customer_phone = v_customer_phone 
    AND note_type = 'credit';

  SELECT COALESCE(SUM(total), 0) INTO v_total_debit
  FROM credit_debit_notes
  WHERE shop_id = v_shop_id 
    AND customer_phone = v_customer_phone 
    AND note_type = 'debit';

  UPDATE customers SET
    total_invoices = v_customer_invoices,
    total_spent = v_total_paid,
    outstanding_balance = GREATEST(0, v_total_billed + v_total_debit - v_total_paid - v_total_credit)
  WHERE shop_id = v_shop_id AND phone = v_customer_phone;

  -- 5. Write cancelled audit log
  INSERT INTO invoice_audit_logs (invoice_id, shop_id, user_id, action)
  VALUES (p_invoice_id, v_shop_id, p_user_id, 'cancelled');

  RETURN true;
END;
$$ LANGUAGE plpgsql;
