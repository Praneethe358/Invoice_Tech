CREATE TABLE system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS frozen_reason VARCHAR(255) DEFAULT null;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ DEFAULT null;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS frozen_by UUID REFERENCES auth.users(id) DEFAULT null;

-- Enable RLS
ALTER TABLE system_announcements ENABLE ROW LEVEL SECURITY;

-- SELECT policy: authenticated users can read announcements
CREATE POLICY select_system_announcements ON system_announcements
  FOR SELECT TO authenticated USING (true);

-- write policy: only super_admin can insert/update/delete system_announcements
CREATE POLICY write_system_announcements ON system_announcements
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));
