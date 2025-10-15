'use client';

// Service card component

import { useState } from 'react';
import type { Service } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatAmount } from '@/lib/stripe';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface ServiceCardProps {
  service: Service;
  onDelete: (serviceId: string) => void;
  onToggleActive: (serviceId: string, active: boolean) => void;
}

export function ServiceCard({ service, onDelete, onToggleActive }: ServiceCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(service.id);
      } else {
        alert('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !service.active }),
      });

      if (response.ok) {
        onToggleActive(service.id, !service.active);
      } else {
        alert('Failed to update service');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Failed to update service');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <Badge variant={service.active ? 'default' : 'secondary'}>
          {service.active ? 'Active' : 'Inactive'}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isLoading}>
              ⋮
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleToggleActive}>
              {service.active ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
      
      {service.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {service.description}
        </p>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Price</span>
          <span className="font-semibold">{formatAmount(service.price)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Duration</span>
          <span>{service.duration} minutes</span>
        </div>
        {service.buffer_minutes > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Buffer</span>
            <span>{service.buffer_minutes} minutes</span>
          </div>
        )}
        {service.service_areas.length > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service Areas</span>
            <span>{service.service_areas.length} ZIP codes</span>
          </div>
        )}
      </div>
    </Card>
  );
}


