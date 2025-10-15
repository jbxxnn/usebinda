// Booking flow page

import { notFound } from 'next/navigation';
import { getUserByUsername, getServiceById } from '@/lib/database';
import { BookingForm } from '@/components/booking/booking-form';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    username: string;
    serviceId: string;
  }>;
}

export default async function BookServicePage({ params }: PageProps) {
  const { username, serviceId } = await params;
  
  const provider = await getUserByUsername(username);
  if (!provider) {
    notFound();
  }

  const service = await getServiceById(serviceId);
  if (!service || !service.active || service.user_id !== provider.id) {
    notFound();
  }

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
            <span>Book Service</span>
          </div>
          <h1 className="text-3xl font-bold">{service.title}</h1>
          {service.description && (
            <p className="text-muted-foreground mt-1">{service.description}</p>
          )}
        </div>
      </header>

      {/* Booking Form */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <BookingForm
          service={service}
          provider={provider}
          providerUsername={username}
        />
      </main>
    </div>
  );
}


