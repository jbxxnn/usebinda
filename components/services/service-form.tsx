'use client';

// Service form component for creating/editing services

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Service } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ServiceFormProps {
  mode: 'create' | 'edit';
  service?: Service;
}

export function ServiceForm({ mode, service }: ServiceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: service?.title || '',
    description: service?.description || '',
    price: service?.price ? (service.price / 100).toString() : '',
    duration: service?.duration?.toString() || '',
    buffer_minutes: service?.buffer_minutes?.toString() || '0',
    service_areas: service?.service_areas?.join(', ') || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate price
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        setError('Please enter a valid price');
        setIsLoading(false);
        return;
      }

      // Validate duration
      const duration = parseInt(formData.duration);
      if (isNaN(duration) || duration <= 0) {
        setError('Please enter a valid duration');
        setIsLoading(false);
        return;
      }

      // Validate buffer
      const buffer_minutes = parseInt(formData.buffer_minutes);
      if (isNaN(buffer_minutes) || buffer_minutes < 0) {
        setError('Please enter a valid buffer time');
        setIsLoading(false);
        return;
      }

      // Parse service areas
      const service_areas = formData.service_areas
        .split(',')
        .map(zip => zip.trim())
        .filter(zip => zip.length > 0);

      const body = {
        title: formData.title,
        description: formData.description || null,
        price,
        duration,
        buffer_minutes,
        service_areas,
      };

      const url = mode === 'create' 
        ? '/api/services' 
        : `/api/services/${service?.id}`;
      
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to save service');
        setIsLoading(false);
        return;
      }

      // Redirect to services list
      router.push('/dashboard/services');
      router.refresh();
    } catch (error) {
      console.error('Error saving service:', error);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Service Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., 2-Hour House Cleaning"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what's included in this service..."
            className="w-full min-h-24 px-3 py-2 border border-input rounded-md bg-background"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price (USD) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="100.00"
                className="pl-7"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="120"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="buffer_minutes">
            Travel/Buffer Time (minutes)
          </Label>
          <Input
            id="buffer_minutes"
            type="number"
            min="0"
            value={formData.buffer_minutes}
            onChange={(e) => setFormData({ ...formData, buffer_minutes: e.target.value })}
            placeholder="30"
          />
          <p className="text-sm text-muted-foreground">
            Extra time between jobs for travel and preparation
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="service_areas">
            Service Areas (ZIP Codes)
          </Label>
          <Input
            id="service_areas"
            value={formData.service_areas}
            onChange={(e) => setFormData({ ...formData, service_areas: e.target.value })}
            placeholder="10001, 10002, 10003"
          />
          <p className="text-sm text-muted-foreground">
            Comma-separated ZIP codes. Leave empty to accept all areas.
          </p>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Service' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}


