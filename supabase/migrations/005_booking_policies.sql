-- Add booking policies to availability_settings table
-- These allow providers to configure their own cancellation and rescheduling rules

ALTER TABLE availability_settings 
ADD COLUMN cancellation_policy JSONB DEFAULT '{
  "free_cancellation_hours": 24,
  "partial_refund_hours": 2,
  "no_refund_hours": 0,
  "partial_refund_percentage": 50,
  "allow_provider_cancellation": true
}'::jsonb;

ALTER TABLE availability_settings 
ADD COLUMN rescheduling_policy JSONB DEFAULT '{
  "free_rescheduling_hours": 24,
  "rescheduling_fee_hours": 2,
  "rescheduling_fee_amount": 0,
  "max_reschedules_per_booking": 3,
  "allow_provider_rescheduling": true
}'::jsonb;

ALTER TABLE availability_settings 
ADD COLUMN notification_preferences JSONB DEFAULT '{
  "send_sms_cancellations": true,
  "send_email_cancellations": true,
  "send_sms_reschedules": true,
  "send_email_reschedules": true,
  "notify_provider_on_cancellation": true,
  "notify_provider_on_reschedule": true
}'::jsonb;

-- Add access token fields to bookings table for guest access
ALTER TABLE bookings 
ADD COLUMN access_token VARCHAR(255) UNIQUE,
ADD COLUMN token_expires_at TIMESTAMP,
ADD COLUMN cancellation_reason TEXT,
ADD COLUMN cancelled_at TIMESTAMP,
ADD COLUMN rescheduled_from_booking_id UUID REFERENCES bookings(id),
ADD COLUMN reschedule_count INTEGER DEFAULT 0;

-- Create index for faster token lookups
CREATE INDEX idx_bookings_access_token ON bookings(access_token);
CREATE INDEX idx_bookings_token_expires ON bookings(token_expires_at);
