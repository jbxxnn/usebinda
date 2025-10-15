// Twilio SMS integration for Binda

import twilio from 'twilio';
import type { MessageType } from './types';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const twilioClient =
  accountSid && authToken ? twilio(accountSid, authToken) : null;

// Check if Twilio is configured
export const isTwilioConfigured = (): boolean => {
  return !!twilioClient && !!twilioPhoneNumber;
};

/**
 * Send an SMS message
 * @param to - Recipient phone number (E.164 format)
 * @param body - Message content
 */
export async function sendSMS(to: string, body: string): Promise<boolean> {
  if (!twilioClient || !twilioPhoneNumber) {
    console.warn('Twilio is not configured. SMS not sent.');
    console.log(`Would send SMS to ${to}: ${body}`);
    return false;
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      from: twilioPhoneNumber,
      to,
    });

    console.log(`SMS sent successfully. SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

/**
 * Format phone number to E.164 format
 * Assumes US numbers if no country code
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If it starts with 1 and has 11 digits, it's already in the right format
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // If it's 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Otherwise, assume it needs a + prefix
  return `+${digits}`;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Basic E.164 validation: starts with +, followed by 1-15 digits
  return /^\+[1-9]\d{1,14}$/.test(formatted);
}

/**
 * Check if current time is within quiet hours (9am-8pm local time)
 * @param timezone - Timezone string (e.g., 'America/New_York')
 */
export function isWithinQuietHours(timezone: string = 'America/New_York'): boolean {
  const now = new Date();
  const localTime = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  }).format(now);

  const hour = parseInt(localTime, 10);
  return hour >= 9 && hour < 20; // 9am to 8pm
}

// SMS Templates

interface BookingDetails {
  customer_name: string;
  service_title: string;
  date: string;
  time: string;
  address: string;
  provider_name: string;
  booking_link?: string;
}

/**
 * Generate booking confirmation SMS
 */
export function getConfirmationMessage(details: BookingDetails): string {
  return `Hi ${details.customer_name}! Your ${details.service_title} with ${details.provider_name} is confirmed for ${details.date} at ${details.time}. Address: ${details.address}. Reply STOP to opt out.`;
}

/**
 * Generate 24-hour reminder SMS
 */
export function get24HourReminderMessage(details: BookingDetails): string {
  return `Reminder: Your ${details.service_title} with ${details.provider_name} is tomorrow at ${details.time}. See you soon! Reply STOP to opt out.`;
}

/**
 * Generate 2-hour reminder SMS
 */
export function get2HourReminderMessage(details: BookingDetails): string {
  return `Your ${details.service_title} appointment is in 2 hours (${details.time}). ${details.provider_name} will see you soon!`;
}

/**
 * Generate "on my way" SMS
 */
export function getOnMyWayMessage(details: BookingDetails, eta: string = '15 mins'): string {
  return `${details.provider_name} is on the way to your ${details.service_title} appointment! ETA: ${eta}.`;
}

/**
 * Generate rebook SMS
 */
export function getRebookMessage(details: BookingDetails): string {
  return `Hi ${details.customer_name}! Hope your ${details.service_title} went great! Ready to book again? ${details.booking_link || 'Visit your provider\'s booking page.'}`;
}

/**
 * Get template by message type
 */
export function getMessageTemplate(
  type: MessageType,
  details: BookingDetails,
  eta?: string
): string {
  switch (type) {
    case 'confirmation':
      return getConfirmationMessage(details);
    case 'reminder_24h':
      return get24HourReminderMessage(details);
    case 'reminder_2h':
      return get2HourReminderMessage(details);
    case 'on_my_way':
      return getOnMyWayMessage(details, eta);
    case 'rebook':
      return getRebookMessage(details);
    case 'review':
      return `Thanks for choosing ${details.provider_name}! We'd love your feedback.`;
    default:
      return '';
  }
}


