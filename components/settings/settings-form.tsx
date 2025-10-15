'use client';

// Settings form component

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { sanitizeUsername } from '@/lib/validation';

interface SettingsFormProps {
  profile: User;
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
    username: profile.username || '',
    timezone: profile.timezone || 'America/New_York',
  });

  const handleUsernameChange = (value: string) => {
    // Auto-sanitize as user types
    const sanitized = sanitizeUsername(value);
    setFormData({ ...formData, username: sanitized });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to update profile');
        setIsLoading(false);
        return;
      }

      setSuccess('Profile updated successfully!');
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const bookingUrl = formData.username 
    ? `${window.location.origin}/${formData.username}`
    : 'Set a username to get your booking link';

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={profile.email}
            disabled
            className="bg-muted"
          />
          <p className="text-sm text-muted-foreground">
            Email cannot be changed. Contact support if needed.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
          <p className="text-sm text-muted-foreground">
            Customers will use this to contact you
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username *</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">binda.app/</span>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="john-doe"
              required
              pattern="[a-zA-Z0-9][a-zA-Z0-9_-]{2,29}"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            3-30 characters. Letters, numbers, hyphens, and underscores only.
          </p>
        </div>

        {formData.username && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <Label className="text-sm font-medium">Your Booking Link</Label>
            <div className="mt-2">
              <code className="text-sm bg-white px-3 py-2 rounded border block">
                {bookingUrl}
              </code>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Share this link with customers to accept bookings
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <select
            aria-label="Timezone"
            id="timezone"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="America/Phoenix">Arizona Time (MST)</option>
            <option value="America/Anchorage">Alaska Time (AKT)</option>
            <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
          </select>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Card>
  );
}


