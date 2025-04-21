import mapboxgl from 'mapbox-gl';

// Get the Mapbox token from environment variables
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Validate token format
const isValidToken = MAPBOX_TOKEN && MAPBOX_TOKEN.startsWith('pk.');
if (!isValidToken) {
  console.error('Invalid or missing Mapbox token. Please check your .env file and ensure you are using a public token (pk.*)');
}

// Set the token for mapboxgl
mapboxgl.accessToken = MAPBOX_TOKEN;

// Helper function to get midpoint between two locations
function getMidpoint(lat1, lng1, lat2, lng2) {
  return {
    lat: (lat1 + lat2) / 2,
    lng: (lng1 + lng2) / 2
  };
}

// Helper function to get venue types based on activity preferences
function getVenueTypes(activityPreferences) {
  const venueMap = {
    'coffee': ['cafe', 'coffee shop'],
    'dining': ['restaurant', 'bistro'],
    'walks': ['park', 'garden', 'trail'],
    'museums': ['museum', 'gallery', 'exhibition'],
    'music': ['music venue', 'concert hall'],
    'books': ['bookstore', 'library'],
    'fitness': ['gym', 'fitness center', 'yoga studio'],
    'workshops': ['art studio', 'workshop space']
  };

  return activityPreferences
    .map(activity => venueMap[activity] || [activity])
    .flat();
}

// Main function to suggest a date location
export async function suggestDateLocation(user1, user2) {
  if (!isValidToken) {
    throw new Error('Invalid or missing Mapbox token. Please check your .env file.');
  }

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
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?proximity=${midpoint.lng},${midpoint.lat}&types=poi&access_token=${MAPBOX_TOKEN}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.statusText}`);
    }

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