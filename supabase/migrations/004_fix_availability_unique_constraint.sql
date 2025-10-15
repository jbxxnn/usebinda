-- Migration 004: Fix Availability Settings Unique Constraint
-- Ensures each user can only have one availability_settings row

-- First, delete duplicate rows, keeping only the most recent one for each user
DELETE FROM public.availability_settings
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.availability_settings
  ORDER BY user_id, updated_at DESC
);

-- Add unique constraint on user_id
ALTER TABLE public.availability_settings
ADD CONSTRAINT availability_settings_user_id_unique UNIQUE (user_id);

-- Update the upsert behavior to use the unique constraint
-- This ensures upsert works correctly based on user_id
CREATE UNIQUE INDEX IF NOT EXISTS availability_settings_user_id_idx 
ON public.availability_settings(user_id);

