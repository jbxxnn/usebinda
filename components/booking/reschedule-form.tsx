'use client';

// Rescheduling form component

import { useState, useEffect } from 'react';
import type { Service, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime } from '@/lib/scheduling';
import { addDays, isSameDay, isToday, isPast } from 'date-fns';

interface RescheduleFormProps {
  booking: {
    id: string;
    date_time: string;
    reschedule_count: number;
    services: Service;
    users: Pick<User, 'id' | 'name' | 'username' | 'email'>;
  };
  policies: {
    rescheduling_policy: {
      max_reschedules_per_booking: number;
      free_rescheduling_hours: number;
      rescheduling_fee_hours: number;
      rescheduling_fee_amount: number;
      allow_provider_rescheduling: boolean;
    };
  };
  accessToken: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RescheduleForm({ booking, policies, accessToken, onSuccess, onCancel }: RescheduleFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{ start: string; end: string; available: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const currentAppointment = new Date(booking.date_time);
  const now = new Date();
  const hoursUntilCurrentAppointment = (currentAppointment.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Load available dates when component mounts
  useEffect(() => {
    loadAvailableDates();
  }, []);

  // Load time slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadAvailableDates = async () => {
    try {
      const response = await fetch(
        `/api/availability/slots?providerId=${booking.users.id}&serviceId=${booking.services.id}&mode=dates&daysAhead=60`
      );

      if (response.ok) {
        const data = await response.json();
        const dates = data.data?.map((dateStr: string) => new Date(dateStr)) || [];
        setAvailableDates(dates);
      }
    } catch (error) {
      console.error('Error loading available dates:', error);
    }
  };

  const loadTimeSlots = async (date: Date) => {
    try {
      const response = await fetch(
        `/api/availability/slots?providerId=${booking.users.id}&serviceId=${booking.services.id}&date=${date.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableTimeSlots(data.data || []);
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      setError('Please select a new date and time');
      return;
    }

    if (!rescheduleReason.trim()) {
      setError('Please provide a reason for rescheduling');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newDateTime = `${selectedDate.toISOString().split('T')[0]}T${selectedTimeSlot}`;

      const response = await fetch(`/api/bookings/${booking.id}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_date_time: newDateTime,
          reason: rescheduleReason,
          token: accessToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to reschedule booking');
      }
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate rescheduling policy info
  const getReschedulingInfo = () => {
    const { rescheduling_policy } = policies;
    
    if (hoursUntilCurrentAppointment >= rescheduling_policy.free_rescheduling_hours) {
      return {
        type: 'free',
        message: `Free rescheduling ${rescheduling_policy.free_rescheduling_hours}+ hours before`,
        fee: 0,
      };
    } else if (hoursUntilCurrentAppointment >= rescheduling_policy.rescheduling_fee_hours) {
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

  const reschedulingInfo = getReschedulingInfo();
  const remainingReschedules = policies.rescheduling_policy.max_reschedules_per_booking - booking.reschedule_count;

  return (
    <Card className="p-6 border-blue-200">
      <h2 className="text-xl font-semibold mb-4 text-blue-800">Reschedule Booking</h2>
      
      {/* Current Booking Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Current Appointment</h3>
        <p className="text-gray-700">
          <strong>{booking.services.title}</strong> with {booking.users.name}
        </p>
        <p className="text-gray-700">
          {formatDate(currentAppointment)} at {formatTime(currentAppointment)}
        </p>
        <p className="text-sm text-gray-500">
          Rescheduled {booking.reschedule_count} time{booking.reschedule_count !== 1 ? 's' : ''} 
          ({remainingReschedules} remaining)
        </p>
      </div>

      {/* Rescheduling Policy */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-1">Rescheduling Policy</h3>
        <p className="text-sm text-blue-800">{reschedulingInfo.message}</p>
        {reschedulingInfo.fee > 0 && (
          <p className="text-sm text-blue-800 font-medium mt-1">
            Fee: ${reschedulingInfo.fee}
          </p>
        )}
      </div>

      {/* Date Selection */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Select New Date</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={(date) => {
            // Disable past dates (except today)
            if (isPast(date) && !isToday(date)) {
              return true;
            }
            // Disable dates that are not available
            const isAvailable = availableDates.some(availableDate => isSameDay(availableDate, date));
            return !isAvailable;
          }}
          className="rounded-md border"
        />
        <p className="text-xs text-gray-500 mt-2">
          Available dates are shown in green
        </p>
      </div>

      {/* Time Slot Selection */}
      {selectedDate && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Select New Time</h3>
          {availableTimeSlots.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableTimeSlots
                .filter(slot => slot.available)
                .map((slot, index) => (
                  <Button
                    key={index}
                    variant={selectedTimeSlot === slot.start ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeSlot(slot.start)}
                    className="text-xs"
                  >
                    {formatTime(new Date(`2000-01-01T${slot.start}`))}
                  </Button>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No available time slots for this date</p>
          )}
        </div>
      )}

      {/* Reason for Rescheduling */}
      <div className="mb-6">
        <Label htmlFor="reschedule-reason">Reason for rescheduling</Label>
        <textarea
          id="reschedule-reason"
          value={rescheduleReason}
          onChange={(e) => setRescheduleReason(e.target.value)}
          placeholder="Please provide a reason for rescheduling..."
          className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>

      {/* Selected New Appointment Summary */}
      {selectedDate && selectedTimeSlot && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-900 mb-1">New Appointment</h3>
          <p className="text-green-800">
            {formatDate(selectedDate)} at {formatTime(new Date(`2000-01-01T${selectedTimeSlot}`))}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleReschedule}
          disabled={isLoading || !selectedDate || !selectedTimeSlot || !rescheduleReason.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </Card>
  );
}
