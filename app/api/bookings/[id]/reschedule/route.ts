import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ApiResponse, Booking } from '@/lib/types';

/**
 * PUT /api/bookings/[id]/reschedule
 * Reschedule a booking using an access token (for guest users)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const { new_date_time, 
      // reason, 
      token } = body;

    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access token is required' },
        { status: 401 }
      );
    }

    if (!new_date_time) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'New date and time is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify booking and token
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        *,
        services (
          id,
          title,
          duration,
          buffer_minutes
        ),
        users!provider_id (
          id,
          name,
          username,
          email
        )
      `)
      .eq('id', bookingId)
      .eq('access_token', token)
      .single();

    if (fetchError || !booking) {
      console.error('Error fetching booking or invalid token:', fetchError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Booking not found or invalid access token' },
        { status: 404 }
      );
    }

    if (new Date(booking.token_expires_at!) < new Date()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Access token has expired' },
        { status: 403 }
      );
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cannot reschedule a cancelled booking' },
        { status: 400 }
      );
    }

    // Get provider's policies to check reschedule limits
    const { data: settings } = await supabase
      .from('availability_settings')
      .select('rescheduling_policy')
      .eq('user_id', booking.provider_id)
      .single();

    const reschedulingPolicy = settings?.rescheduling_policy || {
      max_reschedules_per_booking: 3,
      free_rescheduling_hours: 24,
      rescheduling_fee_hours: 2,
      rescheduling_fee_amount: 0,
      allow_provider_rescheduling: true,
    };

    // Check reschedule limit
    if (booking.reschedule_count >= reschedulingPolicy.max_reschedules_per_booking) {
      return NextResponse.json<ApiResponse>(
        { 
          success: false, 
          error: `Maximum reschedules reached (${reschedulingPolicy.max_reschedules_per_booking})` 
        },
        { status: 400 }
      );
    }

    // Validate new date is in the future
    const newDateTime = new Date(new_date_time);
    const now = new Date();
    if (newDateTime <= now) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'New appointment time must be in the future' },
        { status: 400 }
      );
    }

    // Check if the new time slot is available
    // TODO: Implement proper availability checking here
    // For now, we'll allow the reschedule and let the time slot generator handle conflicts

    // Update booking with new date/time and increment reschedule count
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        date_time: new_date_time,
        reschedule_count: booking.reschedule_count + 1,
        updated_at: new Date().toISOString(),
        // Keep the original booking reference for tracking
        rescheduled_from_booking_id: booking.rescheduled_from_booking_id || booking.id,
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('Error rescheduling booking:', updateError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to reschedule booking' },
        { status: 500 }
      );
    }

    // TODO: Implement rescheduling fee collection if applicable
    // TODO: Send rescheduling notifications (email/SMS)
    // TODO: Update provider's calendar if external sync is enabled

    return NextResponse.json<ApiResponse<Booking>>(
      { success: true, data: updatedBooking },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in PUT /api/bookings/[id]/reschedule:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
