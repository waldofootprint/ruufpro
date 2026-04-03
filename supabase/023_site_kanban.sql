-- Site Kanban: Track roofer website builds and edit requests
CREATE TABLE command_site_kanban (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL,
  city text,
  template text,
  edit_request text,
  priority text DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal', 'low')),
  site_url text,
  notes text,
  col text NOT NULL DEFAULT 'edit_requested' CHECK (col IN ('edit_requested', 'in_progress', 'review', 'done')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE command_site_kanban ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage command_site_kanban"
  ON command_site_kanban FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER command_site_kanban_updated_at
  BEFORE UPDATE ON command_site_kanban
  FOR EACH ROW EXECUTE FUNCTION update_command_updated_at();
