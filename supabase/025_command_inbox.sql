-- Second brain inbox: drop text, files, notes for Claude to process
CREATE TABLE command_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'file', 'transcript', 'note', 'screenshot')),
  title text,
  content text, -- raw text content or notes
  file_name text, -- original filename if file upload
  file_url text, -- Supabase storage URL if file
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'processed', 'filed')),
  processed_summary text, -- Claude's summary after processing
  filed_location text, -- where it was filed in the vault/command center
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE command_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage command_inbox"
  ON command_inbox FOR ALL TO authenticated USING (true) WITH CHECK (true);
