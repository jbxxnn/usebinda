'use client';

// Blocked periods manager component

import { useState, useEffect } from 'react';
import type { BlockedPeriod } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function BlockedPeriodsManager() {
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [newBlock, setNewBlock] = useState<{
    start_date: string;
    start_time: string;
    end_date: string;
    end_time: string;
    title: string;
    description: string;
    block_type: 'manual' | 'holiday' | 'vacation' | 'maintenance';
  }>({
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '17:00',
    title: '',
    description: '',
    block_type: 'manual',
  });

  // Load blocked periods
  useEffect(() => {
    loadBlockedPeriods();
  }, []);

  const loadBlockedPeriods = async () => {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const response = await fetch(
        `/api/availability/blocked-periods?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const result = await response.json();
        setBlockedPeriods(result.data || []);
      }
    } catch (error) {
      console.error('Error loading blocked periods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addBlockedPeriod = async () => {
    if (!newBlock.start_date || !newBlock.end_date || !newBlock.title) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const startDateTime = `${newBlock.start_date}T${newBlock.start_time}:00`;
      const endDateTime = `${newBlock.end_date}T${newBlock.end_time}:00`;

      const response = await fetch('/api/availability/blocked-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_time: startDateTime,
          end_time: endDateTime,
          title: newBlock.title,
          description: newBlock.description || null,
          block_type: newBlock.block_type,
        }),
      });

      if (response.ok) {
        setNewBlock({
          start_date: '',
          start_time: '09:00',
          end_date: '',
          end_time: '17:00',
          title: '',
          description: '',
          block_type: 'manual',
        });
        loadBlockedPeriods();
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to add blocked period');
      }
    } catch (error) {
      console.error('Error adding blocked period:', error);
      setError('An unexpected error occurred');
    }
  };

  const removeBlockedPeriod = async (id: string) => {
    try {
      const response = await fetch(`/api/availability/blocked-periods/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadBlockedPeriods();
      } else {
        setError('Failed to remove blocked period');
      }
    } catch (error) {
      console.error('Error removing blocked period:', error);
      setError('An unexpected error occurred');
    }
  };

  const getBlockTypeColor = (type: string) => {
    switch (type) {
      case 'holiday': return 'destructive';
      case 'vacation': return 'secondary';
      case 'maintenance': return 'outline';
      default: return 'default';
    }
  };

  if (isLoading) {
    return <div>Loading blocked periods...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Existing Blocked Periods */}
      {blockedPeriods.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Current Blocked Periods</h4>
          {blockedPeriods.map((blocked) => (
            <div key={blocked.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant={getBlockTypeColor(blocked.block_type)}>
                  {blocked.block_type}
                </Badge>
                <div>
                  <div className="font-medium">{blocked.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(blocked.start_time).toLocaleDateString()} - {new Date(blocked.end_time).toLocaleDateString()}
                  </div>
                  {blocked.description && (
                    <div className="text-sm text-muted-foreground">{blocked.description}</div>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => removeBlockedPeriod(blocked.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Blocked Period */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Block Time Period</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="block-start-date">Start Date</Label>
            <Input
              id="block-start-date"
              type="date"
              value={newBlock.start_date}
              onChange={(e) => setNewBlock({ ...newBlock, start_date: e.target.value })}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="block-start-time">Start Time</Label>
            <Input
              id="block-start-time"
              type="time"
              value={newBlock.start_time}
              onChange={(e) => setNewBlock({ ...newBlock, start_time: e.target.value })}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="block-end-date">End Date</Label>
            <Input
              id="block-end-date"
              type="date"
              value={newBlock.end_date}
              onChange={(e) => setNewBlock({ ...newBlock, end_date: e.target.value })}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="block-end-time">End Time</Label>
            <Input
              id="block-end-time"
              type="time"
              value={newBlock.end_time}
              onChange={(e) => setNewBlock({ ...newBlock, end_time: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="block-title">Title *</Label>
          <Input
            id="block-title"
            value={newBlock.title}
            onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
            placeholder="e.g., Vacation, Holiday, Maintenance"
            className="mt-1"
          />
        </div>

        <div className="mt-4">
          <Label htmlFor="block-description">Description</Label>
          <Input
            id="block-description"
            value={newBlock.description}
            onChange={(e) => setNewBlock({ ...newBlock, description: e.target.value })}
            placeholder="Optional description"
            className="mt-1"
          />
        </div>

        <div className="mt-4">
          <Label htmlFor="block-type">Block Type</Label>
           <select
             aria-label="Block Type"
             id="block-type"
             value={newBlock.block_type}
             onChange={(e) => setNewBlock({ ...newBlock, block_type: e.target.value as 'manual' | 'holiday' | 'vacation' | 'maintenance' })}
             className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
           >
            <option value="manual">Manual Block</option>
            <option value="holiday">Holiday</option>
            <option value="vacation">Vacation</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <Button 
          onClick={addBlockedPeriod}
          disabled={!newBlock.start_date || !newBlock.end_date || !newBlock.title}
          className="mt-4"
        >
          Block Time Period
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Common blocked periods:</strong>
        </p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Holidays: Christmas, New Year, etc.</li>
          <li>Vacation: Personal time off</li>
          <li>Maintenance: Equipment repairs, office cleaning</li>
          <li>Training: Staff meetings, workshops</li>
        </ul>
      </div>
    </div>
  );
}
