// Helper function to find overlapping time slots
function findOverlappingTimeSlots(availability1, availability2) {
  const overlappingSlots = [];
  
  Object.keys(availability1).forEach(day => {
    Object.keys(availability1[day]).forEach(slot => {
      if (availability1[day][slot] && availability2[day][slot]) {
        overlappingSlots.push({ day, slot });
      }
    });
  });
  
  return overlappingSlots;
}

// Helper function to calculate face preference match
function calculateFacePreferenceMatch(selectedFaces1, selectedFaces2) {
  const commonFaces = selectedFaces1.filter(face => selectedFaces2.includes(face));
  return commonFaces.length / Math.max(selectedFaces1.length, selectedFaces2.length);
}

// Helper function to calculate activity preference match
function calculateActivityMatch(activities1, activities2) {
  const commonActivities = activities1.filter(activity => activities2.includes(activity));
  return commonActivities.length / Math.max(activities1.length, activities2.length);
}

// Main matching function
export function findMatches(user, allUsers) {
  const matches = allUsers
    .filter(otherUser => otherUser.id !== user.id)
    .map(otherUser => {
      // Find overlapping time slots
      const overlappingSlots = findOverlappingTimeSlots(
        user.availability,
        otherUser.availability
      );

      // Calculate preference matches
      const faceMatch = calculateFacePreferenceMatch(
        user.selectedFaces,
        otherUser.selectedFaces
      );

      const activityMatch = calculateActivityMatch(
        user.activityPreferences,
        otherUser.activityPreferences
      );

      // Calculate overall match score
      const matchScore = (
        (faceMatch * 0.4) + // 40% weight on face preference
        (activityMatch * 0.3) + // 30% weight on activity preference
        (overlappingSlots.length * 0.3) // 30% weight on availability overlap
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
export function selectBestMatch(matches) {
  if (matches.length === 0) return null;

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