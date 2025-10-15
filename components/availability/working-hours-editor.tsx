'use client';

// Working hours editor component

import { useState } from 'react';
import type { WorkingHours } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface WorkingHoursEditorProps {
  workingHours: WorkingHours;
  onChange: (workingHours: WorkingHours) => void;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export function WorkingHoursEditor({ workingHours, onChange }: WorkingHoursEditorProps) {
  const [copyToAll, setCopyToAll] = useState(false);

  const handleDayChange = (day: string, field: 'enabled' | 'start' | 'end', value: boolean | string) => {
    const updatedHours = {
      ...workingHours,
      [day]: {
        ...workingHours[day],
        [field]: value,
      },
    };
    onChange(updatedHours);
  };

  const handleCopyToAll = () => {
    if (copyToAll) {
      const mondayHours = workingHours.monday;
      const updatedHours = { ...workingHours };
      
      DAYS.forEach(day => {
        updatedHours[day.key] = {
          start: mondayHours.start,
          end: mondayHours.end,
          enabled: mondayHours.enabled,
        };
      });
      
      onChange(updatedHours);
    }
  };

  const handleEnableAll = () => {
    const updatedHours = { ...workingHours };
    DAYS.forEach(day => {
      updatedHours[day.key] = {
        ...updatedHours[day.key],
        enabled: true,
      };
    });
    onChange(updatedHours);
  };

  const handleDisableAll = () => {
    const updatedHours = { ...workingHours };
    DAYS.forEach(day => {
      updatedHours[day.key] = {
        ...updatedHours[day.key],
        enabled: false,
      };
    });
    onChange(updatedHours);
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex gap-2 mb-6">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={handleEnableAll}
        >
          Enable All
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={handleDisableAll}
        >
          Disable All
        </Button>
        <div className="flex items-center gap-2">
          <Checkbox 
            id="copy-to-all"
            checked={copyToAll}
            onCheckedChange={(checked) => setCopyToAll(checked as boolean)}
          />
          <Label htmlFor="copy-to-all" className="text-sm">
            Copy Monday to all days
          </Label>
        </div>
      </div>

      {/* Day-by-day settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.map(day => {
          const dayHours = workingHours[day.key];
          
          return (
            <div key={day.key} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">{day.label}</Label>
                <Checkbox 
                  checked={dayHours.enabled}
                  onCheckedChange={(checked) => 
                    handleDayChange(day.key, 'enabled', checked as boolean)
                  }
                />
              </div>
              
              {dayHours.enabled && (
                <div className="space-y-2">
                  <div>
                    <Label htmlFor={`${day.key}-start`} className="text-sm text-muted-foreground">
                      Start Time
                    </Label>
                    <Input
                      id={`${day.key}-start`}
                      type="time"
                      value={dayHours.start}
                      onChange={(e) => handleDayChange(day.key, 'start', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`${day.key}-end`} className="text-sm text-muted-foreground">
                      End Time
                    </Label>
                    <Input
                      id={`${day.key}-end`}
                      type="time"
                      value={dayHours.end}
                      onChange={(e) => handleDayChange(day.key, 'end', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {copyToAll && (
        <div className="mt-4">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleCopyToAll}
          >
            Copy Monday Hours to All Days
          </Button>
        </div>
      )}

      {/* Preview */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Preview</h4>
        <div className="text-sm space-y-1">
          {DAYS.map(day => {
            const dayHours = workingHours[day.key];
            return (
              <div key={day.key} className="flex justify-between">
                <span>{day.label}:</span>
                <span>
                  {dayHours.enabled 
                    ? `${dayHours.start} - ${dayHours.end}`
                    : 'Closed'
                  }
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
