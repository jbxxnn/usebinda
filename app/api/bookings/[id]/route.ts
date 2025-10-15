// API route for individual booking operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBookingById, updateBooking } from '@/lib/database';
import type { ApiResponse, Booking } from '@/lib/types';

/**
 * GET /api/bookings/[id]
 * Get a single booking by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await getBookingById(id);

    if (!booking) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Error in GET /api/bookings/[id]:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings/[id]
 * Update a booking (status, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if booking exists and user owns it
    const existingBooking = await getBookingById(id);
    if (!existingBooking) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (existingBooking.provider_id !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: Partial<Booking> = {};

    if (body.status) updates.status = body.status;
    if (body.payment_status) updates.payment_status = body.payment_status;
    if (body.notes !== undefined) updates.notes = body.notes;

    const updatedBooking = await updateBooking(id, updates);

    if (!updatedBooking) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedBooking,
    });
  } catch (error) {
    console.error('Error in PATCH /api/bookings/[id]:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

