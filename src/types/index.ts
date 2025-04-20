import { z } from 'zod';

// Constants
export const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'] as const;
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export const GENDER_OPTIONS = ['Woman', 'Man', 'Non-binary', 'Other'] as const;

// Zod Schemas
export const BasicInfoSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(18).max(100),
  gender: z.enum(GENDER_OPTIONS),
  location: z.string().min(1),
  bio: z.string().optional(),
  photoURL: z.string().url().optional()
});

export const PreferencesSchema = z.object({
  venue: z.enum(['public', 'any']),
  activityLevel: z.enum(['casual', 'active']),
  timePreference: z.enum(['daytime', 'any']),
  interestedIn: z.array(z.enum(GENDER_OPTIONS)),
  ageRange: z.object({
    min: z.number().int().min(18),
    max: z.number().int().max(100)
  }),
  maxDistance: z.number().positive()
});

export const AvailabilitySchema = z.record(
  z.enum(DAYS),
  z.array(z.enum(TIME_SLOTS))
);

export const UserProfileSchema = z.object({
  id: z.string(),
  basicInfo: BasicInfoSchema,
  preferences: PreferencesSchema,
  activities: z.array(z.string()),
  selectedFaces: z.array(z.number()).optional(),
  availability: AvailabilitySchema,
  blackoutDates: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date()
});

// TypeScript Types
export type TimeSlot = z.infer<typeof TIME_SLOTS>;
export type Day = z.infer<typeof DAYS>;
export type Gender = z.infer<typeof GENDER_OPTIONS>;
export type BasicInfo = z.infer<typeof BasicInfoSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type Availability = z.infer<typeof AvailabilitySchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;

// Validation Utilities
export const validateUserProfile = (data: unknown): UserProfile => {
  return UserProfileSchema.parse(data);
};

export const validateAvailability = (data: unknown): Availability => {
  return AvailabilitySchema.parse(data);
};

// Helper Functions
export const createEmptyAvailability = (): Availability => {
  return DAYS.reduce((acc, day) => ({
    ...acc,
    [day]: []
  }), {} as Availability);
};

export const normalizeAvailability = (availability: Record<string, string[]>): Availability => {
  const normalized: Partial<Availability> = {};
  
  DAYS.forEach(day => {
    const slots = availability[day] || availability[day.toLowerCase()] || [];
    normalized[day] = slots.map(slot => 
      slot.charAt(0).toUpperCase() + slot.slice(1).toLowerCase()
    ) as typeof TIME_SLOTS[number][];
  });
  
  return normalized as Availability;
};

// Type Guards
export const isValidTimeSlot = (slot: string): slot is typeof TIME_SLOTS[number] => {
  return TIME_SLOTS.includes(slot as typeof TIME_SLOTS[number]);
};

export const isValidDay = (day: string): day is typeof DAYS[number] => {
  return DAYS.includes(day as typeof DAYS[number]);
}; 