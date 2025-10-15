// Lightweight date availability checker for calendar
// This is much faster than full time slot generation

import type { AvailabilitySettings, Service } from './types';
import { createAdminClient } from './supabase/admin';

/**
 * Quick check if a date has any available slots (without generating all slots)
 * This is much faster than the full time slot generation
 */
export async function hasAvailableSlots(
  providerId: string,
  serviceId: string,
  date: Date
): Promise<boolean> {
  try {
    // 1. Get provider settings (cached)
    const settings = await getProviderAvailability(providerId);
    if (!settings) return false;

    // 2. Get service details (cached)
    const service = await getServiceDetails(serviceId);
    if (!service) return false;

    // 3. Quick date validation
    if (!isDateBookable(date, settings)) return false;

    // 4. Check if provider works on this day
    const dayName = getDayName(date);
    const dayHours = settings.working_hours[dayName];
    if (!dayHours || !dayHours.enabled) return false;

    // 5. Check if there's enough time in the day for at least one service
    const totalDuration = service.duration + (service.buffer_minutes || settings.default_buffer_minutes);
    const workingHoursMinutes = getWorkingHoursMinutes(dayHours);
    
    if (totalDuration > workingHoursMinutes) return false;

    // 6. Check for blocked periods - if the entire day is blocked, no availability
    const isDayBlocked = await isEntireDayBlocked(providerId, date, dayHours);
    if (isDayBlocked) {
      return false; // Entire day is blocked
    }

    // 7. Check existing bookings (quick check)
    const existingBookings = await getBookingsCountForDate(providerId, date);
    const maxPossibleSlots = Math.floor(workingHoursMinutes / 15); // 15-minute intervals
    
    // If we have fewer bookings than possible slots, there's likely availability
    return existingBookings < maxPossibleSlots;

  } catch (error) {
    console.error('Error checking date availability:', error);
    return false;
  }
}

/**
 * Get working hours in minutes
 */
function getWorkingHoursMinutes(dayHours: { start: string; end: string }): number {
  const [startHour, startMinute] = dayHours.start.split(':').map(Number);
  const [endHour, endMinute] = dayHours.end.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  return endMinutes - startMinutes;
}

/**
 * Check if a date is within the bookable window
 */
function isDateBookable(date: Date, settings: AvailabilitySettings): boolean {
  const now = new Date();
  
  // TEMPORARY: Relax advance booking rules for testing
  if (date < now) return false;
  
  return true;
}

/**
 * Get day name from date
 */
function getDayName(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

/**
 * Fetch provider's availability settings
 */
async function getProviderAvailability(providerId: string): Promise<AvailabilitySettings | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('availability_settings')
    .select('*')
    .eq('user_id', providerId)
    .single();

  if (error) {
    return null;
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
    return null;
  }

  return data as Service;
}

/**
 * Check if the entire working day is blocked by blocked periods
 */
async function isEntireDayBlocked(
  providerId: string, 
  date: Date, 
  dayHours: { start: string; end: string }
): Promise<boolean> {
  const supabase = createAdminClient();
  
  // Create day boundaries based on working hours
  const dayStart = new Date(date);
  const [startHour, startMinute] = dayHours.start.split(':').map(Number);
  dayStart.setHours(startHour, startMinute, 0, 0);
  
  const dayEnd = new Date(date);
  const [endHour, endMinute] = dayHours.end.split(':').map(Number);
  dayEnd.setHours(endHour, endMinute, 0, 0);

  // Get all blocked periods that overlap with this working day
  const { data: blockedPeriods, error } = await supabase
    .from('blocked_periods')
    .select('start_time, end_time')
    .eq('user_id', providerId)
    .lte('start_time', dayEnd.toISOString())
    .gte('end_time', dayStart.toISOString());

  if (error || !blockedPeriods || blockedPeriods.length === 0) {
    return false; // No blocked periods or error
  }

  // Sort blocked periods by start time
  blockedPeriods.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // Check if blocked periods cover the entire working day
  let currentTime = new Date(dayStart);
  
  for (const blocked of blockedPeriods) {
    const blockStart = new Date(blocked.start_time);
    const blockEnd = new Date(blocked.end_time);
    
    // If there's a gap before this blocked period, the day is not entirely blocked
    if (blockStart > currentTime) {
      return false;
    }
    
    // Move current time to the end of this blocked period
    if (blockEnd > currentTime) {
      currentTime = blockEnd;
    }
    
    // If we've covered the entire working day, it's fully blocked
    if (currentTime >= dayEnd) {
      return true;
    }
  }
  
  // If we reach here, there might be unblocked time at the end
  return currentTime >= dayEnd;
}

/**
 * Get count of existing bookings for a date
 */
async function getBookingsCountForDate(providerId: string, date: Date): Promise<number> {
  const supabase = createAdminClient();
  
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const { count, error } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', providerId)
    .gte('date_time', dayStart.toISOString())
    .lte('date_time', dayEnd.toISOString())
    .in('status', ['pending', 'confirmed']);

  if (error) return 0;
  return count || 0;
}
