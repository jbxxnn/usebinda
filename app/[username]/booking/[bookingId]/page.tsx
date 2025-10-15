// Guest booking management page

import { notFound, 
  // redirect 
} from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { BookingManagement } from '@/components/booking/booking-management';

interface BookingManagementPageProps {
  params: {
    username: string;
    bookingId: string;
  };
  searchParams: {
    token?: string;
  };
}

export default async function BookingManagementPage({ 
  params, 
  searchParams 
}: BookingManagementPageProps) {
  const { 
    // username, 
    bookingId } = params;
  const { token } = searchParams;

  // Validate token
  if (!token) {
    notFound();
  }

  const supabase = createAdminClient();

  try {
    // Get the booking with token validation
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        services (
          id,
          title,
          description,
          price,
          duration,
          buffer_minutes
        ),
        users!provider_id (
          id,
          name,
          username,
          email,
          phone
        )
      `)
      .eq('id', bookingId)
      .eq('access_token', token)
      .single();

    if (bookingError || !booking) {
      notFound();
    }

    // Check if token is expired
    if (booking.token_expires_at && new Date(booking.token_expires_at) < new Date()) {
      notFound();
    }

    // Get provider's policies
    const { data: settings } = await supabase
      .from('availability_settings')
      .select('cancellation_policy, rescheduling_policy, notification_preferences')
      .eq('user_id', booking.provider_id)
      .single();

    const policies = {
      cancellation_policy: settings?.cancellation_policy || {
        free_cancellation_hours: 24,
        partial_refund_hours: 2,
        no_refund_hours: 0,
        partial_refund_percentage: 50,
        allow_provider_cancellation: true,
      },
      rescheduling_policy: settings?.rescheduling_policy || {
        free_rescheduling_hours: 24,
        rescheduling_fee_hours: 2,
        rescheduling_fee_amount: 0,
        max_reschedules_per_booking: 3,
        allow_provider_rescheduling: true,
      },
      notification_preferences: settings?.notification_preferences || {
        send_sms_cancellations: true,
        send_email_cancellations: true,
        send_sms_reschedules: true,
        send_email_reschedules: true,
        notify_provider_on_cancellation: true,
        notify_provider_on_reschedule: true,
      },
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto py-8 px-4">
          <BookingManagement 
            booking={booking}
            policies={policies}
            accessToken={token}
          />
        </div>
      </div>
    );

  } catch (error) {
    console.error('Error loading booking:', error);
    notFound();
  }
}
