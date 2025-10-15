'use client';

// Bookings list component

import { useState } from 'react';
import type { BookingWithDetails, BookingStatus } from '@/lib/types';
import { BookingCard } from './booking-card';

interface BookingsListProps {
  bookings: BookingWithDetails[];
}

export function BookingsList({ bookings }: BookingsListProps) {
  const [bookingsList, setBookingsList] = useState<BookingWithDetails[]>(bookings);

  const handleStatusUpdate = (bookingId: string, status: string) => {
    setBookingsList(bookingsList.map(b =>
      b.id === bookingId ? { ...b, status: status as BookingStatus } : b
    ));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {bookingsList.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onStatusUpdate={handleStatusUpdate}
        />
      ))}
    </div>
  );
}

