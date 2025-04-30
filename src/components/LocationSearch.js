import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';

const LocationSearch = ({ onLocationSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    // Load the Google Maps JavaScript API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = initializeAutocomplete;
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const initializeAutocomplete = () => {
    if (!searchInputRef.current) return;

    // Create a bounds that covers the entire United States
    const bounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(25.82, -124.39), // SW corner of US
      new window.google.maps.LatLng(49.38, -66.94)   // NE corner of US
    );

    autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      types: ['establishment', 'geocode'],
      fields: ['formatted_address', 'geometry', 'name', 'place_id', 'types'],
      componentRestrictions: { country: 'us' },
      bounds: bounds,
      strictBounds: false // Allow results outside the bounds
    });

    // Configure the search to prioritize recreation facilities
    const searchOptions = {
      locationBias: bounds,
      query: searchQuery,
      fields: ['name', 'geometry', 'formatted_address', 'place_id'],
      type: ['park', 'gym', 'stadium', 'establishment']
    };

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      setIsLoading(false);
      
      if (place.geometry) {
        onLocationSelect({
          name: place.name || '',
          address: place.formatted_address,
          coordinates: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          },
          placeId: place.place_id,
          types: place.types || []
        });

        // Update the input value with the full address
        setSearchQuery(place.formatted_address);
      }
    });
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setIsLoading(true);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder="Search any US location (e.g., Banneker Recreation Center, DC)"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          autoComplete="off"
        />
      </div>

      {isLoading && suggestions.length === 0 && searchQuery && (
        <div className="absolute inset-x-0 top-full mt-2 p-4 bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="absolute inset-x-0 top-full mt-2 bg-white rounded-lg shadow-lg overflow-hidden z-50">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.placeId}
              onClick={() => onLocationSelect(suggestion)}
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