import React, { useState, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import { format, addDays, startOfDay } from 'date-fns';
import 'mapbox-gl/dist/mapbox-gl.css';
import { EVENTS } from '../data/events';

// Get the Mapbox token from environment variables
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Validate token format
const isValidToken = MAPBOX_TOKEN && MAPBOX_TOKEN.startsWith('pk.');
if (!isValidToken) {
  console.warn('Warning: Invalid or missing Mapbox token. Please check your .env file and ensure REACT_APP_MAPBOX_TOKEN is set.');
}

// Default coordinates (Washington DC)
const DEFAULT_COORDINATES = [-77.0369, 38.9072];

export default function EventsMap() {
  const [viewport, setViewport] = useState({
    longitude: DEFAULT_COORDINATES[0],
    latitude: DEFAULT_COORDINATES[1],
    zoom: 12.5
  });
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [userLocation, setUserLocation] = useState(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [mapError, setMapError] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!isValidToken) {
      setMapError(true);
      return;
    }

    if (viewport.longitude === DEFAULT_COORDINATES[0] && viewport.latitude === DEFAULT_COORDINATES[1] && viewport.zoom === 12.5) {
      return; // already initialized
    }

    try {
      setViewport(prev => ({
        ...prev,
        longitude: DEFAULT_COORDINATES[0],
        latitude: DEFAULT_COORDINATES[1],
        zoom: 12.5
      }));
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(true);
    }
  }, []);

  // Request user location
  useEffect(() => {
    if (navigator.geolocation && !mapError) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(newLocation);
          setViewport(prev => ({
            ...prev,
            latitude: newLocation.latitude,
            longitude: newLocation.longitude
          }));
        },
        () => {
          console.log('Using default DC location');
        }
      );
    }
  }, [mapError]);

  // Handle zip code submit
  const handleZipCodeSubmit = async (e) => {
    e.preventDefault();
    setShowLocationPrompt(false);
    
    if (viewport.longitude === DEFAULT_COORDINATES[0] && viewport.latitude === DEFAULT_COORDINATES[1]) {
      setViewport(prev => ({
        ...prev,
        longitude: DEFAULT_COORDINATES[0],
        latitude: DEFAULT_COORDINATES[1],
        zoom: 12.5
      }));
    }
  };

  if (!isValidToken || mapError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="text-4xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Map Configuration Error</h2>
          <p className="text-gray-600 mb-4">
            Please check your .env file and ensure REACT_APP_MAPBOX_TOKEN is set with a valid public access token (pk.*).
          </p>
          <p className="text-sm text-gray-500">
            Current token: {MAPBOX_TOKEN ? `${MAPBOX_TOKEN.substring(0, 8)}...` : 'Not set'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      {showLocationPrompt && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Enter Your Location</h3>
            <form onSubmit={handleZipCodeSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Enter ZIP code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                pattern="[0-9]{5}"
                maxLength="5"
              />
              <button
                type="submit"
                className="w-full bg-rose-500 text-white py-2 rounded hover:bg-rose-600"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg z-10 flex items-center space-x-4">
        <button
          onClick={() => setSelectedDate(prev => addDays(prev, -1))}
          className="text-gray-600 hover:text-gray-900"
        >
          ←
        </button>
        <span className="font-medium">
          {format(selectedDate, 'EEEE, MMMM d')}
        </span>
        <button
          onClick={() => setSelectedDate(prev => addDays(prev, 1))}
          className="text-gray-600 hover:text-gray-900"
        >
          →
        </button>
      </div>

      <Map
        {...viewport}
        onMove={evt => setViewport(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

        {/* User location marker */}
        {userLocation && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            anchor="center"
          >
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg pulse-animation" />
          </Marker>
        )}

        {/* Event markers */}
        {EVENTS.map(event => (
          <Marker
            key={event.id}
            longitude={event.coordinates[0]}
            latitude={event.coordinates[1]}
            anchor="center"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setSelectedEvent(selectedEvent?.id === event.id ? null : event);
            }}
          >
            <div
              className="event-marker"
              onMouseEnter={() => setHoveredEvent(event)}
              onMouseLeave={() => setHoveredEvent(null)}
              style={{
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: 'rgba(244, 63, 94, 0.75)',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                border: '3px solid white',
                transition: 'transform 0.2s ease-in-out, background-color 0.2s ease-in-out',
                transform: (hoveredEvent?.id === event.id || selectedEvent?.id === event.id) ? 'scale(1.1)' : 'scale(1)',
                backgroundColor: (hoveredEvent?.id === event.id || selectedEvent?.id === event.id) ? 'rgba(244, 63, 94, 0.85)' : 'rgba(244, 63, 94, 0.75)'
              }}
            >
              <div className="text-xl">{event.emoji}</div>
            </div>
          </Marker>
        ))}

        {/* Popup for hovered/selected event */}
        {(hoveredEvent || selectedEvent) && (
          <Popup
            longitude={hoveredEvent?.coordinates[0] || selectedEvent.coordinates[0]}
            latitude={hoveredEvent?.coordinates[1] || selectedEvent.coordinates[1]}
            anchor="bottom"
            offset={[0, -15]}
            closeButton={false}
            closeOnClick={false}
            onClose={() => {
              setHoveredEvent(null);
              setSelectedEvent(null);
            }}
            className="event-popup"
          >
            <div className="p-3 min-w-[200px] max-w-[300px]">
              <h3 className="text-lg font-semibold mb-2">
                {hoveredEvent?.title || selectedEvent.title}
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                {hoveredEvent?.description || selectedEvent.description}
              </p>
              <div className="text-sm text-gray-500">
                <p className="mb-1">{hoveredEvent?.time || selectedEvent.time}</p>
                <p>{hoveredEvent?.location || selectedEvent.location}</p>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      <style>{`
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }

        .mapboxgl-popup-content {
          padding: 0 !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }

        .mapboxgl-popup-tip {
          border-top-color: white !important;
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));
        }
      `}</style>
    </div>
  );
} 