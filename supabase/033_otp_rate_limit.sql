-- Add last_otp_sent_at to sms_numbers for OTP resend rate limiting.
-- Prevents contractors from spamming OTP requests (60-second cooldown).

ALTER TABLE sms_numbers ADD COLUMN IF NOT EXISTS last_otp_sent_at timestamptz;
