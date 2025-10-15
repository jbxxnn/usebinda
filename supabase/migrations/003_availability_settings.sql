-- Migration 003: Availability Settings for Advanced Scheduling
-- Creates tables and policies for provider availability management

-- Availability settings table
CREATE TABLE IF NOT EXISTS public.availability_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Time zone for this provider
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  
  -- Working hours (JSON format for flexibility)
  working_hours JSONB NOT NULL DEFAULT '{}',
  -- Example structure:
  -- {
  --   "monday": {"start": "09:00", "end": "17:00", "enabled": true},
  --   "tuesday": {"start": "09:00", "end": "17:00", "enabled": true},
  --   "wednesday": {"start": "09:00", "end": "17:00", "enabled": true},
  --   "thursday": {"start": "09:00", "end": "17:00", "enabled": true},
  --   "friday": {"start": "09:00", "end": "17:00", "enabled": true},
  --   "saturday": {"start": "10:00", "end": "15:00", "enabled": false},
  --   "sunday": {"start": "10:00", "end": "15:00", "enabled": false}
  -- }
  
  -- Break times (JSON array of break periods)
  break_times JSONB NOT NULL DEFAULT '[]',
  -- Example structure:
  -- [
  --   {"start": "12:00", "end": "13:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]},
  --   {"start": "15:00", "end": "15:15", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}
  -- ]
  
  -- Default buffer time between appointments (in minutes)
  default_buffer_minutes INTEGER NOT NULL DEFAULT 30,
  
  -- Booking limits
  max_bookings_per_slot INTEGER NOT NULL DEFAULT 1,
  
  -- Advance booking settings
  min_advance_booking_hours INTEGER NOT NULL DEFAULT 2, -- Minimum hours in advance
  max_advance_booking_days INTEGER NOT NULL DEFAULT 30, -- Maximum days in advance
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Blocked time periods table (for specific date/time blocks)
CREATE TABLE IF NOT EXISTS public.blocked_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Block type
  block_type TEXT NOT NULL CHECK (block_type IN ('manual', 'holiday', 'vacation', 'maintenance')) DEFAULT 'manual',
  
  -- Block period
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Block details
  title TEXT NOT NULL,
  description TEXT,
  
  -- Recurring settings (for holidays, etc.)
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern JSONB, -- For future implementation
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recurring availability templates (for seasonal schedules)
CREATE TABLE IF NOT EXISTS public.availability_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Template details
  name TEXT NOT NULL,
  description TEXT,
  
  -- Template schedule (same structure as working_hours)
  working_hours JSONB NOT NULL DEFAULT '{}',
  break_times JSONB NOT NULL DEFAULT '[]',
  
  -- Template validity period
  start_date DATE,
  end_date DATE,
  
  -- Active template flag
  is_active BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX availability_settings_user_id_idx ON public.availability_settings(user_id);
CREATE INDEX blocked_periods_user_id_idx ON public.blocked_periods(user_id);
CREATE INDEX blocked_periods_time_range_idx ON public.blocked_periods(start_time, end_time);
CREATE INDEX blocked_periods_type_idx ON public.blocked_periods(block_type);
CREATE INDEX availability_templates_user_id_idx ON public.availability_templates(user_id);
CREATE INDEX availability_templates_active_idx ON public.availability_templates(is_active);

-- Create triggers for updated_at
CREATE TRIGGER update_availability_settings_updated_at 
  BEFORE UPDATE ON public.availability_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocked_periods_updated_at 
  BEFORE UPDATE ON public.blocked_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_templates_updated_at 
  BEFORE UPDATE ON public.availability_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Availability settings policies
CREATE POLICY "Providers can manage own availability" ON public.availability_settings
  FOR ALL USING (auth.uid() = user_id);

-- Blocked periods policies
CREATE POLICY "Providers can manage own blocked periods" ON public.blocked_periods
  FOR ALL USING (auth.uid() = user_id);

-- Availability templates policies
CREATE POLICY "Providers can manage own templates" ON public.availability_templates
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Insert default availability settings for existing providers
INSERT INTO public.availability_settings (user_id, working_hours, timezone)
SELECT 
  id,
  '{
    "monday": {"start": "09:00", "end": "17:00", "enabled": true},
    "tuesday": {"start": "09:00", "end": "17:00", "enabled": true},
    "wednesday": {"start": "09:00", "end": "17:00", "enabled": true},
    "thursday": {"start": "09:00", "end": "17:00", "enabled": true},
    "friday": {"start": "09:00", "end": "17:00", "enabled": true},
    "saturday": {"start": "10:00", "end": "15:00", "enabled": false},
    "sunday": {"start": "10:00", "end": "15:00", "enabled": false}
  }'::jsonb,
  timezone
FROM public.users 
WHERE role = 'provider' 
AND id NOT IN (SELECT user_id FROM public.availability_settings);

-- Add some sample blocked periods for testing
-- (This can be removed in production)
INSERT INTO public.blocked_periods (user_id, block_type, start_time, end_time, title, description)
SELECT 
  id,
  'holiday',
  '2024-12-25 00:00:00+00'::timestamptz,
  '2024-12-25 23:59:59+00'::timestamptz,
  'Christmas Day',
  'Office closed for Christmas'
FROM public.users 
WHERE role = 'provider' 
LIMIT 1;
