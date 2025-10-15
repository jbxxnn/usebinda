'use client';

// Break times editor component

import { useState } from 'react';
import type { BreakTime } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface BreakTimesEditorProps {
  breakTimes: BreakTime[];
  onChange: (breakTimes: BreakTime[]) => void;
}

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

export function BreakTimesEditor({ breakTimes, onChange }: BreakTimesEditorProps) {
  const [newBreak, setNewBreak] = useState<Partial<BreakTime>>({
    start: '',
    end: '',
    days: [],
  });

  const addBreak = () => {
    if (newBreak.start && newBreak.end && newBreak.days && newBreak.days.length > 0) {
      onChange([...breakTimes, newBreak as BreakTime]);
      setNewBreak({ start: '', end: '', days: [] });
    }
  };

  const removeBreak = (index: number) => {
    onChange(breakTimes.filter((_, i) => i !== index));
  };

  const toggleDay = (day: string) => {
    const currentDays = newBreak.days || [];
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    setNewBreak({ ...newBreak, days: updatedDays });
  };

  return (
    <div className="space-y-4">
      {/* Existing Break Times */}
      {breakTimes.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Current Break Times</h4>
          {breakTimes.map((breakTime, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-medium">{breakTime.start} - {breakTime.end}</span>
                </div>
                <div className="flex gap-1">
                  {breakTime.days.map(day => (
                    <span key={day} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {DAYS.find(d => d.key === day)?.label}
                    </span>
                  ))}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => removeBreak(index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Break Time */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Add Break Time</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="break-start">Start Time</Label>
            <Input
              id="break-start"
              type="time"
              value={newBreak.start}
              onChange={(e) => setNewBreak({ ...newBreak, start: e.target.value })}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="break-end">End Time</Label>
            <Input
              id="break-end"
              type="time"
              value={newBreak.end}
              onChange={(e) => setNewBreak({ ...newBreak, end: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label className="mb-2 block">Days of Week</Label>
          <div className="flex gap-4">
            {DAYS.map(day => (
              <div key={day.key} className="flex items-center gap-2">
                <Checkbox 
                  id={`break-${day.key}`}
                  checked={newBreak.days?.includes(day.key) || false}
                  onCheckedChange={() => toggleDay(day.key)}
                />
                <Label htmlFor={`break-${day.key}`} className="text-sm">
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={addBreak}
          disabled={!newBreak.start || !newBreak.end || !newBreak.days || newBreak.days.length === 0}
          className="mt-4"
        >
          Add Break Time
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Common break times:</strong>
        </p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Lunch: 12:00 - 13:00 (Mon-Fri)</li>
          <li>Morning break: 10:00 - 10:15 (Mon-Fri)</li>
          <li>Afternoon break: 15:00 - 15:15 (Mon-Fri)</li>
        </ul>
      </div>
    </div>
  );
}
