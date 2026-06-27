-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Backfill user_roles from admins table
INSERT INTO user_roles (user_id, role)
SELECT auth_user_id, 'super_admin' FROM admins
ON CONFLICT DO NOTHING;

-- Create platform_events table
CREATE TABLE IF NOT EXISTS platform_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  business_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  business_name VARCHAR(255),
  city VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime on this table
ALTER TABLE platform_events REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE platform_events;

-- Index for fast recent fetch
CREATE INDEX IF NOT EXISTS idx_platform_events_created ON platform_events(created_at DESC);

-- RLS: only super_admin can read, authenticated can insert
ALTER TABLE platform_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_platform_events" ON platform_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "authenticated_insert_platform_events" ON platform_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
