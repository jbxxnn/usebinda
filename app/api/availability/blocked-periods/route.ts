// API route for blocked periods management

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBlockedPeriods, createBlockedPeriod } from '@/lib/availability';
import type { ApiResponse, BlockedPeriod } from '@/lib/types';

/**
 * GET /api/availability/blocked-periods
 * Get blocked periods for the authenticated provider
 * Query params: startDate, endDate (ISO strings)
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

    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const blockedPeriods = await getBlockedPeriods(user.id, startDate, endDate);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: blockedPeriods,
    });
  } catch (error) {
    console.error('Error in GET /api/availability/blocked-periods:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/availability/blocked-periods
 * Create a new blocked period
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

    // Validate required fields
    if (!body.start_time || !body.end_time || !body.title) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'start_time, end_time, and title are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const startTime = new Date(body.start_time);
    const endTime = new Date(body.end_time);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    const blockedPeriod = await createBlockedPeriod(user.id, {
      block_type: body.block_type || 'manual',
      start_time: body.start_time,
      end_time: body.end_time,
      title: body.title,
      description: body.description || null,
      is_recurring: body.is_recurring || false,
      recurrence_pattern: body.recurrence_pattern || null,
    });

    if (!blockedPeriod) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create blocked period' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data: blockedPeriod },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/availability/blocked-periods:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
