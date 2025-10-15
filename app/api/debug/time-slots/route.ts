// Debug API for time slot generation

import { NextRequest, NextResponse } from 'next/server';
import { debugTimeSlotGeneration } from '@/lib/debug-time-slots';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const serviceId = searchParams.get('serviceId');
    const dateStr = searchParams.get('date');

    if (!providerId || !serviceId || !dateStr) {
      return NextResponse.json({
        success: false,
        error: 'providerId, serviceId, and date are required'
      }, { status: 400 });
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid date format'
      }, { status: 400 });
    }

    console.log('=== DEBUG API CALL ===');
    const slots = await debugTimeSlotGeneration(providerId, serviceId, date);

    return NextResponse.json({
      success: true,
      data: {
        providerId,
        serviceId,
        date: date.toISOString(),
        slotsCount: slots.length,
        availableSlotsCount: slots.filter(s => s.available).length,
        slots: slots.map(s => ({
          start: s.start,
          end: s.end,
          available: s.available,
          startLocal: new Date(s.start).toLocaleString(),
          endLocal: new Date(s.end).toLocaleString()
        }))
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
