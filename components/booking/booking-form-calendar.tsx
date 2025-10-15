'use client';

// Enhanced booking form with calendar interface

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Service, User, TimeSlot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { formatAmount } from '@/lib/stripe';
import { formatDate, formatTime } from '@/lib/scheduling';
import { validateBookingData } from '@/lib/validation';
import { addDays, isSameDay, isToday, isPast } from 'date-fns';

interface BookingFormCalendarProps {
  service: Service;
  provider: User;
  providerUsername: string;
}

export function BookingFormCalendar({ service, provider, providerUsername }: BookingFormCalendarProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'details' | 'datetime' | 'confirm'>('details');

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    customer_zip: '',
    date_time: '',
    notes: '',
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);

  // Load available dates when component mounts
  useEffect(() => {
    loadAvailableDates();
  }, []);

  // Load time slots when a date is selected
  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadAvailableDates = async () => {
    try {
      // Load available dates and blocked periods in parallel
      const [datesResponse, blockedResponse] = await Promise.all([
        fetch(`/api/availability/slots?providerId=${provider.id}&serviceId=${service.id}&mode=dates&daysAhead=60`),
        fetch(`/api/availability/blocked-periods?startDate=${new Date().toISOString()}&endDate=${addDays(new Date(), 60).toISOString()}`)
      ]);
      
      if (datesResponse.ok) {
        const data = await datesResponse.json();
        const dates = data.data?.map((dateStr: string) => new Date(dateStr)) || [];
        setAvailableDates(dates);
      }

      if (blockedResponse.ok) {
        const blockedData = await blockedResponse.json();
        const blocked = blockedData.data?.map((block: any) => ({
          start: new Date(block.start_time),
          end: new Date(block.end_time),
          title: block.title,
          block_type: block.block_type
        })) || [];
        
        // Convert blocked periods to dates
        const blockedDateSet = new Set<string>();
        blocked.forEach((block: any) => {
          const startDate = new Date(block.start);
          const endDate = new Date(block.end);
          
          // Add all dates in the blocked period
          let currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            blockedDateSet.add(currentDate.toISOString().split('T')[0]);
            currentDate = addDays(currentDate, 1);
          }
        });
        
        const blockedDatesList = Array.from(blockedDateSet).map(dateStr => new Date(dateStr));
        setBlockedDates(blockedDatesList);
      }
    } catch (error) {
      console.error('Error loading available dates:', error);
    }
  };

  const loadTimeSlots = async (date: Date) => {
    setLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/availability/slots?providerId=${provider.id}&serviceId=${service.id}&date=${date.toISOString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.data || []);
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate only the fields we have so far (without date_time)
    const errors = validateBookingData({
      customer_name: formData.customer_name,
      customer_email: formData.customer_email,
      customer_phone: formData.customer_phone,
      customer_address: formData.customer_address,
      customer_zip: formData.customer_zip,
      date_time: '', // Will be validated later when user selects date/time
    });

    // Filter out date_time validation errors for now
    const relevantErrors = errors.filter(error => error.field !== 'date_time');

    if (relevantErrors.length > 0) {
      setError(relevantErrors.map(e => e.message).join(', '));
      return;
    }

    // Check ZIP code if service has restrictions
    if (service.service_areas.length > 0 && !service.service_areas.includes(formData.customer_zip)) {
      setError(`Service not available in ZIP code ${formData.customer_zip}`);
      return;
    }

    setStep('datetime');
  };

  const handleDateTimeSelect = (dateTime: string) => {
    setFormData({ ...formData, date_time: dateTime });
    setStep('confirm');
  };

  const handleBookingSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: service.id,
          provider_id: provider.id,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone,
          customer_address: formData.customer_address,
          customer_zip: formData.customer_zip,
          date_time: formData.date_time,
          notes: formData.notes,
          total_amount: service.price,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const bookingId = result.data.id;
        
        // Redirect to payment page
        router.push(`/${providerUsername}/book/${service.id}/payment?bookingId=${bookingId}`);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar modifiers for available dates and blocked dates
  const calendarModifiers = {
    available: availableDates,
    blocked: blockedDates,
    today: [new Date()],
  };

  const calendarModifiersClassNames = {
    available: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200',
    blocked: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200 line-through',
    today: 'bg-blue-50 text-blue-700 font-semibold',
  };

  // Disable dates that are not available or in the past
  const disabledDates = (date: Date) => {
    // Disable past dates (except today)
    if (isPast(date) && !isToday(date)) {
      return true;
    }
    
    // Disable dates that are not available (not in availableDates)
    const isAvailable = availableDates.some(availableDate => isSameDay(availableDate, date));
    return !isAvailable;
  };

  if (step === 'details') {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleDetailsSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_name">Full Name *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="customer_email">Email *</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_phone">Phone *</Label>
              <Input
                id="customer_phone"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="customer_zip">ZIP Code *</Label>
              <Input
                id="customer_zip"
                value={formData.customer_zip}
                onChange={(e) => setFormData({ ...formData, customer_zip: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="customer_address">Address *</Label>
            <Input
              id="customer_address"
              value={formData.customer_address}
              onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Continue to Calendar</Button>
          </div>
        </form>
      </Card>
    );
  }

  if (step === 'datetime') {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Select Date & Time</h2>
            <Button variant="outline" size="sm" onClick={() => setStep('details')}>
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <div>
              <Label className="mb-3 block">Choose a Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={disabledDates}
                modifiers={calendarModifiers}
                modifiersClassNames={calendarModifiersClassNames}
                className="rounded-md border"
                classNames={{
                  day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary [&:has([aria-selected])]:text-primary-foreground focus-within:relative focus-within:z-20",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_disabled: "text-muted-foreground opacity-50",
                }}
              />
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <p><span className="inline-block w-3 h-3 bg-green-50 border border-green-200 rounded mr-2"></span> Available dates</p>
                <p><span className="inline-block w-3 h-3 bg-red-50 border border-red-200 rounded mr-2"></span> Blocked dates</p>
                <p><span className="inline-block w-3 h-3 bg-blue-50 border border-blue-200 rounded mr-2"></span> Today</p>
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <Label className="mb-3 block">Available Times</Label>
              {!selectedDate ? (
                <div className="text-center py-8 text-muted-foreground">
                  Please select a date from the calendar
                </div>
              ) : loadingSlots ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading available times...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No available times for this date
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {availableSlots
                    .filter(slot => slot.available)
                    .map((slot) => (
                      <Button
                        key={slot.start}
                        variant="outline"
                        size="sm"
                        onClick={() => handleDateTimeSelect(slot.start)}
                        className="h-auto p-3 flex flex-col items-center"
                      >
                        <span className="font-medium">{formatTime(slot.start)}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(slot.end)}
                        </span>
                      </Button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'confirm') {
    const selectedSlot = availableSlots.find(slot => slot.start === formData.date_time);
    const startTime = selectedSlot ? new Date(selectedSlot.start) : new Date(formData.date_time);
    const endTime = selectedSlot ? new Date(selectedSlot.end) : new Date(formData.date_time);

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Confirm Booking</h2>
            <Button variant="outline" size="sm" onClick={() => setStep('datetime')}>
              Back
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Service Details</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Service:</strong> {service.title}</div>
                  <div><strong>Duration:</strong> {service.duration} minutes</div>
                  <div><strong>Date:</strong> {formatDate(startTime)}</div>
                  <div><strong>Time:</strong> {formatTime(startTime)} - {formatTime(endTime)}</div>
                  <div><strong>Price:</strong> {formatAmount(service.price)}</div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {formData.customer_name}</div>
                  <div><strong>Email:</strong> {formData.customer_email}</div>
                  <div><strong>Phone:</strong> {formData.customer_phone}</div>
                  <div><strong>Address:</strong> {formData.customer_address}</div>
                  <div><strong>ZIP:</strong> {formData.customer_zip}</div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Special Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special instructions or requests..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => setStep('datetime')}>
                Change Time
              </Button>
              <Button onClick={handleBookingSubmit} disabled={isLoading}>
                {isLoading ? 'Creating Booking...' : 'Confirm & Pay'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
