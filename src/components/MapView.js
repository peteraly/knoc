import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

// Get the Mapbox token from environment variables
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Validate token format
const isValidToken = MAPBOX_TOKEN && MAPBOX_TOKEN.startsWith('pk.');
if (!isValidToken) {
  console.error('Invalid or missing Mapbox token. Please check your .env file.');
}

// Set the token for mapboxgl
mapboxgl.accessToken = MAPBOX_TOKEN;

// Default coordinates (San Francisco)
const DEFAULT_COORDINATES = [-122.4194, 37.7749];

// Timeline options
const TIMELINE_OPTIONS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month'
};

const MapView = ({ events, selectedEvent, onEventSelect }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef(new Map());
  const [mapInitialized, setMapInitialized] = useState(false);
  const [error, setError] = useState(!isValidToken);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [timelineView, setTimelineView] = useState(TIMELINE_OPTIONS.DAY);

  const mapStyles = {
    height: "200px",
    width: "100%",
    borderRadius: "8px",
  };

  // Filter events based on selected timeline
  const getFilteredEvents = () => {
    const today = new Date();
    let start, end;

    switch (timelineView) {
      case TIMELINE_OPTIONS.WEEK:
        start = startOfWeek(selectedDate);
        end = endOfWeek(selectedDate);
        break;
      case TIMELINE_OPTIONS.MONTH:
        start = startOfMonth(selectedDate);
        end = endOfMonth(selectedDate);
        break;
      default: // DAY
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
    switch (timelineView) {
      case TIMELINE_OPTIONS.WEEK:
        const weekStart = startOfWeek(selectedDate);
        const weekEnd = endOfWeek(selectedDate);
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
      case TIMELINE_OPTIONS.MONTH:
        return format(selectedDate, 'MMMM yyyy');
      default:
        return format(selectedDate, 'EEEE, MMMM d');
    }
  };

  // Fit map bounds
  const fitMapBounds = () => {
    if (!map.current || !events.length) return;

    const bounds = new mapboxgl.LngLatBounds();
    getFilteredEvents().forEach(event => {
      if (event.coordinates?.length === 2) {
        bounds.extend(event.coordinates);
      }
    });

    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 12
      });
    }
  };

  // Initialize map
  useEffect(() => {
    if (!isValidToken) {
      setError(true);
      return;
    }

    if (map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: DEFAULT_COORDINATES,
        zoom: 9
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError(true);
      });

      map.current.on('load', () => {
        setMapInitialized(true);
        fitMapBounds();
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setError(true);
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when events or timeline changes
  useEffect(() => {
    if (!map.current || !mapInitialized || error) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    getFilteredEvents().forEach(event => {
      if (!event.coordinates || !Array.isArray(event.coordinates) || event.coordinates.length !== 2) {
        console.warn(`Invalid coordinates for event: ${event.id}`);
        return;
      }

      // Create marker element
      const el = document.createElement('div');
      el.className = 'event-marker';
      el.style.cssText = `
        background-color: ${selectedEvent?.id === event.id ? '#F43F5E' : '#F87171'};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        cursor: pointer;
        transition: background-color 0.2s ease-in-out;
        position: relative;
      `;
      el.innerHTML = `<span style="font-size: 20px;">${event.emoji}</span>`;

      // Create popup
      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        offset: 25,
        anchor: 'bottom',
        className: 'event-popup'
      })
      .setHTML(`
        <div class="p-3">
          <h3 class="text-lg font-semibold mb-2">${event.title}</h3>
          <p class="text-sm text-gray-600 mb-2">${event.description}</p>
          <p class="text-sm text-gray-500">${format(new Date(event.date), 'MMM d')} at ${event.time}</p>
          <p class="text-sm text-gray-500">${event.location}</p>
        </div>
      `);

      // Create marker
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center'
      })
      .setLngLat(event.coordinates)
      .addTo(map.current);

      // Add click handler
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onEventSelect(event);

        // Update all marker styles
        markersRef.current.forEach((m, eventId) => {
          const markerEl = m.getElement();
          if (eventId === event.id) {
            markerEl.style.backgroundColor = '#F43F5E';
            markerEl.style.zIndex = '1';
            m.setPopup(popup);
            popup.addTo(map.current);
          } else {
            markerEl.style.backgroundColor = '#F87171';
            markerEl.style.zIndex = '0';
            if (m.getPopup()) {
              m.getPopup().remove();
            }
          }
        });
      });

      // Store marker reference
      markersRef.current.set(event.id, marker);
    });

    // Fit bounds after adding all markers
    fitMapBounds();
  }, [events, selectedEvent, onEventSelect, mapInitialized, error, selectedDate, timelineView]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Map configuration error</p>
          <p className="text-sm text-gray-500">
            {MAPBOX_TOKEN ? 'Invalid token format' : 'Token not found in .env'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Timeline controls */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg z-10 flex items-center space-x-4">
        <button
          onClick={() => setSelectedDate(prev => addDays(prev, -1))}
          className="text-gray-600 hover:text-gray-900"
        >
          ←
        </button>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTimelineView(TIMELINE_OPTIONS.DAY)}
            className={`px-3 py-1 rounded-full text-sm ${
              timelineView === TIMELINE_OPTIONS.DAY
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setTimelineView(TIMELINE_OPTIONS.WEEK)}
            className={`px-3 py-1 rounded-full text-sm ${
              timelineView === TIMELINE_OPTIONS.WEEK
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimelineView(TIMELINE_OPTIONS.MONTH)}
            className={`px-3 py-1 rounded-full text-sm ${
              timelineView === TIMELINE_OPTIONS.MONTH
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
        </div>

        <span className="font-medium min-w-[150px] text-center">
          {getDateRangeText()}
        </span>

        <button
          onClick={() => setSelectedDate(prev => addDays(prev, 1))}
          className="text-gray-600 hover:text-gray-900"
        >
          →
        </button>
      </div>

      {/* Event count badge */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md z-10">
        <span className="text-sm text-gray-600">
          {getFilteredEvents().length} events {timelineView === TIMELINE_OPTIONS.DAY ? 'today' : `this ${timelineView}`}
        </span>
      </div>

      <div 
        ref={mapContainer} 
        className="h-full w-full"
        style={{ position: 'relative' }}
      />
    </div>
  );
};

export default MapView; 