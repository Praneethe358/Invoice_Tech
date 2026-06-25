-- Fix 1: SKU Immutability Trigger
-- Run this migration in the Supabase Dashboard SQL Editor

CREATE OR REPLACE FUNCTION lock_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.sku IS NOT NULL AND NEW.sku != OLD.sku THEN
    RAISE EXCEPTION 'SKU is immutable after creation. Cannot modify existing SKU.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_sku_immutability ON product_variants;

CREATE TRIGGER enforce_sku_immutability
BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION lock_sku();
