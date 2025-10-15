'use client';

// Public service card for booking page

import type { Service } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatAmount } from '@/lib/stripe';
import Link from 'next/link';

interface ServiceCardPublicProps {
  service: Service;
  providerUsername: string;
}

export function ServiceCardPublic({ service, providerUsername }: ServiceCardPublicProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="mb-4">
        <h3 className="text-xl font-semibold">{service.title}</h3>
        {service.description && (
          <p className="text-muted-foreground mt-2">{service.description}</p>
        )}
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Duration</span>
          <span className="font-medium">{service.duration} minutes</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Price</span>
          <span className="text-xl font-bold">{formatAmount(service.price)}</span>
        </div>
        {service.service_areas.length > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Service Areas</span>
            <span>{service.service_areas.join(', ')}</span>
          </div>
        )}
      </div>

      <Link href={`/${providerUsername}/book/${service.id}`}>
        <Button className="w-full">Book Now</Button>
      </Link>
    </Card>
  );
}


