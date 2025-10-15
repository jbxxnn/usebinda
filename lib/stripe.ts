// Stripe integration for Binda payments

import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY not found in environment variables. Stripe will not work.');
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    })
  : null;

// Check if Stripe is configured
export const isStripeConfigured = (): boolean => {
  return !!stripe && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
};

/**
 * Create a PaymentIntent for a booking
 * @param amount - Amount in cents
 * @param metadata - Metadata to attach to the PaymentIntent
 */
export async function createPaymentIntent(
  amount: number,
  metadata: {
    booking_id: string;
    customer_email: string;
    customer_name: string;
    service_title: string;
  }
): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) {
    console.error('Stripe is not configured');
    return null;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
      receipt_email: metadata.customer_email,
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating PaymentIntent:', error);
    throw error;
  }
}

/**
 * Retrieve a PaymentIntent by ID
 */
export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  if (!stripe) {
    console.error('Stripe is not configured');
    return null;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving PaymentIntent:', error);
    throw error;
  }
}

/**
 * Calculate deposit amount (20% of total)
 */
export function calculateDepositAmount(totalAmount: number): number {
  return Math.round(totalAmount * 0.2);
}

/**
 * Calculate remaining amount after deposit
 */
export function calculateRemainingAmount(totalAmount: number, depositAmount: number): number {
  return totalAmount - depositAmount;
}

/**
 * Format amount from cents to dollar string
 */
export function formatAmount(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100);
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe) {
    console.error('Stripe is not configured');
    return null;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not found');
    return null;
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return null;
  }
}


