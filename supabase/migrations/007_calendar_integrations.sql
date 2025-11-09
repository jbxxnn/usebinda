-- Calendar integrations table for external calendar sync

CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
  calendar_id VARCHAR(255) NOT NULL, -- Google Calendar ID or Outlook Calendar ID
  calendar_name VARCHAR(255) NOT NULL, -- Human-readable calendar name
  access_token TEXT NOT NULL, -- Encrypted OAuth access token
  refresh_token TEXT, -- Encrypted OAuth refresh token
  token_expires_at TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 15, -- How often to sync (15 min default)
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar events table to store synced events
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES calendar_integrations(id) ON DELETE CASCADE,
  external_event_id VARCHAR(255) NOT NULL, -- Google/Outlook event ID
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  location VARCHAR(500),
  attendees JSONB, -- Array of attendee objects
  recurrence_rule TEXT, -- RRULE for recurring events
  status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, tentative
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate events
  UNIQUE(integration_id, external_event_id)
);

-- Add calendar sync settings to availability_settings
ALTER TABLE availability_settings 
ADD COLUMN calendar_sync_enabled BOOLEAN DEFAULT false,
ADD COLUMN calendar_sync_frequency_minutes INTEGER DEFAULT 15,
ADD COLUMN calendar_conflict_action VARCHAR(50) DEFAULT 'block' CHECK (calendar_conflict_action IN ('block', 'warn', 'ignore'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_id ON calendar_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_provider ON calendar_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_calendar_events_integration_id ON calendar_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);

-- RLS policies
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own calendar integrations
CREATE POLICY "Users can view their own calendar integrations" ON calendar_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calendar integrations" ON calendar_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar integrations" ON calendar_integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar integrations" ON calendar_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only see their own calendar events
CREATE POLICY "Users can view their own calendar events" ON calendar_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calendar_integrations 
      WHERE calendar_integrations.id = calendar_events.integration_id 
      AND calendar_integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own calendar events" ON calendar_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_integrations 
      WHERE calendar_integrations.id = calendar_events.integration_id 
      AND calendar_integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own calendar events" ON calendar_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM calendar_integrations 
      WHERE calendar_integrations.id = calendar_events.integration_id 
      AND calendar_integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own calendar events" ON calendar_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM calendar_integrations 
      WHERE calendar_integrations.id = calendar_events.integration_id 
      AND calendar_integrations.user_id = auth.uid()
    )
  );

