// Debug utility for time slot generation

import { generateTimeSlots } from './time-slot-generator';

export async function debugTimeSlotGeneration(
  providerId: string,
  serviceId: string,
  date: Date
) {
  console.log('=== DEBUG: Time Slot Generation ===');
  console.log('Provider ID:', providerId);
  console.log('Service ID:', serviceId);
  console.log('Date:', date.toISOString());
  console.log('Date (local):', date.toLocaleDateString());
  console.log('Day of week:', date.getDay()); // 0 = Sunday, 1 = Monday, etc.
  
  const slots = await generateTimeSlots(providerId, serviceId, date);
  
  console.log('Generated slots:', slots.length);
  console.log('Available slots:', slots.filter(s => s.available).length);
  console.log('All slots:', slots.map(s => ({
    start: s.start,
    end: s.end,
    available: s.available,
    startLocal: new Date(s.start).toLocaleString(),
    endLocal: new Date(s.end).toLocaleString()
  })));
  
  return slots;
}
