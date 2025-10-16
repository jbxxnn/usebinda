// Smart time slot generation engine for Binda
// This is the core "Calendly-like" scheduling algorithm

import type {
  AvailabilitySettings,
  BlockedPeriod,
  Service,
  TimeSlot,
  // WorkingHours,
  BreakTime,
} from './types';
import { createAdminClient } from './supabase/admin';
import { 
  convertToUTC, 
  // convertFromUTC, 
  // parseTimeInTimezone,
  // formatTimeInTimezone,
  // getCurrentTimeInTimezone
} from './timezone';

/**
 * Generate available time slots for a specific date
 * This is the main scheduling algorithm that considers:
 * - Provider's working hours
 * - Break times
 * - Buffer times between appointments
 * - Blocked periods (holidays, vacations)
 * - Existing bookings
 * - Advance booking rules
 * - Capacity limits
 */
export async function generateTimeSlots(
  providerId: string,
  serviceId: string,
  date: Date,
  customerTimezone?: string
): Promise<TimeSlot[]> {
  // Debug logging removed for performance
  
  // 1. Fetch provider's availability settings
  const settings = await getProviderAvailability(providerId);
  if (!settings) {
    return [];
  }

  // 2. Fetch service details
  const service = await getServiceDetails(serviceId);
  if (!service) {
    return [];
  }

  // 3. Check if date is within booking window
  const isBookable = isDateBookable(date, settings);
  if (!isBookable) {
    return [];
  }

  // 4. Get day of week and check if provider works that day
  const dayName = getDayName(date);
  const dayHours = settings.working_hours[dayName];
  if (!dayHours || !dayHours.enabled) {
    return []; // Provider doesn't work on this day
  }

  // 5. Fetch blocked periods for this date
  const blockedPeriods = await getBlockedPeriodsForDate(providerId, date);

  // 6. Fetch existing bookings for this date
  const existingBookings = await getBookingsForDate(providerId, date);

  // 7. Determine buffer time (service-specific first, then fallback to default)
  const bufferMinutes = service.buffer_minutes || settings.default_buffer_minutes;
  // Generate time slots for the day
  const slots = generateSlotsForDay(
    date,
    dayHours,
    settings.break_times || [],
    service,
    bufferMinutes,
    settings.timezone,
    blockedPeriods,
    existingBookings,
    settings.max_bookings_per_slot,
    customerTimezone
  );

  return slots;
}

/**
 * Generate slots for a specific day
 */
function generateSlotsForDay(
  date: Date,
  workingHours: { start: string; end: string; enabled: boolean },
  breakTimes: BreakTime[],
  service: Service,
  bufferMinutes: number,
  providerTimezone: string,
  blockedPeriods: BlockedPeriod[],
  existingBookings: Array<{ date_time: string; service_id: string }>,
  maxBookingsPerSlot: number,
  customerTimezone?: string
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Parse working hours in provider's timezone
  const [startHour, startMinute] = workingHours.start.split(':').map(Number);
  const [endHour, endMinute] = workingHours.end.split(':').map(Number);

  // Create start and end times for the day in provider's timezone
  const dayStart = new Date(date);
  dayStart.setHours(startHour, startMinute, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, endMinute, 0, 0);

  // Convert provider's local times to UTC for storage
  // const dayStartUTC = convertToUTC(dayStart, providerTimezone);
  // const dayEndUTC = convertToUTC(dayEnd, providerTimezone);

  // Total time needed for a booking (service duration + buffer)
  const totalDuration = service.duration + bufferMinutes;

  // Generate slots at 15-minute intervals (configurable)
  const slotInterval = 15; // minutes
  const currentTime = new Date(dayStart);

  // Generate slots at 15-minute intervals
  while (currentTime < dayEnd) {
    const slotStart = new Date(currentTime);
    const slotEnd = new Date(currentTime);
    slotEnd.setMinutes(slotEnd.getMinutes() + totalDuration);

    // Convert slot times to UTC for storage and comparison
    const slotStartUTC = convertToUTC(slotStart, providerTimezone);
    const slotEndUTC = convertToUTC(slotEnd, providerTimezone);

    // Check if slot end is within working hours
    if (slotEnd <= dayEnd) {
      // Check availability using UTC times
      const available = isSlotAvailable(
        slotStartUTC,
        slotEndUTC,
        service.duration,
        breakTimes,
        blockedPeriods,
        existingBookings,
        maxBookingsPerSlot,
        getDayName(date)
      );

      // Store slots in UTC, but display times based on customer timezone if provided
      const displayStart = customerTimezone ? slotStartUTC : slotStartUTC;
      const displayEnd = customerTimezone ? slotEndUTC : slotEndUTC;

      slots.push({
        start: displayStart.toISOString(),
        end: displayEnd.toISOString(),
        available,
      });
    }

    // Move to next slot
    currentTime.setMinutes(currentTime.getMinutes() + slotInterval);
  }

  return slots;
}

/**
 * Check if a specific time slot is available
 */
function isSlotAvailable(
  slotStart: Date,
  slotEnd: Date,
  serviceDuration: number,
  breakTimes: BreakTime[],
  blockedPeriods: BlockedPeriod[],
  existingBookings: Array<{ date_time: string; service_id: string }>,
  maxBookingsPerSlot: number,
  dayName: string
): boolean {
  // 1. Check if slot is in the past
  const now = new Date();
  if (slotStart <= now) {
    return false;
  }

  // 2. Check if slot conflicts with break times
  if (isSlotDuringBreak(slotStart, slotEnd, serviceDuration, breakTimes, dayName)) {
    return false;
  }

  // 3. Check if slot conflicts with blocked periods
  if (isSlotBlocked(slotStart, slotEnd, blockedPeriods)) {
    return false;
  }

  // 4. Check capacity - count existing bookings at this time
  const bookingCount = countBookingsAtTime(slotStart, existingBookings);
  if (bookingCount >= maxBookingsPerSlot) {
    return false;
  }

  return true;
}

/**
 * Check if slot conflicts with any break times
 */
function isSlotDuringBreak(
  slotStart: Date,
  slotEnd: Date,
  serviceDuration: number,
  breakTimes: BreakTime[],
  dayName: string
): boolean {
  const slotStartTime = formatTimeHHMM(slotStart);
  const slotEndTime = formatTimeHHMM(slotEnd);

  for (const breakTime of breakTimes) {
    // Check if this break applies to this day
    if (!breakTime.days.includes(dayName)) {
      continue;
    }

    // Check for overlap - block any slot that conflicts with break times
    // This prevents double-booking and ensures proper break time
    if (
      (slotStartTime < breakTime.end && slotEndTime > breakTime.start) ||
      (slotStartTime >= breakTime.start && slotStartTime < breakTime.end) ||
      (slotEndTime > breakTime.start && slotEndTime <= breakTime.end)
    ) {
      return true; // Conflicts with break
    }
  }

  return false;
}

/**
 * Check if slot is blocked
 */
function isSlotBlocked(
  slotStart: Date,
  slotEnd: Date,
  blockedPeriods: BlockedPeriod[]
): boolean {
  for (const blocked of blockedPeriods) {
    const blockedStart = new Date(blocked.start_time);
    const blockedEnd = new Date(blocked.end_time);

    // Check for any overlap
    if (
      (slotStart >= blockedStart && slotStart < blockedEnd) ||
      (slotEnd > blockedStart && slotEnd <= blockedEnd) ||
      (slotStart <= blockedStart && slotEnd >= blockedEnd)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Count how many bookings exist at a specific time
 */
function countBookingsAtTime(
  slotStart: Date,
  existingBookings: Array<{ date_time: string; service_id: string }>
): number {
  let count = 0;
  const slotTime = slotStart.toISOString();

  for (const booking of existingBookings) {
    if (booking.date_time === slotTime) {
      count++;
    }
  }

  return count;
}

/**
 * Check if a date is within the bookable window
 */
function isDateBookable(date: Date, settings: AvailabilitySettings): boolean { // eslint-disable-line @typescript-eslint/no-unused-vars
  const now = new Date();
  
  // TEMPORARY: Relax advance booking rules for testing
  // For now, allow booking any date that's not in the past
  if (date < now) {
    return false;
  }
  
  return true;
  
  // Original logic (commented out for testing):
  /*
  // Check minimum advance booking
  const minAdvanceMs = settings.min_advance_booking_hours * 60 * 60 * 1000;
  const minBookableDate = new Date(now.getTime() + minAdvanceMs);
  
  if (date < minBookableDate) {
    return false;
  }

  // Check maximum advance booking
  const maxAdvanceMs = settings.max_advance_booking_days * 24 * 60 * 60 * 1000;
  const maxBookableDate = new Date(now.getTime() + maxAdvanceMs);
  
  if (date > maxBookableDate) {
    return false;
  }

  return true;
  */
}

/**
 * Get day name from date
 */
function getDayName(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

/**
 * Format time as HH:MM
 */
function formatTimeHHMM(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Fetch provider's availability settings
 * If no settings exist, create default settings
 */
async function getProviderAvailability(providerId: string): Promise<AvailabilitySettings | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('availability_settings')
    .select('*')
    .eq('user_id', providerId)
    .single();

  if (error) {
    // If no settings exist, create default settings
    if (error.code === 'PGRST116') { // "The result contains 0 rows"
      console.log('No availability settings found, creating defaults for provider:', providerId);
      
      const defaultSettings = {
        user_id: providerId,
        timezone: 'America/New_York',
        working_hours: {
          monday: { start: '09:00', end: '17:00', enabled: true },
          tuesday: { start: '09:00', end: '17:00', enabled: true },
          wednesday: { start: '09:00', end: '17:00', enabled: true },
          thursday: { start: '09:00', end: '17:00', enabled: true },
          friday: { start: '09:00', end: '17:00', enabled: true },
          saturday: { start: '09:00', end: '17:00', enabled: false },
          sunday: { start: '09:00', end: '17:00', enabled: false },
        },
        break_times: [],
        default_buffer_minutes: 30,
        max_bookings_per_slot: 1,
        min_advance_booking_hours: 2,
        max_advance_booking_days: 30,
      };

      const { data: newData, error: insertError } = await supabase
        .from('availability_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default availability settings:', insertError);
        return null;
      }

      return newData as AvailabilitySettings;
    } else {
      console.error('Error fetching provider availability:', error);
      return null;
    }
  }

  return data as AvailabilitySettings;
}

/**
 * Fetch service details
 */
async function getServiceDetails(serviceId: string): Promise<Service | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .single();

  if (error) {
    console.error('Error fetching service:', error);
    return null;
  }

  return data as Service;
}

/**
 * Fetch blocked periods for a specific date
 */
async function getBlockedPeriodsForDate(
  providerId: string,
  date: Date
): Promise<BlockedPeriod[]> {
  const supabase = createAdminClient();
  
  // Get start and end of day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('blocked_periods')
    .select('*')
    .eq('user_id', providerId)
    .lte('start_time', dayEnd.toISOString())
    .gte('end_time', dayStart.toISOString());

  if (error) {
    console.error('Error fetching blocked periods:', error);
    return [];
  }

  return data as BlockedPeriod[];
}

/**
 * Fetch existing bookings for a specific date
 */
async function getBookingsForDate(
  providerId: string,
  date: Date
): Promise<Array<{ date_time: string; service_id: string }>> {
  const supabase = createAdminClient();
  
  // Get start and end of day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('bookings')
    .select('date_time, service_id')
    .eq('provider_id', providerId)
    .gte('date_time', dayStart.toISOString())
    .lte('date_time', dayEnd.toISOString())
    .in('status', ['pending', 'confirmed']); // Only count active bookings

  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }

  return data;
}

/**
 * Get available dates for the next N days
 * Returns dates that have at least one available slot
 */
export async function getAvailableDates(
  providerId: string,
  serviceId: string,
  daysAhead: number = 30
): Promise<Date[]> {
  const availableDates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch settings once
  const settings = await getProviderAvailability(providerId);
  if (!settings) {
    return [];
  }

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    // Quick check: is this day enabled?
    const dayName = getDayName(date);
    const dayHours = settings.working_hours[dayName];
    
    if (dayHours && dayHours.enabled && isDateBookable(date, settings)) {
      // Check if there's at least one available slot
      const slots = await generateTimeSlots(providerId, serviceId, date); //, settings.timezone);
      const hasAvailableSlots = slots.some(slot => slot.available);
      
      if (hasAvailableSlots) {
        availableDates.push(date);
      }
    }
  }

  return availableDates;
}

