import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { db } from '../utils/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp, getDoc, updateDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import { format, addDays, startOfDay } from 'date-fns';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox configuration
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const DEFAULT_COORDINATES = [-122.4194, 37.7749]; // San Francisco coordinates
const isValidToken = MAPBOX_TOKEN && MAPBOX_TOKEN.length > 0;

// Validate token format
if (!isValidToken) {
  console.warn('Warning: Invalid or missing Mapbox token. Please check your environment variables.');
}

// Sample data for development
const SAMPLE_PROFILES = {
  '1': {
    id: '1',
    basicInfo: {
      name: 'Michael Chen',
      age: 29,
      location: 'San Francisco, CA'
    },
    availability: {
      monday: ['morning', 'evening'],
      wednesday: ['afternoon'],
      friday: ['morning', 'afternoon'],
      saturday: ['afternoon', 'evening']
    },
    activities: ['Coffee & Tea', 'Outdoor Walks', 'Museums & Galleries']
  },
  currentUser: {
    availability: {
      monday: ['6:00 PM', '7:00 PM', '8:00 PM'],
      wednesday: ['5:00 PM', '6:00 PM', '7:00 PM'],
      friday: ['6:00 PM', '7:00 PM', '8:00 PM']
    }
  }
};

const CURRENT_USER_AVAILABILITY = {
  monday: ['morning', 'afternoon'],
  wednesday: ['afternoon'],
  friday: ['afternoon'],
  saturday: ['morning', 'afternoon']
};

const TIME_PERIODS = {
  morning: ['9:00 AM', '10:00 AM', '11:00 AM'],
  afternoon: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
  evening: ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM']
};

const VENUES = [
  { id: 'coffee', name: 'Coffee Shop', icon: '☕️' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'park', name: 'Park', icon: '🌳' },
  { id: 'museum', name: 'Museum', icon: '🏛️' },
  { id: 'custom', name: 'Custom Venue', icon: '📍' }
];

const ACTIVITIES = [
  { id: 1, name: 'Coffee & Conversation', type: 'casual' },
  { id: 2, name: 'Wine Tasting', type: 'romantic' },
  { id: 3, name: 'Dinner', type: 'formal' },
  { id: 4, name: 'Picnic', type: 'outdoor' }
];

// Helper function to get first name
const getFirstName = (fullName) => fullName.split(' ')[0];

const STEPS = {
  DAY: 1,
  TIME: 2,
  ACTIVITY: 3,
  LOCATION: 4
};

const SAMPLE_VENUES = [
  {
    id: 'v1',
    name: 'The Coffee House',
    type: 'Café',
    address: '123 Main St',
    image: 'https://source.unsplash.com/random/800x600/?cafe'
  },
  {
    id: 'v2',
    name: 'Central Park',
    type: 'Park',
    address: 'Central Park West',
    image: 'https://source.unsplash.com/random/800x600/?park'
  },
  {
    id: 'v3',
    name: 'Art Gallery',
    type: 'Cultural',
    address: '456 Culture Ave',
    image: 'https://source.unsplash.com/random/800x600/?art-gallery'
  }
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function DatePlanning({ isNewDate = false }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const profile = location.state?.profile;
  const returnTo = location.state?.returnTo || '/matches';
  const [currentStep, setCurrentStep] = useState(STEPS.DAY);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [customVenue, setCustomVenue] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [dateRequest, setDateRequest] = useState(null);
  const [isRecipient, setIsRecipient] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [overlappingSlots, setOverlappingSlots] = useState({});
  const [currentUserAvailability, setCurrentUserAvailability] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: DEFAULT_COORDINATES[0],
    latitude: DEFAULT_COORDINATES[1],
    zoom: 12
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [venues, setVenues] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Calculate overlapping availability using useMemo
  const calculateOverlappingSlots = useMemo(() => {
    if (!profile?.availability || !currentUserAvailability) {
      console.log('Missing availability data:', { profile: profile?.availability, currentUser: currentUserAvailability });
      return {};
    }

    console.log('Profile availability:', profile.availability);
    console.log('Current user availability:', currentUserAvailability);

    const overlapping = {};
    
    DAYS.forEach(day => {
      const userPeriods = currentUserAvailability[day] || [];
      const matchPeriods = profile.availability[day] || [];
      
      if (userPeriods.length > 0 && matchPeriods.length > 0) {
        // Find overlapping periods (morning, afternoon, evening)
        const overlappingPeriods = matchPeriods.filter(period => 
          userPeriods.includes(period)
        );
        
        if (overlappingPeriods.length > 0) {
          overlapping[day] = overlappingPeriods;
          console.log(`Found overlapping periods for ${day}:`, overlappingPeriods);
        }
      }
    });

    console.log('Final overlapping slots:', overlapping);
    return overlapping;
  }, [profile?.availability, currentUserAvailability]);

  useEffect(() => {
    console.log('DatePlanning mounted with:', { 
      isNewDate, 
      profile, 
      state: location.state 
    });
    
    // Redirect if no profile data is provided
    if (!profile || !profile.id || !profile.basicInfo || !profile.availability) {
      console.error('Invalid or missing profile data:', profile);
      toast.error('Please select a profile to plan a date with');
      navigate(returnTo, { replace: true });
      return;
    }

    // Fetch current user's availability
    const fetchCurrentUserAvailability = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUserAvailability(userData.availability || {});
          console.log('Fetched current user availability:', userData.availability);
        } else {
          console.error('Current user document not found');
          toast.error('Failed to load your availability');
          navigate(returnTo, { replace: true });
        }
      } catch (error) {
        console.error('Error fetching current user availability:', error);
        toast.error('Failed to load your availability');
        navigate(returnTo, { replace: true });
      }
    };

    fetchCurrentUserAvailability();

    if (location.state?.requestId) {
      setRequestId(location.state.requestId);
      // Use a simple document reference instead of a compound query
      const dateRequestRef = doc(db, 'dateRequests', location.state.requestId);
      
      const unsubscribe = onSnapshot(dateRequestRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setDateRequest(data);
          setIsRecipient(data.recipientId === currentUser.uid);
          
          if (data.dateDetails) {
            setSelectedDay(data.dateDetails.day || '');
            setSelectedTime(data.dateDetails.time || '');
            setSelectedActivity(data.dateDetails.activity || '');
            if (data.dateDetails.venue) {
              const venue = VENUES.find(v => v.name === data.dateDetails.venue);
              setSelectedVenue(venue || { id: 'custom', name: data.dateDetails.venue });
              if (!venue) {
                setCustomVenue(data.dateDetails.venue);
              }
            }
          }
        }
      }, (error) => {
        console.error('Error fetching date request:', error);
        toast.error('Failed to load date request details');
      });

      return () => unsubscribe();
    }

    setLoading(false);
  }, [profile, location.state?.requestId, currentUser?.uid, navigate, returnTo, isNewDate]);

  // Update overlapping slots when availability changes
  useEffect(() => {
    if (currentUserAvailability && profile?.availability) {
      setOverlappingSlots(calculateOverlappingSlots);
      setLoading(false);
    }
  }, [currentUserAvailability, profile?.availability, calculateOverlappingSlots]);

  const handleNext = () => {
    if (currentStep === STEPS.DAY && selectedDay) {
      setCurrentStep(STEPS.TIME);
    } else if (currentStep === STEPS.TIME && selectedTime) {
      setCurrentStep(STEPS.ACTIVITY);
    } else if (currentStep === STEPS.ACTIVITY && selectedActivity) {
      setCurrentStep(STEPS.LOCATION);
    }
  };

  const handleBack = () => {
    if (currentStep === STEPS.TIME) {
      setCurrentStep(STEPS.DAY);
    } else if (currentStep === STEPS.ACTIVITY) {
      setCurrentStep(STEPS.TIME);
    } else if (currentStep === STEPS.LOCATION) {
      setCurrentStep(STEPS.ACTIVITY);
    } else {
      navigate(returnTo);
    }
  };

  // Function to search for venues using the Mapbox Geocoding API
  const searchVenues = async (query) => {
    if (!isValidToken || !query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `proximity=${viewState.longitude},${viewState.latitude}&` +
        `types=poi&limit=5`
      );
      
      const data = await response.json();
      const formattedVenues = data.features.map(feature => ({
        id: feature.id,
        name: feature.text,
        address: feature.place_name,
        coordinates: feature.center,
      }));
      
      setVenues(formattedVenues);
    } catch (error) {
      console.error('Error searching venues:', error);
      toast.error('Failed to search venues. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchVenues(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Function to fetch address suggestions
  const fetchSuggestions = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${MAPBOX_TOKEN}&` +
        `types=place,address,poi,neighborhood&` +
        `proximity=${viewState.longitude},${viewState.latitude}&` +
        `limit=5`
      );
      const data = await response.json();
      
      const formattedSuggestions = data.features.map(feature => ({
        id: feature.id,
        text: feature.text,
        place_name: feature.place_name,
        type: feature.place_type[0],
        coordinates: feature.center
      }));
      
      setSuggestions(formattedSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  // Debounce suggestions fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(addressInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [addressInput]);

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    const [longitude, latitude] = suggestion.coordinates;
    
    setViewState({
      longitude,
      latitude,
      zoom: 14
    });
    
    setSelectedLocation({
      longitude,
      latitude,
      address: suggestion.place_name
    });
    
    setAddressInput(suggestion.place_name);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle map click to set location
  const handleMapClick = (event) => {
    if (!event.lngLat) return;
    
    setSelectedLocation({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
      name: 'Custom Location',
      address: 'Selected on map'
    });
    setSelectedVenue({
      id: 'custom',
      name: 'Custom Location',
      address: 'Selected on map',
      coordinates: [event.lngLat.lng, event.lngLat.lat]
    });
  };

  // Render map component
  const renderMap = () => {
    if (!isValidToken) {
      return (
        <div className="h-[calc(100vh-180px)] w-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Invalid Mapbox token. Please use a public token (pk.*)</p>
        </div>
      );
    }

    return (
      <div className="h-[calc(100vh-280px)] w-full relative rounded-lg overflow-hidden">
        <Map
          {...viewState}
          mapboxAccessToken={MAPBOX_TOKEN}
          onMove={evt => setViewState(evt.viewState)}
          onClick={handleMapClick}
          style={{width: '100%', height: '100%'}}
          mapStyle="mapbox://styles/mapbox/streets-v12"
        >
          <NavigationControl position="top-right" />
          
          {selectedLocation && (
            <Marker
              longitude={selectedLocation.longitude}
              latitude={selectedLocation.latitude}
              anchor="bottom"
            >
              <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center text-white cursor-pointer transform hover:scale-110 transition-transform">
                📍
              </div>
            </Marker>
          )}
        </Map>
      </div>
    );
  };

  // Function to get current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocode to get address
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`
          );
          const data = await response.json();
          const address = data.features[0]?.place_name || 'Location found';
          
          setViewState({
            longitude,
            latitude,
            zoom: 14
          });
          setSelectedLocation({ longitude, latitude, address });
          setAddressInput(address);
        } catch (error) {
          console.error('Error getting location details:', error);
          toast.error('Failed to get location details');
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Failed to get your location');
        setIsLoadingLocation(false);
      }
    );
  };

  // Function to search address or zip code
  const searchAddress = async (address) => {
    if (!address.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const location = data.features[0];
        const [longitude, latitude] = location.center;
        
        setViewState({
          longitude,
          latitude,
          zoom: 14
        });
        setSelectedLocation({
          longitude,
          latitude,
          address: location.place_name
        });
        setAddressInput(location.place_name);
      } else {
        toast.error('No results found for this address');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      toast.error('Failed to search address');
    } finally {
      setIsSearching(false);
    }
  };

  const renderLocationStep = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Select Location</h2>
      <p className="text-gray-600">Choose how you want to set the location</p>

      {/* Location Input Options */}
      <div className="space-y-4">
        {/* Current Location Button */}
        <button
          onClick={getCurrentLocation}
          disabled={isLoadingLocation}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
        >
          {isLoadingLocation ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Getting your location...
            </span>
          ) : (
            <>
              <svg className="mr-2 h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Use Current Location
            </>
          )}
        </button>

        {/* Address/Zip Search with Autocomplete */}
        <div className="relative">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={addressInput}
                onChange={(e) => {
                  setAddressInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (suggestions.length > 0) {
                      handleSuggestionSelect(suggestions[0]);
                    } else {
                      searchAddress(addressInput);
                    }
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Search for address, restaurant, or neighborhood"
                className="w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSuggestionSelect(suggestion);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <span className="text-gray-400 text-sm">
                        {suggestion.type === 'poi' ? '🏢' :
                         suggestion.type === 'address' ? '📍' :
                         suggestion.type === 'neighborhood' ? '🏘️' : '📌'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{suggestion.text}</p>
                        <p className="text-xs text-gray-500 truncate">{suggestion.place_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => searchAddress(addressInput)}
              disabled={isSearching || !addressInput.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50"
            >
              {isSearching ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : 'Search'}
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="h-[400px] rounded-lg overflow-hidden shadow-md border border-gray-200">
          {renderMap()}
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Selected Location</h3>
            <p className="mt-1 text-sm text-gray-600">{selectedLocation.address}</p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedLocation}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );

  // Simplified handleCreateRequest function that doesn't require authentication
  const handleCreateRequest = async () => {
    try {
      // Check if we have a selected location
      if (!selectedVenue && !selectedLocation) {
        toast.error('Please select a location on the map');
        return;
      }

      const dateRequest = {
        profile: profile,
        dateDetails: {
          day: selectedDay,
          time: selectedTime,
          activity: selectedActivity,
          venue: selectedVenue ? selectedVenue.name : 'Custom Location',
          location: selectedVenue ? selectedVenue.address : 'Selected on map',
          coordinates: selectedVenue ? selectedVenue.coordinates : [selectedLocation.longitude, selectedLocation.latitude]
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Store in localStorage
      const existingRequests = JSON.parse(localStorage.getItem('dateRequests') || '[]');
      existingRequests.push(dateRequest);
      localStorage.setItem('dateRequests', JSON.stringify(existingRequests));

      toast.success('Date request sent successfully!');
      navigate(returnTo, { replace: true });
    } catch (error) {
      console.error('Error creating date request:', error);
      toast.error('Failed to send date request. Please try again.');
    }
  };

  // Render different views based on request status
  if (dateRequest?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Date Request Declined</h2>
            <p className="text-gray-600 mb-6">This date request has been declined.</p>
            <button
              onClick={() => navigate('/matches')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
            >
              Back to Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (dateRequest?.status === 'confirmed') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Date Confirmed!</h2>
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-green-800">
                  Your date is set for {dateRequest.dateDetails.day} at {dateRequest.dateDetails.time}
                </p>
                <p className="text-green-700 mt-2">
                  Activity: {dateRequest.dateDetails.activity}
                </p>
                {dateRequest.dateDetails.message && (
                  <p className="text-green-700 mt-2 italic">
                    "{dateRequest.dateDetails.message}"
                  </p>
                )}
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-800 font-medium">Confirmation Code</p>
                <p className="text-blue-900 text-2xl font-mono mt-2">
                  {dateRequest.dateDetails.confirmationCode}
                </p>
                <p className="text-blue-700 text-sm mt-2">
                  Share this code with your date after meeting to confirm the date happened!
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/matches')}
              className="w-full mt-6 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
            >
              Back to Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="min-h-screen bg-gray-50 p-6"
    >
      <div className="max-w-lg mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {Object.values(STEPS).map((step, index) => (
              <div
                key={step}
                className={`flex items-center ${
                  index < Object.values(STEPS).indexOf(currentStep)
                    ? 'text-rose-500'
                    : index === Object.values(STEPS).indexOf(currentStep)
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium">
                  {index + 1}
                </div>
                {index < Object.values(STEPS).length - 1 && (
                  <div className="hidden sm:block w-24 h-0.5 mx-2 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {currentStep === STEPS.DAY && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Select Day</h3>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS.map(day => {
                    const hasAvailability = overlappingSlots[day]?.length > 0;
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={!hasAvailability}
                        onClick={() => setSelectedDay(day)}
                        className={`p-3 rounded-lg text-left capitalize ${
                          selectedDay === day
                            ? 'bg-rose-500 text-white'
                            : hasAvailability
                            ? 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentStep === STEPS.TIME && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Select Time</h3>
                <div className="grid grid-cols-1 gap-4">
                  {overlappingSlots[selectedDay]?.map(period => (
                    <div key={period} className="space-y-2">
                      <h4 className="font-medium capitalize">{period}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {TIME_PERIODS[period].map(time => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`p-3 rounded-lg text-left ${
                              selectedTime === time
                                ? 'bg-rose-500 text-white'
                                : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === STEPS.ACTIVITY && (
            <div>
              <h3 className="text-lg font-medium mb-4">Select Activity</h3>
              <div className="grid grid-cols-2 gap-2">
                {profile.activities.map(activity => (
                  <button
                    key={activity}
                    type="button"
                    onClick={() => setSelectedActivity(activity)}
                    className={`p-3 rounded-lg text-left ${
                      selectedActivity === activity
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {activity}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === STEPS.LOCATION && renderLocationStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          {currentStep === STEPS.LOCATION ? (
            <button
              onClick={handleCreateRequest}
              disabled={loading}
              className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Date Request'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === STEPS.DAY && !selectedDay) ||
                (currentStep === STEPS.TIME && !selectedTime) ||
                (currentStep === STEPS.ACTIVITY && !selectedActivity)
              }
              className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
} 