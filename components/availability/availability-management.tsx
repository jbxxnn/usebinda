'use client';

// Availability management component

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AvailabilitySettings, WorkingHours, BreakTime } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { WorkingHoursEditor } from './working-hours-editor';
import { BreakTimesEditor } from './break-times-editor';
import { BlockedPeriodsManager } from './blocked-periods-manager';
import { AvailabilitySettingsPanel } from './availability-settings-panel';

interface AvailabilityManagementProps {
  initialSettings: AvailabilitySettings;
}

export function AvailabilityManagement({ initialSettings }: AvailabilityManagementProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [settings, setSettings] = useState<AvailabilitySettings>(initialSettings);
  const [workingHours, setWorkingHours] = useState<WorkingHours>(settings.working_hours);
  const [breakTimes, setBreakTimes] = useState<BreakTime[]>(settings.break_times);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timezone: settings.timezone,
          working_hours: workingHours,
          break_times: breakTimes,
          default_buffer_minutes: settings.default_buffer_minutes,
          max_bookings_per_slot: settings.max_bookings_per_slot,
          min_advance_booking_hours: settings.min_advance_booking_hours,
          max_advance_booking_days: settings.max_advance_booking_days,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to save availability settings');
        setIsLoading(false);
        return;
      }

      setSuccess('Availability settings saved successfully!');
      setSettings(result.data);
      router.refresh();
    } catch (error) {
      console.error('Error saving availability settings:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsChange = (updates: Partial<AvailabilitySettings>) => {
    setSettings({ ...settings, ...updates });
  };

  return (
    <div className="space-y-6">
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

      {/* Working Hours */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Working Hours</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Set your available hours for each day of the week
        </p>
        <WorkingHoursEditor 
          workingHours={workingHours} 
          onChange={setWorkingHours} 
        />
      </Card>

      {/* Break Times */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Break Times</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Add break periods when you're not available (lunch, coffee breaks, etc.)
        </p>
        <BreakTimesEditor 
          breakTimes={breakTimes} 
          onChange={setBreakTimes} 
        />
      </Card>

      {/* Blocked Periods */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Blocked Periods</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Block specific dates and times (holidays, vacations, maintenance)
        </p>
        <BlockedPeriodsManager />
      </Card>

      {/* Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Booking Settings</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure how customers can book appointments
        </p>
        <AvailabilitySettingsPanel 
          settings={settings} 
          onChange={handleSettingsChange} 
        />
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isLoading}
          size="lg"
        >
          {isLoading ? 'Saving...' : 'Save Availability Settings'}
        </Button>
      </div>
    </div>
  );
}
