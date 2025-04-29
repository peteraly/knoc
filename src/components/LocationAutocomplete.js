import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from '../utils/mapbox';

// San Francisco Bay Area coordinates and bounding box
const SF_COORDINATES = [-122.4194, 37.7749];
const SF_BOUNDS = [-122.75, 37.15, -121.75, 38.15]; // [west, south, east, north]

const LocationAutocomplete = ({ value, onChange, onCoordinatesChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Add click outside listener to close suggestions
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Focus search on SF Bay Area by using proximity and bounding box
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${mapboxgl.accessToken}&` +
        'country=us&' +
        'types=place,address,poi,neighborhood,locality&' +
        `proximity=${SF_COORDINATES.join(',')}&` + // Center on SF
        `bbox=${SF_BOUNDS.join(',')}&` + // SF Bay Area bounding box
        'limit=5'
      );

      if (!response.ok) throw new Error('Geocoding request failed');

      const data = await response.json();
      setSuggestions(data.features.map(feature => ({
        ...feature,
        // Format the place name to be more readable
        display_name: formatPlaceName(feature)
      })));
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format place names to be more readable
  const formatPlaceName = (feature) => {
    const parts = [];
    
    // Add the main text
    if (feature.text) {
      parts.push(feature.text);
    }

    // Add relevant context
    if (feature.context) {
      const neighborhood = feature.context.find(c => c.id.startsWith('neighborhood'));
      const locality = feature.context.find(c => c.id.startsWith('locality'));
      const place = feature.context.find(c => c.id.startsWith('place'));
      
      if (neighborhood) parts.push(neighborhood.text);
      if (locality) parts.push(locality.text);
      if (place && place.text !== 'Washington') parts.push(place.text);
      
      // Always add DC at the end if we're in DC
      const region = feature.context.find(c => c.id.startsWith('region'));
      if (region && region.text === 'District of Columbia') {
        parts.push('DC');
      }
    }

    return parts.join(', ');
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);

    // Debounce API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.display_name);
    onCoordinatesChange(suggestion.center);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => value && fetchSuggestions(value)}
        placeholder="Search for a place or address"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-2.5">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              <div className="font-medium">{suggestion.text}</div>
              <div className="text-sm text-gray-500">{suggestion.display_name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete; 