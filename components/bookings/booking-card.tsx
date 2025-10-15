'use client';

// Booking card component

import { useState } from 'react';
import type { BookingWithDetails } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatAmount } from '@/lib/stripe';
import { formatDateTime } from '@/lib/scheduling';

interface BookingCardProps {
  booking: BookingWithDetails;
  onStatusUpdate: (bookingId: string, status: string) => void;
}

export function BookingCard({ booking, onStatusUpdate }: BookingCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkComplete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (response.ok) {
        onStatusUpdate(booking.id, 'completed');
      } else {
        alert('Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        onStatusUpdate(booking.id, 'cancelled');
      } else {
        alert('Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'deposit':
        return 'secondary';
      case 'unpaid':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
          <Badge variant={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
          <Badge variant={getPaymentStatusColor(booking.payment_status)}>
            {booking.payment_status}
          </Badge>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">{booking.service.title}</h3>
      <div className="text-sm text-muted-foreground mb-4">
        {formatDateTime(booking.date_time)}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Customer</span>
          <span className="font-medium">{booking.customer_name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Email</span>
          <span>{booking.customer_email}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Phone</span>
          <span>{booking.customer_phone}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Address</span>
          <span>{booking.customer_address}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Price</span>
          <span className="font-semibold">{formatAmount(booking.service.price)}</span>
        </div>
      </div>

      {booking.notes && (
        <div className="mb-4 p-3 bg-muted rounded text-sm">
          <span className="font-medium">Notes:</span> {booking.notes}
        </div>
      )}

      {booking.status === 'confirmed' && new Date(booking.date_time) > new Date() && (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleMarkComplete} disabled={isLoading}>
            Mark Complete
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      )}
    </Card>
  );
}


