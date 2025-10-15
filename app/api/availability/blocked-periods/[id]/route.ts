// API route for individual blocked period operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteBlockedPeriod } from '@/lib/availability';
import type { ApiResponse } from '@/lib/types';

/**
 * DELETE /api/availability/blocked-periods/[id]
 * Delete a blocked period
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

    // TODO: Verify user owns this blocked period
    // For now, we'll let the database RLS handle this

    const success = await deleteBlockedPeriod(id);

    if (!success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to delete blocked period' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: 'Blocked period deleted successfully' },
    });
  } catch (error) {
    console.error('Error in DELETE /api/availability/blocked-periods/[id]:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
