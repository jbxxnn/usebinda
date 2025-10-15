// API route for services CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProviderServices, createService } from '@/lib/database';
import { validateServiceData } from '@/lib/validation';
import { dollarsToCents } from '@/lib/stripe';
import type { ApiResponse } from '@/lib/types';

/**
 * GET /api/services
 * Get all services for the authenticated provider
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const services = await getProviderServices(user.id);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Error in GET /api/services:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/services
 * Create a new service
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
    
    // Validate input
    const validationErrors = validateServiceData({
      title: body.title,
      price: body.price,
      duration: body.duration,
      buffer_minutes: body.buffer_minutes || 0,
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

    // Convert price from dollars to cents
    const priceInCents = dollarsToCents(body.price);

    const serviceData = {
      user_id: user.id,
      title: body.title,
      description: body.description || null,
      price: priceInCents,
      duration: body.duration,
      buffer_minutes: body.buffer_minutes || 0,
      service_areas: body.service_areas || [],
      active: body.active ?? true,
    };

    const service = await createService(serviceData);

    if (!service) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to create service' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, data: service },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/services:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

