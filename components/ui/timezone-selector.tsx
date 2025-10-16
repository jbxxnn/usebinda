'use client';

// Timezone selector component

import { COMMON_TIMEZONES, getTimezoneInfo } from '@/lib/timezone';
import { Label } from './label';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

export function TimezoneSelector({ 
  value, 
  onChange, 
  label = "Timezone",
  required = false,
  className = ""
}: TimezoneSelectorProps) {
  const timezoneInfo = getTimezoneInfo(value);

  return (
    <div className={className}>
      <Label htmlFor="timezone-select">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <select
        id="timezone-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        required={required}
        aria-label={label}
      >
        {COMMON_TIMEZONES.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>
      
      {value && (
        <p className="text-sm text-muted-foreground mt-1">
          Current time: {timezoneInfo.currentTime} ({timezoneInfo.abbreviation})
        </p>
      )}
    </div>
  );
}
