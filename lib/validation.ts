// Validation utilities for Binda

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (US format)
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Should be 10 or 11 digits (with or without country code)
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

/**
 * Validate ZIP code (US format)
 */
export function isValidZip(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip);
}

/**
 * Validate price (must be positive)
 */
export function isValidPrice(price: number): boolean {
  return price > 0 && Number.isFinite(price);
}

/**
 * Validate duration (must be positive integer)
 */
export function isValidDuration(duration: number): boolean {
  return duration > 0 && Number.isInteger(duration);
}

/**
 * Validate username format
 * - 3-30 characters
 * - alphanumeric, hyphens, underscores only
 * - no spaces
 * - must start with letter or number
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}$/;
  return usernameRegex.test(username);
}

/**
 * Sanitize username (convert to valid format)
 */
export function sanitizeUsername(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-') // Replace invalid chars with hyphen
    .replace(/^[^a-z0-9]+/, '') // Remove leading invalid chars
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .substring(0, 30); // Limit length
}

/**
 * Validate that a date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d > new Date();
}

/**
 * Validate service form data
 */
export interface ServiceValidationError {
  field: string;
  message: string;
}

export function validateServiceData(data: {
  title: string;
  price: number;
  duration: number;
  buffer_minutes: number;
}): ServiceValidationError[] {
  const errors: ServiceValidationError[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Service title is required' });
  } else if (data.title.length > 100) {
    errors.push({ field: 'title', message: 'Service title must be less than 100 characters' });
  }

  if (!isValidPrice(data.price)) {
    errors.push({ field: 'price', message: 'Price must be a positive number' });
  }

  if (!isValidDuration(data.duration)) {
    errors.push({ field: 'duration', message: 'Duration must be a positive integer' });
  }

  if (data.buffer_minutes < 0 || !Number.isInteger(data.buffer_minutes)) {
    errors.push({ field: 'buffer_minutes', message: 'Buffer time must be a non-negative integer' });
  }

  return errors;
}

/**
 * Validate booking form data
 */
export function validateBookingData(data: {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_zip: string;
  date_time: string;
}): ServiceValidationError[] {
  const errors: ServiceValidationError[] = [];

  if (!data.customer_name || data.customer_name.trim().length === 0) {
    errors.push({ field: 'customer_name', message: 'Name is required' });
  }

  if (!isValidEmail(data.customer_email)) {
    errors.push({ field: 'customer_email', message: 'Valid email is required' });
  }

  if (!isValidPhone(data.customer_phone)) {
    errors.push({ field: 'customer_phone', message: 'Valid phone number is required' });
  }

  if (!data.customer_address || data.customer_address.trim().length === 0) {
    errors.push({ field: 'customer_address', message: 'Address is required' });
  }

  if (!isValidZip(data.customer_zip)) {
    errors.push({ field: 'customer_zip', message: 'Valid ZIP code is required' });
  }

  if (data.date_time && !isFutureDate(data.date_time)) {
    errors.push({ field: 'date_time', message: 'Booking date must be in the future' });
  }

  return errors;
}


