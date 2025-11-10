'use client';

// Calendar integration management component

import { useState, useEffect } from 'react';
import type { CalendarIntegration, CalendarProvider } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function CalendarIntegrationManager() {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const response = await fetch('/api/calendar/integrations');
      if (response.ok) {
        const result = await response.json();
        setIntegrations(result.data || []);
      } else {
        setError('Failed to load calendar integrations');
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
      setError('Failed to load calendar integrations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (provider: CalendarProvider) => {
    setIsConnecting(true);
    try {
      // Get authorization URL
      const authResponse = await fetch(`/api/calendar/auth/${provider}/url`);
      if (!authResponse.ok) {
        throw new Error('Failed to get authorization URL');
      }

      const { data } = await authResponse.json();
      
      // Open OAuth popup
      const popup = window.open(
        data.authUrl,
        'oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for OAuth completion
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          // Reload integrations to see if new one was added
          loadIntegrations();
        }
      }, 1000);
    } catch (error) {
      console.error('Error connecting calendar:', error);
      setError('Failed to connect calendar');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this calendar? This will stop syncing events.')) {
      return;
    }

    try {
      const response = await fetch(`/api/calendar/integrations/${integrationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadIntegrations();
      } else {
        setError('Failed to disconnect calendar');
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      setError('Failed to disconnect calendar');
    }
  };

  const handleSyncToggle = async (integrationId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/calendar/integrations/${integrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_enabled: enabled }),
      });

      if (response.ok) {
        loadIntegrations();
      } else {
        setError('Failed to update sync settings');
      }
    } catch (error) {
      console.error('Error updating sync settings:', error);
      setError('Failed to update sync settings');
    }
  };

  const handleSyncNow = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/calendar/integrations/${integrationId}/sync`, {
        method: 'POST',
      });

      if (response.ok) {
        // Show success message or update UI
        loadIntegrations();
      } else {
        setError('Failed to sync calendar');
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
      setError('Failed to sync calendar');
    }
  };

  const getProviderIcon = (provider: CalendarProvider) => {
    switch (provider) {
      case 'google':
        return '🔵';
      case 'outlook':
        return '🔷';
      case 'apple':
        return '🍎';
      default:
        return '📅';
    }
  };

  const getProviderColor = (provider: CalendarProvider) => {
    switch (provider) {
      case 'google':
        return 'bg-blue-100 text-blue-800';
      case 'outlook':
        return 'bg-purple-100 text-purple-800';
      case 'apple':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div>Loading calendar integrations...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Connect New Calendars */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Connect Calendar</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your external calendars to automatically block time slots when you have existing appointments.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => handleConnect('google')}
            disabled={isConnecting || integrations.some(i => i.provider === 'google')}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">🔵</span>
            <span className="font-medium">Google Calendar</span>
            <span className="text-xs text-muted-foreground">
              {integrations.some(i => i.provider === 'google') ? 'Connected' : 'Connect'}
            </span>
          </Button>

          <Button
            onClick={() => handleConnect('outlook')}
            disabled={isConnecting || integrations.some(i => i.provider === 'outlook')}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <span className="text-2xl">🔷</span>
            <span className="font-medium">Outlook Calendar</span>
            <span className="text-xs text-muted-foreground">
              {integrations.some(i => i.provider === 'outlook') ? 'Connected' : 'Connect'}
            </span>
          </Button>
        </div>
      </Card>

      {/* Connected Calendars */}
      {integrations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Connected Calendars</h3>
          
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getProviderIcon(integration.provider)}</span>
                  <div>
                    <div className="font-medium">{integration.calendar_name}</div>
                    <Badge className={getProviderColor(integration.provider)}>
                      {integration.provider}
                    </Badge>
                    {integration.last_sync_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Last synced: {new Date(integration.last_sync_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`sync-${integration.id}`}
                      checked={integration.sync_enabled}
                      onCheckedChange={(enabled) => handleSyncToggle(integration.id, enabled)}
                    />
                    <Label htmlFor={`sync-${integration.id}`} className="text-sm">
                      Sync
                    </Label>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncNow(integration.id)}
                    disabled={!integration.sync_enabled}
                  >
                    Sync Now
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDisconnect(integration.id)}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Help Text */}
      <div className="text-sm text-muted-foreground">
        <p>
          <strong>How it works:</strong>
        </p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Connect your Google Calendar or Outlook to automatically block time slots</li>
          <li>When you have existing appointments, those times won&apos;t be available for booking</li>
          <li>Calendar sync happens automatically every 15 minutes</li>
          <li>You can manually sync or disable sync for any connected calendar</li>
          <li>New bookings will be automatically added to your connected calendars</li>
        </ul>
      </div>
    </div>
  );
}

