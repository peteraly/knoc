import React, { useState, useEffect, useCallback } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import LocationSearch from './LocationSearch';
import 'mapbox-gl/dist/mapbox-gl.css';
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useEvents } from '../contexts/EventContext';
import { classNames } from '../utils/classNames';
import { NavigationControl } from 'react-map-gl';

// Get the Mapbox token from environment variables
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Default coordinates (San Francisco)
const DEFAULT_COORDINATES = [-122.4194, 37.7749];

const MapView = ({ selectedCategories = [], onEventSelect, timelineView, selectedDate, onTimelineChange }) => {
  const { events, eventCategories, isUserAttending } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [mapError, setMapError] = useState(false);
  const [viewport, setViewport] = useState({
    longitude: DEFAULT_COORDINATES[0],
    latitude: DEFAULT_COORDINATES[1],
    zoom: 12.5
  });
  
  const [popupInfo, setPopupInfo] = useState(null);

  // Filter events based on selected categories
  const filteredEvents = events.filter(event => 
    selectedCategories.length === 0 || selectedCategories.includes(event.category)
  );

  // Get category info for an event
  const getCategoryInfo = (event) => {
    const category = eventCategories?.find(c => c.id === event.category);
    return {
      emoji: category?.emoji || '📍',
      color: category?.color || 'rgb(244, 63, 94)', // rose-500
      hoverColor: category?.hoverColor || 'rgb(225, 29, 72)' // rose-600
    };
  };

  // Handle location search selection
  const handleLocationSelect = useCallback((location) => {
    setViewport({
      latitude: location.coordinates.lat,
      longitude: location.coordinates.lng,
      zoom: 14,
      transitionDuration: 1000
    });
  }, []);

  // Filter events based on map bounds
  const filterEventsByBounds = useCallback((bounds) => {
    if (!bounds) return events;
    return events.filter(event => {
      const lat = event.coordinates.lat;
      const lng = event.coordinates.lng;
      return (
        lat >= bounds.getSouth() &&
        lat <= bounds.getNorth() &&
        lng >= bounds.getWest() &&
        lng <= bounds.getEast()
      );
    });
  }, [events]);

  // Update events when map moves
  const handleMapMove = useCallback(({ viewState, target }) => {
    setViewport(viewState);
    const bounds = target.getBounds();
    const visibleEvents = filterEventsByBounds(bounds);
    // You can pass these visible events to a parent component if needed
  }, [filterEventsByBounds]);

  // Filter events based on selected timeline
  const getFilteredEvents = () => {
    let start, end;

    switch (timelineView) {
      case 'week':
        start = startOfWeek(selectedDate);
        end = endOfWeek(selectedDate);
        break;
      case 'month':
        start = startOfMonth(selectedDate);
        end = endOfMonth(selectedDate);
        break;
      default: // day
        start = startOfDay(selectedDate);
        end = endOfDay(selectedDate);
    }

    return events.filter(event => {
      const eventDate = new Date(event.date);
      return isWithinInterval(eventDate, { start, end });
    });
  };

  // Format date range for display
  const getDateRangeText = () => {
    try {
      // Ensure selectedDate is a valid Date object
      const date = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      switch (timelineView) {
        case 'week':
          const weekStart = startOfWeek(date);
          const weekEnd = endOfWeek(date);
          return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
        case 'month':
          return format(date, 'MMMM yyyy');
        default:
          return format(date, 'EEEE, MMMM d');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleMarkerClick = (event) => {
    setSelectedEvent(event);
    if (onEventSelect) {
      onEventSelect(event);
    }
  };

  return (
    <div className="relative h-screen">
      <div className="absolute top-4 left-4 right-4 z-10">
        <LocationSearch onLocationSelect={handleLocationSelect} />
      </div>

      <Map
        {...viewport}
        onMove={handleMapMove}
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
        {getFilteredEvents().map(event => {
          const isAttending = isUserAttending(event.id);
          // Ensure coordinates are valid numbers
          const longitude = typeof event.coordinates === 'object' ? event.coordinates.lng : event.coordinates[0];
          const latitude = typeof event.coordinates === 'object' ? event.coordinates.lat : event.coordinates[1];
          
          // Skip invalid coordinates
          if (isNaN(longitude) || isNaN(latitude)) {
            console.warn(`Invalid coordinates for event ${event.id}:`, event.coordinates);
            return null;
          }

          return (
            <Marker
              key={event.id}
              longitude={longitude}
              latitude={latitude}
              anchor="center"
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedEvent(selectedEvent?.id === event.id ? null : event);
              }}
            >
              <div
                className={`event-marker ${isAttending ? 'attending' : ''}`}
                onMouseEnter={() => setHoveredEvent(event)}
                onMouseLeave={() => setHoveredEvent(null)}
                style={{
                  padding: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(244, 63, 94, 0.75)',
                  color: '#ffffff',
                  boxShadow: isAttending
                    ? '0 0 15px rgba(99, 102, 241, 0.7)' // indigo-500 with glow
                    : '0 2px 8px rgba(0,0,0,0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  border: isAttending
                    ? '3px solid rgb(99, 102, 241)' // indigo-500
                    : '3px solid white',
                  transition: 'transform 0.2s ease-in-out, background-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  transform: (hoveredEvent?.id === event.id || selectedEvent?.id === event.id) ? 'scale(1.1)' : 'scale(1)',
                  backgroundColor: (hoveredEvent?.id === event.id || selectedEvent?.id === event.id) ? 'rgba(244, 63, 94, 0.85)' : 'rgba(244, 63, 94, 0.75)'
                }}
              >
                <div className="text-xl">{event.emoji}</div>
              </div>
            </Marker>
          );
        })}

        {selectedEvent && (
          <Popup
            latitude={selectedEvent.coordinates.lat}
            longitude={selectedEvent.coordinates.lng}
            anchor="bottom"
            onClose={() => setSelectedEvent(null)}
            closeButton={true}
            closeOnClick={false}
            className="rounded-lg shadow-lg"
          >
            <div className="p-2">
              <h3 className="text-lg font-semibold">
                {getCategoryInfo(selectedEvent).emoji} {selectedEvent.title}
              </h3>
              <p className="text-sm text-gray-600">{selectedEvent.description}</p>
              <div className="mt-2 text-sm text-gray-500">
                <p>{selectedEvent.date} at {selectedEvent.time}</p>
                <p>{selectedEvent.location}</p>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Timeline controls */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg z-10 flex items-center space-x-4">
        <button
          onClick={() => onTimelineChange(timelineView, addDays(selectedDate, -1))}
          className="text-gray-600 hover:text-gray-900"
        >
          ←
        </button>
        
        <div className="flex items-center space-x-2">
          {['day', 'week', 'month'].map(option => (
            <button
              key={option}
              onClick={() => onTimelineChange(option, selectedDate)}
              className={`
                px-3 py-1 rounded-full text-sm
                ${timelineView === option
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        <span className="font-medium min-w-[150px] text-center">
          {getDateRangeText()}
        </span>

        <button
          onClick={() => onTimelineChange(timelineView, addDays(selectedDate, 1))}
          className="text-gray-600 hover:text-gray-900"
        >
          →
        </button>
      </div>

      {/* Event count badge */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md z-10">
        <span className="text-sm text-gray-600">
          {getFilteredEvents().length} events {timelineView === 'day' ? 'today' : `this ${timelineView}`}
        </span>
      </div>
    </div>
  );
};

export default MapView; 