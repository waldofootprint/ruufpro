-- 065: Prevent duplicate pending gates per batch+type
-- Fixes race condition where GET /api/ops/pipeline creates duplicate gates
-- when multiple tabs or polling requests hit simultaneously.

CREATE UNIQUE INDEX IF NOT EXISTS idx_gate_batch_type_pending
  ON pipeline_gates (batch_id, gate_type)
  WHERE status = 'pending';
