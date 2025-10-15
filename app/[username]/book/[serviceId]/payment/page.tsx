// Payment page for booking

import { notFound } from 'next/navigation';
import { getUserByUsername, getServiceById, getBookingById } from '@/lib/database';
import { PaymentForm } from '@/components/booking/payment-form';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    username: string;
    serviceId: string;
  }>;
  searchParams: Promise<{
    bookingId?: string;
  }>;
}

export default async function PaymentPage({ params, searchParams }: PageProps) {
  const { username, serviceId } = await params;
  const { bookingId } = await searchParams;
  
  if (!bookingId) {
    notFound();
  }

  const provider = await getUserByUsername(username);
  if (!provider) {
    notFound();
  }

  const service = await getServiceById(serviceId);
  if (!service || !service.active || service.user_id !== provider.id) {
    notFound();
  }

  const booking = await getBookingById(bookingId);
  if (!booking || booking.service_id !== serviceId) {
    notFound();
  }

  // Generate management URL if booking has access token
  const managementUrl = booking.access_token 
    ? `/${username}/booking/${bookingId}?token=${booking.access_token}`
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href={`/${username}`} className="hover:underline">
              {provider.name}
            </Link>
            <span>/</span>
            <Link href={`/${username}/book/${serviceId}`} className="hover:underline">
              Book Service
            </Link>
            <span>/</span>
            <span>Payment</span>
          </div>
          <h1 className="text-3xl font-bold">Complete Your Payment</h1>
          <p className="text-muted-foreground mt-1">
            Secure payment powered by Stripe
          </p>
        </div>
      </header>

      {/* Payment Form */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <PaymentForm
          booking={booking}
          service={service}
          provider={provider}
          managementUrl={managementUrl}
        />
      </main>
    </div>
  );
}
