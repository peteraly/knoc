import mapboxgl from 'mapbox-gl';

// Initialize Mapbox
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

// Helper function to get midpoint between two locations
function getMidpoint(lat1, lng1, lat2, lng2) {
  return {
    lat: (lat1 + lat2) / 2,
    lng: (lng1 + lng2) / 2
  };
}

// Helper function to get venue type based on preferences
function getVenueTypes(preferences) {
  const typeMap = {
    'Coffee Shop': ['cafe', 'coffee'],
    'Park Walk': ['park'],
    'Museum': ['museum'],
    'Bookstore': ['book_store'],
    'Art Gallery': ['art_gallery'],
    'Garden': ['park', 'garden']
  };

  return preferences
    .map(pref => typeMap[pref] || [])
    .flat()
    .filter((value, index, self) => self.indexOf(value) === index);
}

// Main function to suggest a date location
export async function suggestDateLocation(user1, user2) {
  try {
    const midpoint = getMidpoint(
      user1.location.lat,
      user1.location.lng,
      user2.location.lat,
      user2.location.lng
    );

    const venueTypes = getVenueTypes([
      ...user1.activityPreferences,
      ...user2.activityPreferences
    ]);

    // Create a Mapbox Geocoding API request
    const query = venueTypes.join(',');
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?proximity=${midpoint.lng},${midpoint.lat}&types=poi&access_token=${mapboxgl.accessToken}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      // Filter results based on comfort level
      const filteredResults = data.features.filter(place => {
        // Add additional filtering based on comfort level
        if (user1.comfortLevel === 'public' || user2.comfortLevel === 'public') {
          return place.properties.category === 'cafe' || 
                 place.properties.category === 'park' || 
                 place.properties.category === 'museum';
        }
        return true;
      });

      if (filteredResults.length > 0) {
        // Get the first result
        const place = filteredResults[0];
        return {
          name: place.text,
          address: place.place_name,
          rating: place.properties.rating || null,
          isOpen: true, // Mapbox doesn't provide opening hours, assume open
          location: {
            lat: place.center[1],
            lng: place.center[0]
          }
        };
      }
    }

    throw new Error('No suitable venues found');
  } catch (error) {
    console.error('Error suggesting location:', error);
    throw error;
  }
}

// Function to validate if a venue is suitable for both users
export function validateVenue(venue, user1, user2) {
  // Check if venue type matches both users' preferences
  const matchesPreferences = venue.types.some(type =>
    [...user1.activityPreferences, ...user2.activityPreferences]
      .map(pref => getVenueTypes([pref]))
      .flat()
      .includes(type)
  );

  // Check if venue is within comfort level
  const isComfortable = 
    (user1.comfortLevel === 'public' || user2.comfortLevel === 'public') ?
      venue.types.includes('cafe') || venue.types.includes('park') || venue.types.includes('museum') :
      true;

  return matchesPreferences && isComfortable;
} 