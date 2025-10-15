// API route for creating bookings

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateBookingData } from '@/lib/validation';
import type { ApiResponse } from '@/lib/types';

/**
 * POST /api/bookings
 * Create a new booking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationErrors = validateBookingData({
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      customer_address: body.customer_address,
      customer_zip: body.customer_zip,
      date_time: body.date_time,
    });

    if (validationErrors.length > 0) {
      return NextResponse.json<ApiResponse>(
        { 
          success: false, 
          error: validationErrors.map(e => e.message).join(', ') 
        },
        { status: 400 }
      );
    }

    // Create booking using service role (bypasses RLS)
    const supabase = createAdminClient();
    
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        service_id: body.service_id,
        provider_id: body.provider_id,
        customer_id: null, // Guest booking
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        customer_address: body.customer_address,
        customer_zip: body.customer_zip,
        date_time: body.date_time,
        notes: body.notes || null,
        status: 'pending',
        payment_status: 'unpaid',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating booking:', insertError);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data: booking },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


