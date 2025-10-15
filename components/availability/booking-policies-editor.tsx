'use client';

// Booking policies editor component for providers

import { useState, useEffect } from 'react';
import type { AvailabilitySettings, CancellationPolicy, ReschedulingPolicy, NotificationPreferences } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export function BookingPoliciesEditor() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [policies, setPolicies] = useState({
    cancellation_policy: {
      free_cancellation_hours: 24,
      partial_refund_hours: 2,
      no_refund_hours: 0,
      partial_refund_percentage: 50,
      allow_provider_cancellation: true,
    } as CancellationPolicy,
    rescheduling_policy: {
      free_rescheduling_hours: 24,
      rescheduling_fee_hours: 2,
      rescheduling_fee_amount: 0,
      max_reschedules_per_booking: 3,
      allow_provider_rescheduling: true,
    } as ReschedulingPolicy,
    notification_preferences: {
      send_sms_cancellations: true,
      send_email_cancellations: true,
      send_sms_reschedules: true,
      send_email_reschedules: true,
      notify_provider_on_cancellation: true,
      notify_provider_on_reschedule: true,
    } as NotificationPreferences,
  });

  // Load current policies
  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const response = await fetch('/api/availability');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const settings = data.data as AvailabilitySettings;
          setPolicies({
            cancellation_policy: settings.cancellation_policy || policies.cancellation_policy,
            rescheduling_policy: settings.rescheduling_policy || policies.rescheduling_policy,
            notification_preferences: settings.notification_preferences || policies.notification_preferences,
          });
        }
      }
    } catch (error) {
      console.error('Error loading policies:', error);
      setError('Failed to load policies');
    } finally {
      setIsLoading(false);
    }
  };

  const savePolicies = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancellation_policy: policies.cancellation_policy,
          rescheduling_policy: policies.rescheduling_policy,
          notification_preferences: policies.notification_preferences,
        }),
      });

      if (response.ok) {
        setSuccess('Booking policies updated successfully!');
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to update policies');
      }
    } catch (error) {
      console.error('Error saving policies:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const updateCancellationPolicy = (field: keyof CancellationPolicy, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setPolicies(prev => ({
      ...prev,
      cancellation_policy: {
        ...prev.cancellation_policy,
        [field]: value,
      },
    }));
  };

  const updateReschedulingPolicy = (field: keyof ReschedulingPolicy, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    setPolicies(prev => ({
      ...prev,
      rescheduling_policy: {
        ...prev.rescheduling_policy,
        [field]: value,
      },
    }));
  };

  const updateNotificationPreferences = (field: keyof NotificationPreferences, value: boolean) => {
    setPolicies(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [field]: value,
      },
    }));
  };

  if (isLoading) {
    return <div>Loading booking policies...</div>;
  }

  return (
    <div className="space-y-6">
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

      {/* Cancellation Policy */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Cancellation Policy</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="free-cancellation-hours">Free Cancellation (hours before)</Label>
            <Input
              id="free-cancellation-hours"
              type="number"
              min="0"
              max="168"
              value={policies.cancellation_policy.free_cancellation_hours}
              onChange={(e) => updateCancellationPolicy('free_cancellation_hours', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Full refund if cancelled this many hours before appointment</p>
          </div>

          <div>
            <Label htmlFor="partial-refund-hours">Partial Refund (hours before)</Label>
            <Input
              id="partial-refund-hours"
              type="number"
              min="0"
              max="168"
              value={policies.cancellation_policy.partial_refund_hours}
              onChange={(e) => updateCancellationPolicy('partial_refund_hours', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Partial refund if cancelled between this and free cancellation time</p>
          </div>

          <div>
            <Label htmlFor="partial-refund-percentage">Partial Refund Percentage</Label>
            <Input
              id="partial-refund-percentage"
              type="number"
              min="0"
              max="100"
              value={policies.cancellation_policy.partial_refund_percentage}
              onChange={(e) => updateCancellationPolicy('partial_refund_percentage', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Percentage of total amount to refund (0-100%)</p>
          </div>

          <div>
            <Label htmlFor="no-refund-hours">No Refund (hours before)</Label>
            <Input
              id="no-refund-hours"
              type="number"
              min="0"
              max="168"
              value={policies.cancellation_policy.no_refund_hours}
              onChange={(e) => updateCancellationPolicy('no_refund_hours', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">No refund if cancelled within this many hours</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={policies.cancellation_policy.allow_provider_cancellation}
              onChange={(e) => updateCancellationPolicy('allow_provider_cancellation', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Allow providers to cancel customer bookings</span>
          </label>
        </div>
      </Card>

      {/* Rescheduling Policy */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🔄 Rescheduling Policy</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="free-rescheduling-hours">Free Rescheduling (hours before)</Label>
            <Input
              id="free-rescheduling-hours"
              type="number"
              min="0"
              max="168"
              value={policies.rescheduling_policy.free_rescheduling_hours}
              onChange={(e) => updateReschedulingPolicy('free_rescheduling_hours', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">No fee for rescheduling this many hours before appointment</p>
          </div>

          <div>
            <Label htmlFor="rescheduling-fee-hours">Rescheduling Fee (hours before)</Label>
            <Input
              id="rescheduling-fee-hours"
              type="number"
              min="0"
              max="168"
              value={policies.rescheduling_policy.rescheduling_fee_hours}
              onChange={(e) => updateReschedulingPolicy('rescheduling_fee_hours', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Fee applies if rescheduled within this many hours</p>
          </div>

          <div>
            <Label htmlFor="rescheduling-fee-amount">Rescheduling Fee Amount ($)</Label>
            <Input
              id="rescheduling-fee-amount"
              type="number"
              min="0"
              step="0.01"
              value={policies.rescheduling_policy.rescheduling_fee_amount}
              onChange={(e) => updateReschedulingPolicy('rescheduling_fee_amount', parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Fee amount for late rescheduling</p>
          </div>

          <div>
            <Label htmlFor="max-reschedules">Max Reschedules Per Booking</Label>
            <Input
              id="max-reschedules"
              type="number"
              min="1"
              max="10"
              value={policies.rescheduling_policy.max_reschedules_per_booking}
              onChange={(e) => updateReschedulingPolicy('max_reschedules_per_booking', parseInt(e.target.value) || 1)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Maximum number of times a booking can be rescheduled</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={policies.rescheduling_policy.allow_provider_rescheduling}
              onChange={(e) => updateReschedulingPolicy('allow_provider_rescheduling', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Allow providers to reschedule customer bookings</span>
          </label>
        </div>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🔔 Notification Preferences</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Cancellation Notifications</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={policies.notification_preferences.send_sms_cancellations}
                  onChange={(e) => updateNotificationPreferences('send_sms_cancellations', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Send SMS notifications for cancellations</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={policies.notification_preferences.send_email_cancellations}
                  onChange={(e) => updateNotificationPreferences('send_email_cancellations', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Send email notifications for cancellations</span>
              </label>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Rescheduling Notifications</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={policies.notification_preferences.send_sms_reschedules}
                  onChange={(e) => updateNotificationPreferences('send_sms_reschedules', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Send SMS notifications for reschedules</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={policies.notification_preferences.send_email_reschedules}
                  onChange={(e) => updateNotificationPreferences('send_email_reschedules', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Send email notifications for reschedules</span>
              </label>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Provider Notifications</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={policies.notification_preferences.notify_provider_on_cancellation}
                  onChange={(e) => updateNotificationPreferences('notify_provider_on_cancellation', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Notify provider when customers cancel</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={policies.notification_preferences.notify_provider_on_reschedule}
                  onChange={(e) => updateNotificationPreferences('notify_provider_on_reschedule', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Notify provider when customers reschedule</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Button 
        onClick={savePolicies}
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? 'Saving...' : 'Save Booking Policies'}
      </Button>

      {/* Help Text */}
      <div className="text-sm text-muted-foreground">
        <p><strong>Policy Examples:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Free cancellation: 24 hours = Full refund if cancelled 24+ hours before</li>
          <li>Partial refund: 2 hours = 50% refund if cancelled 2-24 hours before</li>
          <li>No refund: 0 hours = No refund if cancelled within 2 hours</li>
          <li>Free rescheduling: 24 hours = No fee if rescheduled 24+ hours before</li>
        </ul>
      </div>
    </div>
  );
}
