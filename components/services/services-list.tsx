'use client';

// Services list component with client-side interactions

import { useState } from 'react';
import type { Service } from '@/lib/types';
import { ServiceCard } from './service-card';

interface ServicesListProps {
  initialServices: Service[];
}

export function ServicesList({ initialServices }: ServicesListProps) {
  const [services, setServices] = useState<Service[]>(initialServices);

  const handleDelete = (serviceId: string) => {
    setServices(services.filter(s => s.id !== serviceId));
  };

  const handleToggleActive = (serviceId: string, active: boolean) => {
    setServices(services.map(s => 
      s.id === serviceId ? { ...s, active } : s
    ));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
        />
      ))}
    </div>
  );
}


