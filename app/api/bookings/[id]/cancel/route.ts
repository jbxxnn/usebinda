// API route for cancelling bookings

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ApiResponse } from '@/lib/types';
// import { generateAccessToken } from '@/lib/booking-tokens';

/**
 * PUT /api/bookings/[id]/cancel
 * Cancel a booking (customer or provider)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const { reason, token, cancelled_by } = body; // 'customer' or 'provider'

    if (!reason) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Validate access token if cancelled by customer
    if (cancelled_by === 'customer') {
      if (!token) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Access token required for customer cancellation' },
          { status: 400 }
        );
      }

      if (booking.access_token !== token) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid access token' },
          { status: 403 }
        );
      }

      if (booking.token_expires_at && new Date(booking.token_expires_at) < new Date()) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Access token has expired' },
          { status: 403 }
        );
      }
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    // Get provider's cancellation policy
    const { data: settings } = await supabase
      .from('availability_settings')
      .select('cancellation_policy')
      .eq('user_id', booking.provider_id)
      .single();

    const cancellationPolicy = settings?.cancellation_policy || {
      free_cancellation_hours: 24,
      partial_refund_hours: 2,
      no_refund_hours: 0,
      partial_refund_percentage: 50,
    };

    // Calculate refund based on policy
    const appointmentTime = new Date(booking.date_time);
    const now = new Date();
    const hoursUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundAmount = 0;
    let refundStatus = 'no_refund';

    if (hoursUntilAppointment >= cancellationPolicy.free_cancellation_hours) {
      // Full refund
      refundAmount = 100;
      refundStatus = 'full_refund';
    } else if (hoursUntilAppointment >= cancellationPolicy.partial_refund_hours) {
      // Partial refund
      refundAmount = cancellationPolicy.partial_refund_percentage;
      refundStatus = 'partial_refund';
    } else if (hoursUntilAppointment >= cancellationPolicy.no_refund_hours) {
      // No refund
      refundAmount = 0;
      refundStatus = 'no_refund';
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
        // Invalidate the access token after cancellation
        access_token: null,
        token_expires_at: null,
      })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to cancel booking' },
        { status: 500 }
      );
    }

    // TODO: Process refund through Stripe if applicable
    // TODO: Send cancellation notifications (SMS/Email)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        booking_id: bookingId,
        status: 'cancelled',
        refund_amount: refundAmount,
        refund_status: refundStatus,
        message: 'Booking cancelled successfully',
      },
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
