// API route for availability settings management

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAvailabilitySettings, upsertAvailabilitySettings } from '@/lib/availability';
import type { ApiResponse, 
  // AvailabilitySettings 
} from '@/lib/types';

/**
 * GET /api/availability
 * Get availability settings for the authenticated provider
 */
export async function GET(request: NextRequest) { // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let settings = await getAvailabilitySettings(user.id);

    // If no settings exist, create default settings
    if (!settings) {
      settings = await upsertAvailabilitySettings(user.id, {
        timezone: 'America/New_York',
        working_hours: {
          monday: { start: '09:00', end: '17:00', enabled: true },
          tuesday: { start: '09:00', end: '17:00', enabled: true },
          wednesday: { start: '09:00', end: '17:00', enabled: true },
          thursday: { start: '09:00', end: '17:00', enabled: true },
          friday: { start: '09:00', end: '17:00', enabled: true },
          saturday: { start: '09:00', end: '17:00', enabled: false },
          sunday: { start: '09:00', end: '17:00', enabled: false },
        },
        break_times: [],
        default_buffer_minutes: 30,
        max_bookings_per_slot: 1,
        min_advance_booking_hours: 2,
        max_advance_booking_days: 30,
      });

      if (!settings) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Failed to create default availability settings' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error in GET /api/availability:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/availability
 * Update availability settings for the authenticated provider
 */
export async function PUT(request: NextRequest) {
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

    // Validate required fields
    if (!body.working_hours || !body.timezone) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Working hours and timezone are required' },
        { status: 400 }
      );
    }

    const updatedSettings = await upsertAvailabilitySettings(user.id, {
      timezone: body.timezone,
      working_hours: body.working_hours,
      break_times: body.break_times || [],
      default_buffer_minutes: body.default_buffer_minutes || 30,
      max_bookings_per_slot: body.max_bookings_per_slot || 1,
      min_advance_booking_hours: body.min_advance_booking_hours || 2,
      max_advance_booking_days: body.max_advance_booking_days || 30,
    });

    if (!updatedSettings) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update availability settings' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedSettings,
    });
  } catch (error) {
    console.error('Error in PUT /api/availability:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}