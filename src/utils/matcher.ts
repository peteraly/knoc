import { 
  UserProfile, 
  Availability, 
  TimeSlot, 
  Day,
  DAYS,
  validateAvailability,
  normalizeAvailability
} from '../types';

interface MatchResult {
  user: UserProfile;
  matchScore: number;
  overlappingSlots: Array<{ day: Day; slot: TimeSlot }>;
  faceMatch: number;
  activityMatch: number;
}

// Helper function to find overlapping time slots
function findOverlappingTimeSlots(
  rawAvailability1: Record<string, string[]>,
  rawAvailability2: Record<string, string[]>
): Array<{ day: Day; slot: TimeSlot }> {
  try {
    // Normalize and validate both availabilities
    const availability1 = validateAvailability(normalizeAvailability(rawAvailability1));
    const availability2 = validateAvailability(normalizeAvailability(rawAvailability2));
    
    const overlappingSlots: Array<{ day: Day; slot: TimeSlot }> = [];
    
    DAYS.forEach(day => {
      const slots1 = availability1[day] || [];
      const slots2 = availability2[day] || [];
      
      // Find common time slots for this day
      const commonSlots = slots1.filter(slot => slots2.includes(slot));
      
      // Add each common slot to the result
      commonSlots.forEach(slot => {
        overlappingSlots.push({ day, slot });
      });
    });
    
    return overlappingSlots;
  } catch (error) {
    console.error('Error in findOverlappingTimeSlots:', error);
    return [];
  }
}

// Helper function to calculate face preference match
function calculateFacePreferenceMatch(
  selectedFaces1: number[] = [], 
  selectedFaces2: number[] = []
): number {
  if (!Array.isArray(selectedFaces1) || !Array.isArray(selectedFaces2)) return 0;
  if (selectedFaces1.length === 0 || selectedFaces2.length === 0) return 0;
  
  const commonFaces = selectedFaces1.filter(face => selectedFaces2.includes(face));
  return commonFaces.length / Math.max(selectedFaces1.length, selectedFaces2.length);
}

// Helper function to calculate activity preference match
function calculateActivityMatch(
  activities1: string[] = [], 
  activities2: string[] = []
): number {
  if (!Array.isArray(activities1) || !Array.isArray(activities2)) return 0;
  if (activities1.length === 0 || activities2.length === 0) return 0;
  
  const commonActivities = activities1.filter(activity => activities2.includes(activity));
  return commonActivities.length / Math.max(activities1.length, activities2.length);
}

// Main matching function
export function findMatches(user: UserProfile, allUsers: UserProfile[]): MatchResult[] {
  if (!user || !Array.isArray(allUsers)) return [];
  
  const matches = allUsers
    .filter(otherUser => otherUser.id !== user.id)
    .map(otherUser => {
      // Find overlapping time slots
      const overlappingSlots = findOverlappingTimeSlots(
        user.availability || {},
        otherUser.availability || {}
      );

      // Calculate preference matches
      const faceMatch = calculateFacePreferenceMatch(
        user.selectedFaces,
        otherUser.selectedFaces
      );

      const activityMatch = calculateActivityMatch(
        user.activities,
        otherUser.activities
      );

      // Calculate overall match score
      const matchScore = (
        (faceMatch * 0.4) + // 40% weight on face preference
        (activityMatch * 0.3) + // 30% weight on activity preference
        (Math.min(overlappingSlots.length / 5, 1) * 0.3) // 30% weight on availability overlap, normalized
      );

      return {
        user: otherUser,
        matchScore,
        overlappingSlots,
        faceMatch,
        activityMatch
      };
    })
    .filter(match => match.matchScore > 0.5) // Only keep matches with >50% compatibility
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score

  return matches;
}

// Function to select the best match
export function selectBestMatch(matches: MatchResult[]): {
  match: UserProfile;
  timeSlot: { day: Day; slot: TimeSlot };
  matchScore: number;
} | null {
  if (!Array.isArray(matches) || matches.length === 0) return null;

  // Get the highest scoring match
  const bestMatch = matches[0];

  // Select a random overlapping time slot
  const selectedSlot = bestMatch.overlappingSlots[
    Math.floor(Math.random() * bestMatch.overlappingSlots.length)
  ];

  return {
    match: bestMatch.user,
    timeSlot: selectedSlot,
    matchScore: bestMatch.matchScore
  };
} 