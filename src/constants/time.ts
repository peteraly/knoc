export const TIME_RANGES = {
  morning: { start: 9, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 21 }
} as const;

export const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'] as const;
export type TimeSlot = typeof TIME_SLOTS[number];

export const TIME_PERIODS = {
  morning: '9 AM - 12 PM',
  afternoon: '12 PM - 5 PM',
  evening: '5 PM - 9 PM'
} as const;

export const TIME_SLOTS_HOURLY = {
  morning: ['9:00 AM', '10:00 AM', '11:00 AM'],
  afternoon: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
  evening: ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM']
} as const;

// Helper functions
export const normalizeTimeSlot = (slot: string): string => {
  return slot.charAt(0).toUpperCase() + slot.slice(1).toLowerCase();
};

export const isValidTimeSlot = (slot: string): boolean => {
  const normalized = normalizeTimeSlot(slot);
  return TIME_SLOTS.includes(normalized as TimeSlot);
}; 