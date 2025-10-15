// Utility functions for booking access tokens

import { randomBytes } from 'crypto';

/**
 * Generate a secure access token for booking management
 */
export function generateAccessToken(): string {
  // Generate a 32-byte random token and convert to base64url
  const token = randomBytes(32).toString('base64url');
  return token;
}

/**
 * Generate token expiration date (30 days from now)
 */
export function generateTokenExpiration(): Date {
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + 30); // 30 days from now
  return expiration;
}

/**
 * Check if a token is valid (not expired)
 */
export function isTokenValid(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  
  const expiration = new Date(expiresAt);
  const now = new Date();
  
  return expiration > now;
}

/**
 * Generate booking management URL
 */
export function generateBookingManagementUrl(
  baseUrl: string,
  username: string,
  bookingId: string,
  token: string
): string {
  return `${baseUrl}/${username}/booking/${bookingId}?token=${token}`;
}
