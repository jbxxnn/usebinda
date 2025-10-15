// Bookings management page

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProviderBookings } from '@/lib/database';
import { BookingsList } from '@/components/bookings/bookings-list';

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Get all bookings
  const allBookings = await getProviderBookings(user.id);

  // Separate by status
  const upcoming = allBookings.filter(
    b => b.status === 'confirmed' && new Date(b.date_time) > new Date()
  );
  const past = allBookings.filter(
    b => (b.status === 'completed' || new Date(b.date_time) < new Date()) && b.status !== 'cancelled'
  );
  const cancelled = allBookings.filter(b => b.status === 'cancelled');

  return (
    <div className="flex-1 w-full flex flex-col gap-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold">Bookings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your upcoming and past appointments
        </p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Upcoming ({upcoming.length})
          </h2>
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              No upcoming bookings
            </div>
          ) : (
            <BookingsList bookings={upcoming} />
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">
            Past ({past.length})
          </h2>
          {past.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              No past bookings
            </div>
          ) : (
            <BookingsList bookings={past} />
          )}
        </section>

        {cancelled.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">
              Cancelled ({cancelled.length})
            </h2>
            <BookingsList bookings={cancelled} />
          </section>
        )}
      </div>
    </div>
  );
}


