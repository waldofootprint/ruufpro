-- 10DLC Registration: adds columns to sms_numbers for tracking the full
-- ISV registration flow (Trust Hub profiles, brand, campaign, messaging service).

-- New columns on sms_numbers for 10DLC registration tracking
ALTER TABLE sms_numbers
  ADD COLUMN IF NOT EXISTS registration_path text CHECK (registration_path IN ('sole_proprietor', 'standard')),
  ADD COLUMN IF NOT EXISTS registration_status text DEFAULT 'not_started'
    CHECK (registration_status IN (
      'not_started', 'profile_pending', 'profile_approved',
      'brand_pending', 'brand_otp_required', 'brand_approved',
      'campaign_pending', 'campaign_approved', 'failed'
    )),
  ADD COLUMN IF NOT EXISTS registration_error text,
  ADD COLUMN IF NOT EXISTS customer_profile_sid text,
  ADD COLUMN IF NOT EXISTS trust_product_sid text,
  ADD COLUMN IF NOT EXISTS brand_registration_sid text,
  ADD COLUMN IF NOT EXISTS messaging_service_sid text,
  ADD COLUMN IF NOT EXISTS campaign_sid text,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz;

-- Make phone_number nullable (we don't have it until we buy it mid-flow)
ALTER TABLE sms_numbers ALTER COLUMN phone_number DROP NOT NULL;

-- Update the status check constraint to include new statuses
ALTER TABLE sms_numbers DROP CONSTRAINT IF EXISTS sms_numbers_status_check;
ALTER TABLE sms_numbers ADD CONSTRAINT sms_numbers_status_check
  CHECK (status IN ('pending_registration', 'registering', 'active', 'suspended', 'released'));

-- Remove toll-free and shared_fallback from number_type (10DLC only)
ALTER TABLE sms_numbers DROP CONSTRAINT IF EXISTS sms_numbers_number_type_check;
ALTER TABLE sms_numbers ADD CONSTRAINT sms_numbers_number_type_check
  CHECK (number_type IN ('local'));

-- Index for the cron job that checks pending registrations
CREATE INDEX IF NOT EXISTS idx_sms_numbers_registration_status
  ON sms_numbers (registration_status)
  WHERE registration_status NOT IN ('campaign_approved', 'not_started');

-- Allow service role to upsert sms_numbers (needed for registration flow)
CREATE POLICY IF NOT EXISTS "Service role can upsert sms numbers"
  ON sms_numbers FOR ALL
  USING (true)
  WITH CHECK (true);
