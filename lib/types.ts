// Core type definitions for Binda MVP

export type UserRole = 'provider' | 'customer';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type PaymentStatus = 'unpaid' | 'deposit' | 'paid' | 'refunded';

export type MessageType = 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'on_my_way' | 'rebook' | 'review';

export type MessageChannel = 'sms' | 'email';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  username: string | null; // For provider's public booking page
  created_at: string;
  stripe_customer_id: string | null;
  timezone: string; // e.g., 'America/New_York'
}

export interface Service {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number; // In cents (e.g., 10000 = $100.00)
  duration: number; // In minutes
  buffer_minutes: number; // Travel/prep time buffer
  active: boolean;
  service_areas: string[]; // Array of ZIP codes
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  service_id: string;
  provider_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_zip: string;
  date_time: string; // ISO timestamp in UTC
  notes: string | null;
  status: BookingStatus;
  payment_status: PaymentStatus;
  access_token: string | null;
  token_expires_at: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  rescheduled_from_booking_id: string | null;
  reschedule_count: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number; // In cents
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripe_payment_intent_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  booking_id: string;
  type: MessageType;
  channel: MessageChannel;
  recipient: string; // Phone number or email
  content: string;
  sent_at: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
}

// Availability and Scheduling Types

export interface WorkingHours {
  [day: string]: {
    start: string; // "09:00"
    end: string;   // "17:00"
    enabled: boolean;
  };
}

export interface BreakTime {
  start: string; // "12:00"
  end: string;   // "13:00"
  days: string[]; // ["monday", "tuesday", ...]
}

export interface AvailabilitySettings {
  id: string;
  user_id: string;
  timezone: string;
  working_hours: WorkingHours;
  break_times: BreakTime[];
  default_buffer_minutes: number;
  max_bookings_per_slot: number;
  min_advance_booking_hours: number;
  max_advance_booking_days: number;
  cancellation_policy: CancellationPolicy;
  rescheduling_policy: ReschedulingPolicy;
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

export interface CancellationPolicy {
  free_cancellation_hours: number;
  partial_refund_hours: number;
  no_refund_hours: number;
  partial_refund_percentage: number;
  allow_provider_cancellation: boolean;
}

export interface ReschedulingPolicy {
  free_rescheduling_hours: number;
  rescheduling_fee_hours: number;
  rescheduling_fee_amount: number;
  max_reschedules_per_booking: number;
  allow_provider_rescheduling: boolean;
}

export interface NotificationPreferences {
  send_sms_cancellations: boolean;
  send_email_cancellations: boolean;
  send_sms_reschedules: boolean;
  send_email_reschedules: boolean;
  notify_provider_on_cancellation: boolean;
  notify_provider_on_reschedule: boolean;
}

export type BlockType = 'manual' | 'holiday' | 'vacation' | 'maintenance';

export interface BlockedPeriod {
  id: string;
  user_id: string;
  block_type: BlockType;
  start_time: string;
  end_time: string;
  title: string;
  description: string | null;
  is_recurring: boolean;
  recurrence_pattern: any | null; // eslint-disable-line @typescript-eslint/no-explicit-any
  created_at: string;
  updated_at: string;
}

export interface AvailabilityTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  working_hours: WorkingHours;
  break_times: BreakTime[];
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface ServiceWithProvider extends Service {
  provider: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'username'>;
}

export interface BookingWithDetails extends Booking {
  service: Service;
  provider: Pick<User, 'id' | 'name' | 'email' | 'phone' | 'username'>;
}

// Form types
export interface ServiceFormData {
  title: string;
  description?: string;
  price: number; // In dollars for form input
  duration: number;
  buffer_minutes: number;
  service_areas: string[];
}

export interface BookingFormData {
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_zip: string;
  date_time: string;
  notes?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Scheduling types
export interface TimeSlot {
  start: string; // ISO timestamp
  end: string; // ISO timestamp
  available: boolean;
}

export interface AvailabilityConfig {
  start_hour: number; // 0-23
  end_hour: number; // 0-23
  days_ahead: number; // How many days to show
}

