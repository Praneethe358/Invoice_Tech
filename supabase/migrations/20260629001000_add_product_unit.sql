-- Add unit column to products table
-- Values: 'Piece', 'Metre', 'Kg', 'Litre', 'Box', 'Dozen', 'Set', 'Pair', etc.
-- Default: 'Piece'
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit text DEFAULT 'Piece';
