# Time Slot Generation System

## Overview
The time slot generation system is the core "Calendly-like" scheduling engine for Binda. It intelligently generates available booking times based on provider availability, existing bookings, and various constraints.

## Architecture

### Core Components

1. **`lib/time-slot-generator.ts`** - Main scheduling algorithm
2. **`app/api/availability/slots/route.ts`** - API endpoint for customers
3. **`components/booking/booking-form.tsx`** - Customer booking interface

## How It Works

### 1. Time Slot Generation Algorithm

The `generateTimeSlots()` function follows this process:

```
1. Fetch provider's availability settings
   ├─ Working hours (Mon-Sun)
   ├─ Break times
   ├─ Buffer time between appointments
   ├─ Booking limits (min/max advance)
   └─ Capacity per slot

2. Fetch service details
   └─ Duration (e.g., 60 minutes)

3. Check if date is bookable
   ├─ Within min advance booking window
   └─ Within max advance booking window

4. Check if provider works on this day
   └─ Is day enabled in working hours?

5. Fetch blocked periods
   └─ Holidays, vacations, maintenance

6. Fetch existing bookings
   └─ Count bookings per time slot

7. Generate slots at 15-minute intervals
   └─ Check each slot for availability
```

### 2. Slot Availability Checks

Each potential time slot is validated against:

#### ✅ **Time-based Checks**
- ❌ Slot is in the past
- ❌ Slot is outside working hours
- ❌ Slot conflicts with break times

#### 🚫 **Blocking Checks**
- ❌ Slot overlaps with blocked periods
- ❌ Slot overlaps with existing bookings

#### 📊 **Capacity Checks**
- ❌ Slot has reached max bookings limit

### 3. API Usage

#### Get Time Slots for a Specific Date
```
GET /api/availability/slots?providerId={uuid}&serviceId={uuid}&date={iso-date}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "start": "2025-10-20T09:00:00.000Z",
      "end": "2025-10-20T10:00:00.000Z",
      "available": true
    },
    {
      "start": "2025-10-20T09:15:00.000Z",
      "end": "2025-10-20T10:15:00.000Z",
      "available": true
    },
    {
      "start": "2025-10-20T12:00:00.000Z",
      "end": "2025-10-20T13:00:00.000Z",
      "available": false
    }
  ]
}
```

#### Get Available Dates (with at least one slot)
```
GET /api/availability/slots?providerId={uuid}&serviceId={uuid}&mode=dates&daysAhead=30
```

**Response:**
```json
{
  "success": true,
  "data": [
    "2025-10-20T00:00:00.000Z",
    "2025-10-21T00:00:00.000Z",
    "2025-10-23T00:00:00.000Z"
  ]
}
```

## Configuration

### Slot Interval
Currently set to **15 minutes** in `generateSlotsForDay()`:
```typescript
const slotInterval = 15; // minutes
```

This means slots are generated at:
- 9:00 AM
- 9:15 AM
- 9:30 AM
- 9:45 AM
- etc.

### Working Hours Format
```typescript
{
  "monday": { "start": "09:00", "end": "17:00", "enabled": true },
  "tuesday": { "start": "09:00", "end": "17:00", "enabled": true },
  // ... etc
}
```

### Break Times Format
```typescript
[
  {
    "start": "12:00",
    "end": "13:00",
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
  }
]
```

## Examples

### Example 1: Basic Availability

**Provider Settings:**
- Working Hours: Mon-Fri, 9 AM - 5 PM
- Break: 12 PM - 1 PM (lunch)
- Buffer: 30 minutes
- Service Duration: 60 minutes

**Result:**
- Slots generated every 15 minutes from 9:00 AM - 5:00 PM
- Each slot is 90 minutes (60 min service + 30 min buffer)
- No slots during 12:00 PM - 1:00 PM (lunch break)
- Last bookable slot: 3:30 PM (ends at 5:00 PM)

### Example 2: With Existing Bookings

**Existing Bookings:**
- 10:00 AM - Booking A
- 2:00 PM - Booking B

**Result:**
- 10:00 AM slot: ❌ Not available
- 10:15 AM slot: ❌ Not available (overlaps with Booking A)
- 10:30 AM slot: ❌ Not available (overlaps with Booking A)
- 11:30 AM slot: ✅ Available
- 2:00 PM slot: ❌ Not available
- 3:30 PM slot: ✅ Available

### Example 3: Blocked Period

**Blocked Period:**
- Dec 25, 2025 (Christmas) - All day

**Result:**
- No slots generated for Dec 25, 2025

## Performance Considerations

### Optimization Strategies

1. **Caching**
   - Cache availability settings per provider
   - Cache service details
   - Cache blocked periods for date ranges

2. **Database Queries**
   - Fetch only necessary date ranges
   - Use indexes on `date_time`, `provider_id`, `status`
   - Filter cancelled bookings at query level

3. **Parallel Processing**
   - When fetching available dates, consider batching

## Future Enhancements

### Phase 1 (Current) ✅
- [x] Basic time slot generation
- [x] Working hours support
- [x] Break times
- [x] Buffer times
- [x] Blocked periods
- [x] Capacity limits
- [x] Advance booking rules

### Phase 2 (Upcoming)
- [ ] Recurring availability patterns
- [ ] Timezone conversion for customers
- [ ] Smart slot recommendations
- [ ] Waitlist for fully booked slots
- [ ] Calendar integration (Google, Outlook)

### Phase 3 (Future)
- [ ] AI-powered optimal slot suggestions
- [ ] Dynamic pricing based on demand
- [ ] Multi-service booking (combo services)
- [ ] Team scheduling (multiple providers)

## Testing

### Manual Testing Steps

1. **Setup Provider Availability**
   ```
   - Go to /dashboard/availability
   - Set working hours (e.g., Mon-Fri 9-5)
   - Add break time (e.g., 12-1 PM)
   - Set buffer time (e.g., 30 min)
   - Save settings
   ```

2. **Create a Service**
   ```
   - Go to /dashboard/services
   - Create service with 60-minute duration
   ```

3. **Test Booking Flow**
   ```
   - Visit /{username}
   - Select service
   - View available dates
   - Select date
   - View time slots
   - Verify slots respect working hours, breaks, and buffer
   ```

4. **Test Blocked Periods**
   ```
   - Block a specific date/time
   - Verify no slots appear during blocked period
   ```

5. **Test Existing Bookings**
   ```
   - Create a booking for 10:00 AM
   - Verify 10:00 AM slot is no longer available
   ```

## Troubleshooting

### No Slots Appearing

**Check:**
1. Provider has availability settings configured
2. Working hours are enabled for the selected day
3. Date is within min/max advance booking window
4. Service exists and has valid duration
5. No full-day blocked period on that date

### Slots During Break Time

**Check:**
1. Break time `days` array includes the day of week
2. Break time format is correct (HH:MM)
3. Break time overlap detection logic

### Slots in the Past

**Check:**
1. `isSlotAvailable()` checks `slotStart <= now`
2. Server time vs. client time discrepancy

## Related Files

- `lib/availability.ts` - Availability settings helpers
- `lib/types.ts` - TypeScript interfaces
- `supabase/migrations/003_availability_settings.sql` - Database schema
- `components/availability/` - Provider UI components
- `components/booking/booking-form.tsx` - Customer booking UI

## API Reference

### `generateTimeSlots(providerId, serviceId, date, timezone)`
Generates available time slots for a specific date.

**Parameters:**
- `providerId` - UUID of the provider
- `serviceId` - UUID of the service
- `date` - Date object for the target date
- `timezone` - IANA timezone string (default: 'America/New_York')

**Returns:** `Promise<TimeSlot[]>`

### `getAvailableDates(providerId, serviceId, daysAhead)`
Returns dates that have at least one available slot.

**Parameters:**
- `providerId` - UUID of the provider
- `serviceId` - UUID of the service
- `daysAhead` - Number of days to look ahead (default: 30)

**Returns:** `Promise<Date[]>`

## Database Schema

### `availability_settings`
```sql
- id: UUID
- user_id: UUID (unique)
- timezone: TEXT
- working_hours: JSONB
- break_times: JSONB
- default_buffer_minutes: INTEGER
- max_bookings_per_slot: INTEGER
- min_advance_booking_hours: INTEGER
- max_advance_booking_days: INTEGER
```

### `blocked_periods`
```sql
- id: UUID
- user_id: UUID
- block_type: TEXT (manual, holiday, vacation, maintenance)
- start_time: TIMESTAMPTZ
- end_time: TIMESTAMPTZ
- title: TEXT
- description: TEXT
```

### `bookings`
```sql
- id: UUID
- provider_id: UUID
- service_id: UUID
- date_time: TIMESTAMPTZ
- status: TEXT (pending, confirmed, completed, cancelled)
```

## Support

For issues or questions about the time slot generation system:
1. Check this documentation
2. Review the code comments in `lib/time-slot-generator.ts`
3. Test with the manual testing steps above
4. Check database for correct availability settings

