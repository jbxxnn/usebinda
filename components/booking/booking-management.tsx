'use client';

// Guest booking management component

import { useState } from 'react';
import type { Booking, CancellationPolicy, ReschedulingPolicy, NotificationPreferences, Service, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatAmount } from '@/lib/stripe';
import { formatDate, formatTime } from '@/lib/scheduling';

interface BookingManagementProps {
  booking: Booking & {
    services: Service;
    users: Pick<User, 'id' | 'name' | 'username' | 'email' | 'phone'>;
  };
  policies: {
    cancellation_policy: CancellationPolicy;
    rescheduling_policy: ReschedulingPolicy;
    notification_preferences: NotificationPreferences;
  };
  accessToken: string;
}

export function BookingManagement({ booking, policies, accessToken }: BookingManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const appointmentDate = new Date(booking.date_time);
  const now = new Date();
  const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Calculate cancellation policy
  const getCancellationInfo = () => {
    const { cancellation_policy } = policies;
    
    if (hoursUntilAppointment >= cancellation_policy.free_cancellation_hours) {
      return {
        type: 'free',
        message: `Full refund if cancelled ${cancellation_policy.free_cancellation_hours}+ hours before`,
        refundPercentage: 100,
      };
    } else if (hoursUntilAppointment >= cancellation_policy.partial_refund_hours) {
      return {
        type: 'partial',
        message: `${cancellation_policy.partial_refund_percentage}% refund if cancelled ${cancellation_policy.partial_refund_hours}-${cancellation_policy.free_cancellation_hours} hours before`,
        refundPercentage: cancellation_policy.partial_refund_percentage,
      };
    } else if (hoursUntilAppointment >= cancellation_policy.no_refund_hours) {
      return {
        type: 'no_refund',
        message: `No refund if cancelled within ${cancellation_policy.no_refund_hours} hours`,
        refundPercentage: 0,
      };
    } else {
      return {
        type: 'past',
        message: 'Appointment has already passed',
        refundPercentage: 0,
      };
    }
  };

  // Calculate rescheduling policy
  const getReschedulingInfo = () => {
    const { rescheduling_policy } = policies;
    
    if (hoursUntilAppointment >= rescheduling_policy.free_rescheduling_hours) {
      return {
        type: 'free',
        message: `Free rescheduling ${rescheduling_policy.free_rescheduling_hours}+ hours before`,
        fee: 0,
      };
    } else if (hoursUntilAppointment >= rescheduling_policy.rescheduling_fee_hours) {
      return {
        type: 'fee',
        message: `$${rescheduling_policy.rescheduling_fee_amount} fee for rescheduling ${rescheduling_policy.rescheduling_fee_hours}-${rescheduling_policy.free_rescheduling_hours} hours before`,
        fee: rescheduling_policy.rescheduling_fee_amount,
      };
    } else {
      return {
        type: 'no_reschedule',
        message: `No rescheduling within ${rescheduling_policy.rescheduling_fee_hours} hours`,
        fee: 0,
      };
    }
  };

  const cancellationInfo = getCancellationInfo();
  const reschedulingInfo = getReschedulingInfo();
  const canCancel = booking.status !== 'cancelled' && cancellationInfo.type !== 'past';
  const canReschedule = booking.status !== 'cancelled' && reschedulingInfo.type !== 'no_reschedule' && booking.reschedule_count < policies.rescheduling_policy.max_reschedules_per_booking;

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancellationReason,
          token: accessToken,
          cancelled_by: 'customer',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Booking cancelled successfully!');
        setShowCancelForm(false);
        // Refresh the page to show updated status
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setError(result.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{booking.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">Booking Management</h1>
        <p className="text-muted-foreground">Manage your appointment with {booking.users.name}</p>
      </div>

      {/* Booking Details */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Booking Details</h2>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Service</h3>
            <p className="text-gray-700">{booking.services.title}</p>
            {booking.services.description && (
              <p className="text-sm text-gray-500 mt-1">{booking.services.description}</p>
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Provider</h3>
            <p className="text-gray-700">{booking.users.name}</p>
            <p className="text-sm text-gray-500">{booking.users.email}</p>
            {booking.users.phone && (
              <p className="text-sm text-gray-500">{booking.users.phone}</p>
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Date & Time</h3>
            <p className="text-gray-700">{formatDate(appointmentDate)}</p>
            <p className="text-gray-700">{formatTime(appointmentDate)}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">Duration & Price</h3>
            <p className="text-gray-700">{booking.services.duration} minutes</p>
            <p className="text-gray-700 font-semibold">{formatAmount(booking.services.price)}</p>
          </div>

          {booking.customer_address && (
            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-900 mb-2">Address</h3>
              <p className="text-gray-700">{booking.customer_address}</p>
              <p className="text-gray-700">{booking.customer_zip}</p>
            </div>
          )}

          {booking.notes && (
            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-700">{booking.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Policy Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Cancellation & Rescheduling Policy</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Cancellation Policy</h3>
            <p className="text-sm text-gray-600">{cancellationInfo.message}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-1">Rescheduling Policy</h3>
            <p className="text-sm text-gray-600">{reschedulingInfo.message}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-1">Reschedule Limit</h3>
            <p className="text-sm text-gray-600">
              You can reschedule up to {policies.rescheduling_policy.max_reschedules_per_booking} times. 
              Current reschedules: {booking.reschedule_count}/{policies.rescheduling_policy.max_reschedules_per_booking}
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          
          <div className="flex gap-4">
            {canCancel && (
              <Button
                variant="destructive"
                onClick={() => setShowCancelForm(true)}
                disabled={isLoading}
              >
                Cancel Booking
              </Button>
            )}

            {canReschedule && (
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: Implement rescheduling
                  setError('Rescheduling feature coming soon!');
                }}
                disabled={isLoading}
              >
                Reschedule Booking
              </Button>
            )}
          </div>

          {!canCancel && !canReschedule && (
            <p className="text-sm text-gray-500">
              No actions available at this time.
            </p>
          )}
        </Card>
      )}

      {/* Cancellation Form */}
      {showCancelForm && (
        <Card className="p-6 border-red-200">
          <h2 className="text-xl font-semibold mb-4 text-red-800">Cancel Booking</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for cancellation
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please provide a reason for cancelling..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Cancellation Policy:</strong> {cancellationInfo.message}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isLoading || !cancellationReason.trim()}
              >
                {isLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelForm(false);
                  setCancellationReason('');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {success}
        </div>
      )}
    </div>
  );
}
