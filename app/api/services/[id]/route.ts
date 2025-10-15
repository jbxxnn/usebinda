// API route for individual service operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServiceById, updateService, deleteService } from '@/lib/database';
import { validateServiceData } from '@/lib/validation';
import { dollarsToCents } from '@/lib/stripe';
import type { ApiResponse, Service } from '@/lib/types';

/**
 * GET /api/services/[id]
 * Get a single service by ID
 */
export async function GET(
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

    const service = await getServiceById(id);

    if (!service) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    // Check if user owns this service
    if (service.user_id !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Error in GET /api/services/[id]:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/services/[id]
 * Update a service
 */
export async function PUT(
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

    // Check if service exists and user owns it
    const existingService = await getServiceById(id);
    if (!existingService) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    if (existingService.user_id !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input if provided
    if (body.title || body.price || body.duration) {
      const validationErrors = validateServiceData({
        title: body.title || existingService.title,
        price: body.price || existingService.price,
        duration: body.duration || existingService.duration,
        buffer_minutes: body.buffer_minutes ?? existingService.buffer_minutes,
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
    }

    const updates: Partial<Service> = {};
    if (body.title) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.price) updates.price = dollarsToCents(body.price);
    if (body.duration) updates.duration = body.duration;
    if (body.buffer_minutes !== undefined) updates.buffer_minutes = body.buffer_minutes;
    if (body.service_areas) updates.service_areas = body.service_areas;
    if (body.active !== undefined) updates.active = body.active;

    const updatedService = await updateService(id, updates);

    if (!updatedService) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update service' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedService,
    });
  } catch (error) {
    console.error('Error in PUT /api/services/[id]:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/services/[id]
 * Delete a service
 */
export async function DELETE(
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

    // Check if service exists and user owns it
    const existingService = await getServiceById(id);
    if (!existingService) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    if (existingService.user_id !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const success = await deleteService(id);

    if (!success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to delete service' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Service deleted successfully' },
    });
  } catch (error) {
    console.error('Error in DELETE /api/services/[id]:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

