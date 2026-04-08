-- Migration 038: Add delivery tracking timestamp to sms_messages
-- Enables Twilio StatusCallback to track when messages are delivered

alter table sms_messages
  add column if not exists delivered_at timestamptz;
