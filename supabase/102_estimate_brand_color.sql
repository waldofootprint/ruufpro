-- Per-roofer brand color override (calculator superiority plan M1.5).
-- One hex column drives the V4 widget's CTA button, selected-card border,
-- progress fill, pill selection, and input focus rings. Roofr supports
-- per-tenant brand color; this matches that capability.
-- Skipping brand_accent_hex for now — single accent is enough for MVP.
ALTER TABLE estimate_settings
  ADD COLUMN IF NOT EXISTS brand_primary_hex text;
