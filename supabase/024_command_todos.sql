-- Master to-do list + top 5 shortlist
CREATE TABLE command_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  is_shortlist boolean DEFAULT false,
  shortlist_rank integer, -- 1-5 for top 5, null for master list
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  source text, -- where this idea came from (vault entry, conversation, etc)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE command_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage command_todos"
  ON command_todos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER command_todos_updated_at
  BEFORE UPDATE ON command_todos
  FOR EACH ROW EXECUTE FUNCTION update_command_updated_at();
