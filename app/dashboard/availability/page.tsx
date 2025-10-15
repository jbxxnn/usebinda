// Provider availability management page

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAvailabilitySettings } from '@/lib/availability';
import { AvailabilityManagement } from '@/components/availability/availability-management';
import { DEFAULT_WORKING_HOURS, DEFAULT_BREAK_TIMES } from '@/lib/availability';

export default async function AvailabilityPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  // Get or create default availability settings
  let availabilitySettings = await getAvailabilitySettings(user.id);
  
  // If no settings exist, use defaults
  if (!availabilitySettings) {
    availabilitySettings = {
      id: '',
      user_id: user.id,
      timezone: 'America/New_York',
      working_hours: DEFAULT_WORKING_HOURS,
      break_times: DEFAULT_BREAK_TIMES,
      default_buffer_minutes: 30,
      max_bookings_per_slot: 1,
      min_advance_booking_hours: 2,
      max_advance_booking_days: 30,
      created_at: '',
      updated_at: '',
    };
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Availability Settings</h1>
        <p className="text-muted-foreground mt-1">
          Set your working hours, block dates, and manage when customers can book
        </p>
      </div>

      <AvailabilityManagement initialSettings={availabilitySettings} />
    </div>
  );
}
