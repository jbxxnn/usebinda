'use client';

// Availability settings panel component

import type { AvailabilitySettings, CalendarConflictAction } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface AvailabilitySettingsPanelProps {
  settings: AvailabilitySettings;
  onChange: (updates: Partial<AvailabilitySettings>) => void;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
];

export function AvailabilitySettingsPanel({ settings, onChange }: AvailabilitySettingsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Timezone */}
      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <select
          aria-label="Timezone"
          id="timezone"
          value={settings.timezone}
          onChange={(e) => onChange({ timezone: e.target.value })}
          className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
        >
          {TIMEZONES.map(tz => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="text-sm text-muted-foreground mt-1">
          All times will be displayed in this timezone
        </p>
      </div>

      {/* Buffer Time */}
      <div>
        <Label htmlFor="buffer-time">Default Buffer Time (minutes)</Label>
        <Input
          id="buffer-time"
          type="number"
          min="0"
          max="120"
          value={settings.default_buffer_minutes}
          onChange={(e) => onChange({ default_buffer_minutes: parseInt(e.target.value) || 0 })}
          className="mt-1"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Extra time between appointments for travel and preparation
        </p>
      </div>

      {/* Booking Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min-advance">Minimum Advance Booking (hours)</Label>
          <Input
            id="min-advance"
            type="number"
            min="0"
            max="168"
            value={settings.min_advance_booking_hours}
            onChange={(e) => onChange({ min_advance_booking_hours: parseInt(e.target.value) || 0 })}
            className="mt-1"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Customers must book at least this many hours in advance
          </p>
        </div>

        <div>
          <Label htmlFor="max-advance">Maximum Advance Booking (days)</Label>
          <Input
            id="max-advance"
            type="number"
            min="1"
            max="365"
            value={settings.max_advance_booking_days}
            onChange={(e) => onChange({ max_advance_booking_days: parseInt(e.target.value) || 30 })}
            className="mt-1"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Customers can book up to this many days in advance
          </p>
        </div>
      </div>

      {/* Capacity */}
      <div>
        <Label htmlFor="capacity">Max Bookings Per Time Slot</Label>
        <Input
          id="capacity"
          type="number"
          min="1"
          max="10"
          value={settings.max_bookings_per_slot}
          onChange={(e) => onChange({ max_bookings_per_slot: parseInt(e.target.value) || 1 })}
          className="mt-1"
        />
        <p className="text-sm text-muted-foreground mt-1">
          How many customers can book the same time slot (useful for group services)
        </p>
      </div>

      {/* Calendar Sync Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Calendar Sync Settings</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="calendar-sync">Enable Calendar Sync</Label>
            <p className="text-sm text-muted-foreground">
              Automatically sync with external calendars to block existing appointments
            </p>
          </div>
          <Switch
            id="calendar-sync"
            checked={settings.calendar_sync_enabled}
            onCheckedChange={(enabled) => onChange({ calendar_sync_enabled: enabled })}
          />
        </div>

        {settings.calendar_sync_enabled && (
          <>
            <div>
              <Label htmlFor="sync-frequency">Sync Frequency (minutes)</Label>
              <Input
                id="sync-frequency"
                type="number"
                min="5"
                max="1440"
                value={settings.calendar_sync_frequency_minutes}
                onChange={(e) => onChange({ calendar_sync_frequency_minutes: parseInt(e.target.value) || 15 })}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                How often to check for calendar changes (minimum 5 minutes)
              </p>
            </div>

            <div>
              <Label htmlFor="conflict-action">Calendar Conflict Action</Label>
              <select
                aria-label="Calendar Conflict Action"
                id="conflict-action"
                value={settings.calendar_conflict_action}
                onChange={(e) => onChange({ calendar_conflict_action: e.target.value as CalendarConflictAction })}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="block">Block conflicting time slots</option>
                <option value="warn">Show warning but allow booking</option>
                <option value="ignore">Ignore calendar conflicts</option>
              </select>
              <p className="text-sm text-muted-foreground mt-1">
                What to do when there&apos;s a calendar conflict
              </p>
            </div>
          </>
        )}
      </div>

      {/* Preview */}
      <Card className="p-4 bg-muted">
        <h4 className="font-medium mb-2">Settings Preview</h4>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Timezone:</span>
            <span>{TIMEZONES.find(tz => tz.value === settings.timezone)?.label}</span>
          </div>
          <div className="flex justify-between">
            <span>Buffer Time:</span>
            <span>{settings.default_buffer_minutes} minutes</span>
          </div>
          <div className="flex justify-between">
            <span>Advance Booking:</span>
            <span>{settings.min_advance_booking_hours}h - {settings.max_advance_booking_days} days</span>
          </div>
          <div className="flex justify-between">
            <span>Capacity per Slot:</span>
            <span>{settings.max_bookings_per_slot} booking{settings.max_bookings_per_slot > 1 ? 's' : ''}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
