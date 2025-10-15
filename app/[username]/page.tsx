// Public booking page for a provider

import { notFound } from 'next/navigation';
import { getUserByUsername, getActiveServices } from '@/lib/database';
import { ServiceCardPublic } from '@/components/booking/service-card-public';

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function PublicBookingPage({ params }: PageProps) {
  const { username } = await params;
  
  const provider = await getUserByUsername(username);

  if (!provider) {
    notFound();
  }

  const services = await getActiveServices(provider.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">{provider.name}</h1>
          <p className="text-muted-foreground mt-1">
            Book services directly with {provider.name}
          </p>
          {provider.phone && (
            <p className="text-sm text-muted-foreground mt-2">
              📞 {provider.phone}
            </p>
          )}
        </div>
      </header>

      {/* Services */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-6">Available Services</h2>
        
        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No services available at this time
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <ServiceCardPublic
                key={service.id}
                service={service}
                providerUsername={username}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Powered by Binda</p>
        </div>
      </footer>
    </div>
  );
}

