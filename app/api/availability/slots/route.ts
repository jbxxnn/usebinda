// API route for time slot generation
// This endpoint is called by customers to see available booking times

import { NextRequest, NextResponse } from 'next/server';
import { generateTimeSlots, 
  // getAvailableDates 
  } from '@/lib/time-slot-generator';
import { hasAvailableSlots } from '@/lib/date-availability-checker';
import type { ApiResponse } from '@/lib/types';

/**
 * GET /api/availability/slots
 * Generate available time slots for a provider's service on a specific date
 * 
 * Query params:
 * - providerId: UUID of the provider
 * - serviceId: UUID of the service
 * - date: ISO date string (e.g., 2025-10-20T00:00:00.000Z)
 * - mode: 'slots' (default) or 'dates'
 * 
 * Mode 'slots': Returns time slots for a specific date
 * Mode 'dates': Returns list of dates with available slots
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const serviceId = searchParams.get('serviceId');
    const dateStr = searchParams.get('date');
    const mode = searchParams.get('mode') || 'slots';
    const customerTimezone = searchParams.get('timezone'); // Customer's timezone

    // Validate required parameters
    if (!providerId || !serviceId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'providerId and serviceId are required' },
        { status: 400 }
      );
    }

    // Mode: Get available dates (FAST VERSION)
    if (mode === 'dates') {
      const daysAhead = parseInt(searchParams.get('daysAhead') || '30');
      const availableDates = await getAvailableDatesFast(providerId, serviceId, daysAhead);
      
      return NextResponse.json<ApiResponse>({
        success: true,
        data: availableDates.map(d => d.toISOString()),
      });
    }

    // Mode: Get time slots for a specific date
    if (!dateStr) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'date is required for slots mode' },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Generate time slots
    const slots = await generateTimeSlots(providerId, serviceId, date, customerTimezone || undefined);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error('Error in GET /api/availability/slots:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Fast version of getAvailableDates that uses lightweight availability checking
 */
async function getAvailableDatesFast(
  providerId: string,
  serviceId: string,
  daysAhead: number = 30
): Promise<Date[]> {
  // const availableDates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check each day for the next N days
  const promises = [];
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Create promise for each date check
    promises.push(
      hasAvailableSlots(providerId, serviceId, date).then(hasSlots => {
        if (hasSlots) {
          return date;
        }
        return null;
      })
    );
  }

  // Wait for all date checks to complete
  const results = await Promise.all(promises);
  
  // Filter out null results (dates with no available slots)
  return results.filter((date): date is Date => date !== null);
}

