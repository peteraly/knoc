import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const LocationAutocomplete = ({ value, onChange, onCoordinatesChange, onNeighborhoodChange, required }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Define SF neighborhoods with their approximate boundaries
  const neighborhoods = {
    'downtown': {
      bounds: {
        north: 37.789,
        south: 37.781,
        east: -122.405,
        west: -122.419
      }
    },
    'mission': {
      bounds: {
        north: 37.768,
        south: 37.748,
        east: -122.407,
        west: -122.422
      }
    },
    'haight': {
      bounds: {
        north: 37.775,
        south: 37.765,
        east: -122.435,
        west: -122.454
      }
    },
    'castro': {
      bounds: {
        north: 37.765,
        south: 37.755,
        east: -122.425,
        west: -122.437
      }
    },
    'soma': {
      bounds: {
        north: 37.789,
        south: 37.775,
        east: -122.386,
        west: -122.405
      }
    },
    'marina': {
      bounds: {
        north: 37.807,
        south: 37.797,
        east: -122.426,
        west: -122.447
      }
    },
    'richmond': {
      bounds: {
        north: 37.789,
        south: 37.771,
        east: -122.471,
        west: -122.511
      }
    },
    'sunset': {
      bounds: {
        north: 37.771,
        south: 37.747,
        east: -122.471,
        west: -122.511
      }
    },
    'nob-hill': {
      bounds: {
        north: 37.794,
        south: 37.787,
        east: -122.410,
        west: -122.419
      }
    },
    'north-beach': {
      bounds: {
        north: 37.807,
        south: 37.796,
        east: -122.400,
        west: -122.414
      }
    }
  };

  // Function to determine neighborhood based on coordinates
  const determineNeighborhood = (lat, lng) => {
    for (const [neighborhood, data] of Object.entries(neighborhoods)) {
      const { bounds } = data;
      if (lat <= bounds.north && lat >= bounds.south && 
          lng >= bounds.west && lng <= bounds.east) {
        return neighborhood;
      }
    }
    return 'other';
  };

  // Function to fetch address suggestions
  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Add "San Francisco" to the search query to limit results to SF
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query + ' San Francisco')}.json?` +
        `access_token=${process.env.REACT_APP_MAPBOX_TOKEN}&` +
        'bbox=-122.517,37.707,-122.355,37.833' // SF bounding box
      );
      
      const data = await response.json();
      
      // Filter and format suggestions
      const formattedSuggestions = data.features.map(feature => ({
        address: feature.place_name,
        coordinates: feature.center, // [longitude, latitude]
        neighborhood: determineNeighborhood(feature.center[1], feature.center[0])
      }));
      
      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
    setIsLoading(false);
  };

  // Debounce the fetch suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const handleSelectSuggestion = (suggestion) => {
    setSelectedAddress(suggestion);
    onChange(suggestion.address);
    onCoordinatesChange({
      lat: suggestion.coordinates[1],
      lng: suggestion.coordinates[0]
    });
    onNeighborhoodChange(suggestion.neighborhood);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter address in San Francisco"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 p-2 text-gray-500">
          Loading suggestions...
        </div>
      )}

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="font-medium">{suggestion.address}</div>
              <div className="text-sm text-gray-500">
                {suggestion.neighborhood.charAt(0).toUpperCase() + suggestion.neighborhood.slice(1).replace('-', ' ')}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected address indicator */}
      {selectedAddress && (
        <div className="mt-2 text-sm">
          <span className="font-medium text-gray-700">Selected neighborhood: </span>
          <span className="text-gray-600">
            {selectedAddress.neighborhood.charAt(0).toUpperCase() + selectedAddress.neighborhood.slice(1).replace('-', ' ')}
          </span>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete; 