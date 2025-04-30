import React, { useState, useEffect, useCallback } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import LocationSearch from './LocationSearch';
import 'mapbox-gl/dist/mapbox-gl.css';
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useEvents } from '../contexts/EventContext';
import { classNames } from '../utils/classNames';

// Get the Mapbox token from environment variables
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Default coordinates (San Francisco)
const DEFAULT_COORDINATES = [-122.4194, 37.7749];

const MapView = ({ selectedCategories = [], onEventSelect, timelineView, selectedDate, onTimelineChange }) => {
  const { events, eventCategories } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewport, setViewport] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    zoom: 12
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
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 right-4 z-10">
        <LocationSearch onLocationSelect={handleLocationSelect} />
      </div>

      <Map
        {...viewport}
        onMove={handleMapMove}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
      >
        {filteredEvents.map(event => {
          const isSelected = selectedEvent?.id === event.id;
          const categoryInfo = getCategoryInfo(event);
          
          return (
            <Marker
              key={event.id}
              latitude={event.coordinates.lat}
              longitude={event.coordinates.lng}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(event);
              }}
            >
              <div
                className={classNames(
                  'relative flex items-center justify-center',
                  'w-10 h-10 rounded-full border-2 border-white shadow-lg',
                  'transform transition-all duration-300',
                  isSelected
                    ? 'scale-125 -translate-y-1'
                    : 'hover:scale-110',
                )}
                style={{
                  backgroundColor: isSelected ? categoryInfo.hoverColor : categoryInfo.color
                }}
              >
                <span className="text-lg">{categoryInfo.emoji}</span>
                {isSelected && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 
                                w-3 h-3 rotate-45 bg-inherit" />
                )}
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