// Availability and scheduling helper functions

import { createAdminClient } from '@/lib/supabase/admin';
import type { 
  AvailabilitySettings, 
  BlockedPeriod, 
  AvailabilityTemplate,
  WorkingHours,
  BreakTime 
} from './types';

/**
 * Get availability settings for a provider
 */
export async function getAvailabilitySettings(userId: string): Promise<AvailabilitySettings | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('availability_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching availability settings:', error);
    return null;
  }

  return data as AvailabilitySettings;
}

/**
 * Create or update availability settings for a provider
 */
export async function upsertAvailabilitySettings(
  userId: string, 
  settings: Partial<AvailabilitySettings>
): Promise<AvailabilitySettings | null> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('availability_settings')
    .upsert({
      user_id: userId,
      ...settings,
    }, {
      onConflict: 'user_id', // Use user_id as the conflict target
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting availability settings:', error);
    return null;
  }

  return data as AvailabilitySettings;
}

/**
 * Get blocked periods for a provider within a date range
 */
export async function getBlockedPeriods(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<BlockedPeriod[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('blocked_periods')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', startDate.toISOString())
    .lte('end_time', endDate.toISOString())
    .order('start_time');

  if (error) {
    console.error('Error fetching blocked periods:', error);
    return [];
  }

  return data as BlockedPeriod[];
}

/**
 * Create a blocked period
 */
export async function createBlockedPeriod(
  userId: string,
  blockedPeriod: Omit<BlockedPeriod, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<BlockedPeriod | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('blocked_periods')
    .insert({
      user_id: userId,
      ...blockedPeriod,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating blocked period:', error);
    return null;
  }

  return data as BlockedPeriod;
}

/**
 * Delete a blocked period
 */
export async function deleteBlockedPeriod(blockedPeriodId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('blocked_periods')
    .delete()
    .eq('id', blockedPeriodId);

  if (error) {
    console.error('Error deleting blocked period:', error);
    return false;
  }

  return true;
}

/**
 * Get availability templates for a provider
 */
export async function getAvailabilityTemplates(userId: string): Promise<AvailabilityTemplate[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('availability_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching availability templates:', error);
    return [];
  }

  return data as AvailabilityTemplate[];
}

/**
 * Create an availability template
 */
export async function createAvailabilityTemplate(
  userId: string,
  template: Omit<AvailabilityTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<AvailabilityTemplate | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('availability_templates')
    .insert({
      user_id: userId,
      ...template,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating availability template:', error);
    return null;
  }

  return data as AvailabilityTemplate;
}

// Default working hours for new providers
export const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday: { start: '09:00', end: '17:00', enabled: true },
  tuesday: { start: '09:00', end: '17:00', enabled: true },
  wednesday: { start: '09:00', end: '17:00', enabled: true },
  thursday: { start: '09:00', end: '17:00', enabled: true },
  friday: { start: '09:00', end: '17:00', enabled: true },
  saturday: { start: '10:00', end: '15:00', enabled: false },
  sunday: { start: '10:00', end: '15:00', enabled: false },
};

// Default break times
export const DEFAULT_BREAK_TIMES: BreakTime[] = [
  { start: '12:00', end: '13:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
];

/**
 * Get day name from date
 */
export function getDayName(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

/**
 * Check if a time falls within working hours
 */
export function isWithinWorkingHours(
  date: Date,
  workingHours: WorkingHours,
  timezone: string = 'America/New_York'
): boolean {
  const dayName = getDayName(date);
  const dayHours = workingHours[dayName];
  
  if (!dayHours || !dayHours.enabled) {
    return false;
  }

  const timeStr = date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  return timeStr >= dayHours.start && timeStr <= dayHours.end;
}

/**
 * Check if a time falls within break periods
 */
export function isWithinBreakTime(
  date: Date,
  breakTimes: BreakTime[],
  timezone: string = 'America/New_York'
): boolean {
  const dayName = getDayName(date);
  const timeStr = date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  return breakTimes.some(breakTime => 
    breakTime.days.includes(dayName) && 
    timeStr >= breakTime.start && 
    timeStr < breakTime.end
  );
}

/**
 * Check if a time period is blocked
 */
export function isTimeBlocked(
  startTime: Date,
  endTime: Date,
  blockedPeriods: BlockedPeriod[]
): boolean {
  return blockedPeriods.some(blocked => {
    const blockedStart = new Date(blocked.start_time);
    const blockedEnd = new Date(blocked.end_time);
    
    // Check for any overlap
    return (
      (startTime >= blockedStart && startTime < blockedEnd) ||
      (endTime > blockedStart && endTime <= blockedEnd) ||
      (startTime <= blockedStart && endTime >= blockedEnd)
    );
  });
}
