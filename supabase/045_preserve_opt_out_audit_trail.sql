-- Preserve TCPA opt-out audit trail when contractors are deleted.
-- Previously ON DELETE CASCADE — deleting a contractor destroyed all opt-out records.
-- If the contractor re-registers or the number is reassigned, previously opted-out
-- numbers would have no record and could be illegally texted again.

ALTER TABLE sms_opt_outs DROP CONSTRAINT IF EXISTS sms_opt_outs_contractor_id_fkey;
ALTER TABLE sms_opt_outs ADD CONSTRAINT sms_opt_outs_contractor_id_fkey
  FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE SET NULL;
