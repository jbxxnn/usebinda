// API route for user profile updates

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateUser } from '@/lib/database';
import { isValidUsername, isValidPhone } from '@/lib/validation';
import type { ApiResponse, User } from '@/lib/types';

/**
 * PUT /api/user/profile
 * Update user profile
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

    // Validate username if provided
    if (body.username && !isValidUsername(body.username)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid username format' },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (body.phone && !isValidPhone(body.phone)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Check if username is already taken
    if (body.username) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', body.username)
        .neq('id', user.id)
        .single();

      if (existingUser) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }

    const updates: Partial<User> = {};
    if (body.name) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.username !== undefined) updates.username = body.username;
    if (body.timezone) updates.timezone = body.timezone;

    const updatedUser = await updateUser(user.id, updates);

    if (!updatedUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error in PUT /api/user/profile:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

