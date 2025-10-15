'use client';

// Booking form component for customers

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Service, User, TimeSlot } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { formatAmount } from '@/lib/stripe';
import { formatDate, formatTime } from '@/lib/scheduling';
import { validateBookingData } from '@/lib/validation';

interface BookingFormProps {
  service: Service;
  provider: User;
  providerUsername: string;
}

export function BookingForm({ service, provider, providerUsername }: BookingFormProps) {
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

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Load available time slots when a date is selected
  useEffect(() => {
    if (selectedDate) {
      loadTimeSlots(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

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

  const handleFinalSubmit = async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: service.id,
          provider_id: provider.id,
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to create booking');
        setIsLoading(false);
        return;
      }

      // Redirect to payment page
      router.push(`/${providerUsername}/book/${service.id}/payment?bookingId=${result.data.id}`);
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  // Generate next 14 days
  const getAvailableDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Step 1: Customer Details */}
      {step === 'details' && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Your Information</h2>
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Full Name *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_email">Email *</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_phone">Phone Number *</Label>
              <Input
                id="customer_phone"
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_address">Service Address *</Label>
              <Input
                id="customer_address"
                value={formData.customer_address}
                onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                placeholder="123 Main St, City, State"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_zip">ZIP Code *</Label>
              <Input
                id="customer_zip"
                value={formData.customer_zip}
                onChange={(e) => setFormData({ ...formData, customer_zip: e.target.value })}
                placeholder="12345"
                required
                maxLength={10}
              />
              {service.service_areas.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Service available in: {service.service_areas.join(', ')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Special Instructions (Optional)</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special requests or notes..."
                className="w-full min-h-24 px-3 py-2 border border-input rounded-md bg-background"
              />
            </div>

            <Button type="submit" className="w-full">
              Continue to Date & Time
            </Button>
          </form>
        </Card>
      )}

      {/* Step 2: Date & Time Selection */}
      {step === 'datetime' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Select Date & Time</h2>
            <Button variant="outline" size="sm" onClick={() => setStep('details')}>
              Back
            </Button>
          </div>

          <div className="space-y-6">
            {/* Date Selection */}
            <div>
              <Label className="mb-3 block">Select a Date</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {getAvailableDates().map((date) => (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 text-sm border rounded-md transition-colors ${
                      selectedDate?.toDateString() === date.toDateString()
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input hover:bg-accent'
                    }`}
                  >
                    <div className="font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <Label className="mb-3 block">Select a Time</Label>
                {loadingSlots ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading available times...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No available times for this date
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {availableSlots
                      .filter(slot => slot.available)
                      .map((slot) => (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => handleDateTimeSelect(slot.start)}
                          className="p-3 text-sm border border-input rounded-md hover:bg-accent transition-colors"
                        >
                          {formatTime(slot.start)}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Confirm Booking</h2>
            <Button variant="outline" size="sm" onClick={() => setStep('datetime')}>
              Back
            </Button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold">Service</h3>
              <p>{service.title}</p>
              <p className="text-sm text-muted-foreground">{service.duration} minutes</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Date & Time</h3>
              <p>{formatDate(formData.date_time)}</p>
              <p>{formatTime(formData.date_time)}</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Your Information</h3>
              <p>{formData.customer_name}</p>
              <p className="text-sm text-muted-foreground">{formData.customer_email}</p>
              <p className="text-sm text-muted-foreground">{formData.customer_phone}</p>
              <p className="text-sm text-muted-foreground">{formData.customer_address}</p>
            </div>

            {formData.notes && (
              <div className="space-y-3">
                <h3 className="font-semibold">Special Instructions</h3>
                <p className="text-sm">{formData.notes}</p>
              </div>
            )}

            <div className="border-t pt-6">
              <div className="flex justify-between items-center text-lg font-semibold mb-6">
                <span>Total</span>
                <span>{formatAmount(service.price)}</span>
              </div>
              <Button 
                onClick={handleFinalSubmit} 
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Processing...' : 'Proceed to Payment'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

