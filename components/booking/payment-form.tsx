'use client';

// Payment form component (placeholder for now)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BookingWithDetails, Service, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/stripe';
import { formatDateTime } from '@/lib/scheduling';

interface PaymentFormProps {
  booking: BookingWithDetails;
  service: Service;
  provider: User;
  managementUrl?: string;
}

export function PaymentForm({ booking, service, provider, managementUrl }: PaymentFormProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // TODO: Implement Stripe payment
    alert('Payment integration coming soon! For now, this booking is created and pending payment.');
    
    setIsProcessing(false);
    
    // For now, just redirect back to the booking page
    router.push(`/${provider.username}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Booking Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium">{service.title}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date & Time</span>
            <span className="font-medium">{formatDateTime(booking.date_time)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-medium">{booking.customer_name}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Address</span>
            <span className="font-medium text-right max-w-xs">{booking.customer_address}</span>
          </div>
          
          {booking.notes && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Notes</span>
              <span className="font-medium text-right max-w-xs">{booking.notes}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Payment Options */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Payment</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount</span>
            <span>{formatAmount(service.price)}</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>🔒 Secure payment processing by Stripe</p>
            <p>💳 We accept all major credit cards, Apple Pay, and Google Pay</p>
          </div>
        </div>
      </Card>

      {/* Payment Form Placeholder */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
        
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
          <p className="text-yellow-800 text-sm">
            <strong>🚧 Payment integration in progress</strong><br />
            Stripe payment processing will be implemented in the next phase.
            For now, your booking has been created and is pending payment.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? 'Processing...' : 'Complete Payment ($120.00)'}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            By completing payment, you agree to our terms of service.
          </p>

          {managementUrl && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Manage Your Booking</h3>
              <p className="text-sm text-blue-800 mb-3">
                Save this link to cancel or reschedule your appointment:
              </p>
              <div className="bg-white p-2 rounded border text-xs font-mono text-blue-900 break-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}{managementUrl}
              </div>
              <p className="text-xs text-blue-700 mt-2">
                💡 This link will be sent to your email after payment confirmation
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
