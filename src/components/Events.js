import React, { useState, useEffect } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from 'react-hot-toast';
import { EVENTS } from '../data/events';

// Get the Mapbox token from environment variables
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

export default function Events() {
  const [viewMode, setViewMode] = useState('map');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewport, setViewport] = useState({
    longitude: -77.0369,
    latitude: 38.9072,
    zoom: 12
  });
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState('Washington, DC');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    // Validate Mapbox token format
    if (MAPBOX_TOKEN && !MAPBOX_TOKEN.startsWith('pk.')) {
      console.error('Invalid Mapbox token format. Please use a public token (pk.*)');
    }
  }, []);

  const handleZipCodeSubmit = async (e) => {
    e.preventDefault();
    if (!zipCode.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${zipCode}.json?country=US&types=postcode&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        setViewport({
          longitude,
          latitude,
          zoom: 12
        });
        setLocationName(data.features[0].place_name);
        toast.success('Location updated!');
      } else {
        toast.error('Invalid zip code. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      toast.error('Error updating location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${position.coords.longitude},${position.coords.latitude}.json?access_token=${MAPBOX_TOKEN}`
          );
          const data = await response.json();

          setViewport({
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            zoom: 12
          });

          if (data.features && data.features.length > 0) {
            setLocationName(data.features[0].place_name);
          }

          toast.success('Location updated to your current position!');
        } catch (error) {
          console.error('Error reverse geocoding:', error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Unable to get your location. Please check your permissions.');
        setLoading(false);
      }
    );
  };

  const renderLocationControls = () => (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex flex-col space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700">Current Location</h3>
          <p className="text-sm text-gray-500">{locationName}</p>
        </div>
        
        <form onSubmit={handleZipCodeSubmit} className="flex space-x-2">
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter ZIP code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
            pattern="[0-9]{5}"
            maxLength={5}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 disabled:opacity-50"
          >
            Update
          </button>
        </form>

        <button
          onClick={handleGetCurrentLocation}
          disabled={loading}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Use My Location</span>
        </button>
      </div>
    </div>
  );

  const renderMap = () => {
    if (!MAPBOX_TOKEN || !MAPBOX_TOKEN.startsWith('pk.')) {
      return (
        <div className="h-[calc(100vh-180px)] w-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Invalid Mapbox token. Please use a public token (pk.*)</p>
        </div>
      );
    }

    return (
      <div className="h-[calc(100vh-180px)] w-full relative">
        <Map
          {...viewport}
          mapboxAccessToken={MAPBOX_TOKEN}
          onMove={evt => setViewport(evt.viewState)}
          style={{width: '100%', height: '100%'}}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onLoad={() => setMapLoaded(true)}
          onClick={() => setSelectedEvent(null)}
        >
          {mapLoaded && EVENTS.map(event => {
            if (!event.coordinates || !Array.isArray(event.coordinates) || event.coordinates.length !== 2) {
              console.warn(`Invalid coordinates for event ${event.id}`);
              return null;
            }
            
            return (
              <Marker
                key={event.id}
                longitude={event.coordinates[0]}
                latitude={event.coordinates[1]}
                anchor="center"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setSelectedEvent(event);
                }}
              >
                <div className="relative group">
                  <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer transform transition-transform group-hover:scale-110">
                    <span className="text-xl">{event.emoji}</span>
                  </div>
                </div>
              </Marker>
            );
          })}

          {selectedEvent && (
            <Popup
              longitude={selectedEvent.coordinates[0]}
              latitude={selectedEvent.coordinates[1]}
              anchor="bottom"
              onClose={() => setSelectedEvent(null)}
              closeOnClick={false}
              className="rounded-lg overflow-hidden"
              maxWidth="300px"
            >
              <div className="p-3">
                <h3 className="text-lg font-semibold mb-1">{selectedEvent.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{selectedEvent.description}</p>
                <div className="text-sm text-gray-500">
                  <p>{selectedEvent.date} at {selectedEvent.time}</p>
                  <p>{selectedEvent.location}</p>
                </div>
                <button
                  className="mt-3 w-full bg-rose-500 text-white px-4 py-2 rounded-md hover:bg-rose-600 transition-colors text-sm"
                  onClick={() => {/* Handle RSVP */}}
                >
                  I'm Interested
                </button>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    );
  };

  const renderList = () => (
    <div className="max-w-2xl mx-auto px-4">
      <div className="grid grid-cols-1 gap-4 py-4">
        {EVENTS.map(event => (
          <div
            key={event.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-start">
                <span className="text-3xl mr-4">{event.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  <p className="text-gray-600 mt-1">{event.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>{event.date} at {event.time}</p>
                    <p>{event.location}</p>
                  </div>
                </div>
              </div>
              <button
                className="mt-3 w-full bg-rose-500 text-white px-4 py-2 rounded-md hover:bg-rose-600 transition-colors"
                onClick={() => {/* Handle RSVP */}}
              >
                I'm Interested
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex flex-col space-y-4">
            {renderLocationControls()}
            <div className="flex justify-center space-x-4">
              <button
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'map'
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setViewMode('map')}
              >
                Map View
              </button>
              <button
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-rose-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setViewMode('list')}
              >
                List View
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'map' ? renderMap() : renderList()}
    </div>
  );
} 