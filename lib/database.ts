// Database helper functions for Supabase operations

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { User, Service, Booking, Payment, BookingWithDetails } from './types';

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data as User;
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('role', 'provider')
    .single();

  if (error) {
    console.error('Error fetching user by username:', error);
    return null;
  }

  return data as User;
}

/**
 * Update user profile
 */
export async function updateUser(
  userId: string,
  updates: Partial<User>
): Promise<User | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return null;
  }

  return data as User;
}

/**
 * Get all services for a provider
 */
export async function getProviderServices(providerId: string): Promise<Service[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', providerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }

  return data as Service[];
}

/**
 * Get active services for a provider (for public booking page)
 */
export async function getActiveServices(providerId: string): Promise<Service[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', providerId)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active services:', error);
    return [];
  }

  return data as Service[];
}

/**
 * Get service by ID
 */
export async function getServiceById(serviceId: string): Promise<Service | null> {
  const supabase = await createClient();
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
 * Create a new service
 */
export async function createService(service: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .insert(service)
    .select()
    .single();

  if (error) {
    console.error('Error creating service:', error);
    return null;
  }

  return data as Service;
}

/**
 * Update a service
 */
export async function updateService(
  serviceId: string,
  updates: Partial<Service>
): Promise<Service | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', serviceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating service:', error);
    return null;
  }

  return data as Service;
}

/**
 * Delete a service
 */
export async function deleteService(serviceId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId);

  if (error) {
    console.error('Error deleting service:', error);
    return false;
  }

  return true;
}

/**
 * Get bookings for a provider
 */
export async function getProviderBookings(
  providerId: string,
  options?: {
    status?: string;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<BookingWithDetails[]> {
  const supabase = await createClient();
  let query = supabase
    .from('bookings')
    .select(`
      *,
      service:services(*),
      provider:users!bookings_provider_id_fkey(id, name, email, phone, username)
    `)
    .eq('provider_id', providerId);

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.startDate) {
    query = query.gte('date_time', options.startDate.toISOString());
  }

  if (options?.endDate) {
    query = query.lte('date_time', options.endDate.toISOString());
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  query = query.order('date_time', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }

  return data as BookingWithDetails[];
}

/**
 * Get a single booking by ID
 */
export async function getBookingById(bookingId: string): Promise<BookingWithDetails | null> {
  const supabase = createAdminClient(); // Use admin client to bypass RLS
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      service:services(*),
      provider:users!bookings_provider_id_fkey(id, name, email, phone, username)
    `)
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('Error fetching booking:', error);
    return null;
  }

  return data as BookingWithDetails;
}

/**
 * Create a new booking
 */
export async function createBooking(
  booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>
): Promise<Booking | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    return null;
  }

  return data as Booking;
}

/**
 * Update a booking
 */
export async function updateBooking(
  bookingId: string,
  updates: Partial<Booking>
): Promise<Booking | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking:', error);
    return null;
  }

  return data as Booking;
}

/**
 * Get bookings for a date range (for scheduling conflicts)
 */
export async function getBookingsInRange(
  providerId: string,
  startDate: Date,
  endDate: Date
): Promise<Booking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('provider_id', providerId)
    .gte('date_time', startDate.toISOString())
    .lte('date_time', endDate.toISOString())
    .in('status', ['pending', 'confirmed']);

  if (error) {
    console.error('Error fetching bookings in range:', error);
    return [];
  }

  return data as Booking[];
}

/**
 * Create a payment record
 */
export async function createPayment(
  payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>
): Promise<Payment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single();

  if (error) {
    console.error('Error creating payment:', error);
    return null;
  }

  return data as Payment;
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentIntentId: string,
  status: Payment['status']
): Promise<Payment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payments')
    .update({ status })
    .eq('stripe_payment_intent_id', paymentIntentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating payment:', error);
    return null;
  }

  return data as Payment;
}

/**
 * Log a message
 */
export async function logMessage(message: {
  booking_id: string;
  type: string;
  channel: string;
  recipient: string;
  content: string;
  status: string;
  error_message?: string;
}): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from('messages').insert(message);

  if (error) {
    console.error('Error logging message:', error);
    return false;
  }

  return true;
}


