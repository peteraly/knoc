import React, { useState, useRef } from 'react';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';

const LocationSearch = ({ onLocationSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  const searchLocation = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${process.env.REACT_APP_MAPBOX_TOKEN}&` +
        'country=us&' +
        'types=address,poi,place&' +
        'limit=5'
      );

      if (!response.ok) throw new Error('Geocoding request failed');

      const data = await response.json();
      const formattedSuggestions = data.features.map(feature => ({
        name: feature.text,
        address: feature.place_name,
        coordinates: {
          lng: feature.center[0],
          lat: feature.center[1]
        },
        placeId: feature.id,
        types: feature.place_type
      }));

      setSuggestions(formattedSuggestions);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.address);
    setSuggestions([]);
    onLocationSelect(suggestion);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder="Search any US location"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          autoComplete="off"
        />
      </div>

      {isLoading && (
        <div className="absolute inset-x-0 top-full mt-2 p-4 bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        </div>
      )}

      {!isLoading && suggestions.length > 0 && (
        <div className="absolute inset-x-0 top-full mt-2 bg-white rounded-lg shadow-lg overflow-hidden z-50">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start space-x-3"
            >
              <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{suggestion.name}</p>
                <p className="text-sm text-gray-500 truncate">{suggestion.address}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearch; 