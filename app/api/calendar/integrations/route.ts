// API route for calendar integrations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleCalendarService } from '@/lib/calendar/google-calendar';
import { OutlookCalendarService } from '@/lib/calendar/outlook-calendar';
import type { ApiResponse, CalendarProvider } from '@/lib/types';

/**
 * GET /api/calendar/integrations
 * Get all calendar integrations for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: integrations, error } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching integrations:', error);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to fetch calendar integrations' },
        { status: 500 }
      );
    }

    // Remove sensitive token data from response
    const sanitizedIntegrations = integrations?.map(integration => ({
      ...integration,
      access_token: '[REDACTED]',
      refresh_token: integration.refresh_token ? '[REDACTED]' : null,
    })) || [];

    return NextResponse.json<ApiResponse>({
      success: true,
      data: sanitizedIntegrations,
    });
  } catch (error) {
    console.error('Error in GET /api/calendar/integrations:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/integrations
 * Create a new calendar integration
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, code, calendar_id, calendar_name } = body;

    if (!provider || !code || !calendar_id || !calendar_name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let tokenResponse;
    let calendarService;

    // Exchange code for tokens
    if (provider === 'google') {
      tokenResponse = await GoogleCalendarService.exchangeCodeForTokens(code);
      calendarService = new GoogleCalendarService(
        tokenResponse.access_token,
        tokenResponse.refresh_token
      );
    } else if (provider === 'outlook') {
      tokenResponse = await OutlookCalendarService.exchangeCodeForTokens(code);
      calendarService = new OutlookCalendarService(
        tokenResponse.access_token,
        tokenResponse.refresh_token
      );
    } else {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unsupported calendar provider' },
        { status: 400 }
      );
    }

    // Verify the calendar exists and user has access
    const calendars = await calendarService.getCalendars();
    const targetCalendar = calendars.find(cal => cal.id === calendar_id);

    if (!targetCalendar) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Calendar not found or access denied' },
        { status: 400 }
      );
    }

    // Check if integration already exists
    const { data: existingIntegration } = await supabase
      .from('calendar_integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('calendar_id', calendar_id)
      .single();

    if (existingIntegration) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Calendar integration already exists' },
        { status: 400 }
      );
    }

    // Create the integration
    const { data: integration, error: insertError } = await supabase
      .from('calendar_integrations')
      .insert({
        user_id: user.id,
        provider: provider as CalendarProvider,
        calendar_id,
        calendar_name,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_expires_at: tokenResponse.expires_in 
          ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
          : null,
        sync_enabled: true,
        sync_frequency_minutes: 15,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating integration:', insertError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create calendar integration' },
        { status: 500 }
      );
    }

    // Remove sensitive data from response
    const sanitizedIntegration = {
      ...integration,
      access_token: '[REDACTED]',
      refresh_token: integration.refresh_token ? '[REDACTED]' : null,
    };

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: sanitizedIntegration,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/calendar/integrations:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

