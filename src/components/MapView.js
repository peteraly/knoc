import React, { useState, useRef, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { format, addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

// Get the Mapbox token from environment variables
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Default coordinates (San Francisco)
const DEFAULT_COORDINATES = [-122.4194, 37.7749];

// Timeline options
const TIMELINE_OPTIONS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month'
};

const MapView = ({ events, selectedEvent, onEventSelect }) => {
  const [viewport, setViewport] = useState({
    latitude: DEFAULT_COORDINATES[1],
    longitude: DEFAULT_COORDINATES[0],
    zoom: 11,
    bearing: 0,
    pitch: 0
  });
  
  const [popupInfo, setPopupInfo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [timelineView, setTimelineView] = useState(TIMELINE_OPTIONS.DAY);

  // Filter events based on selected timeline
  const getFilteredEvents = () => {
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

  // Handle marker click
  const handleMarkerClick = (event) => {
    setPopupInfo(event);
    onEventSelect(event);
  };

  return (
    <div className="absolute inset-0">
      <Map
        {...viewport}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onMove={evt => setViewport(evt.viewport)}
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

        {getFilteredEvents().map((event) => (
          <Marker
            key={event.id}
            latitude={event.coordinates[1]}
            longitude={event.coordinates[0]}
            anchor="bottom"
            onClick={e => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(event);
            }}
          >
            <div
              className={`
                flex items-center justify-center transition-all duration-300 transform
                ${selectedEvent?.id === event.id ? 
                  'scale-125 -translate-y-1 z-10' : 
                  'hover:scale-110'
                }
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  border-2 shadow-lg cursor-pointer
                  ${selectedEvent?.id === event.id ? 
                    'border-white bg-rose-500 shadow-rose-200' : 
                    'border-white bg-rose-400 hover:bg-rose-500'
                  }
                `}
              >
                <span className="text-xl">{event.emoji}</span>
              </div>
              {selectedEvent?.id === event.id && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-rose-500 rotate-45" />
              )}
            </div>
          </Marker>
        ))}

        {popupInfo && (
          <Popup
            anchor="bottom"
            latitude={popupInfo.coordinates[1]}
            longitude={popupInfo.coordinates[0]}
            onClose={() => setPopupInfo(null)}
            offset={25}
          >
            <div className="p-3">
              <h3 className="text-lg font-semibold mb-2">{popupInfo.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{popupInfo.description}</p>
              <p className="text-sm text-gray-500">
                {format(new Date(popupInfo.date), 'MMM d')} at {popupInfo.time}
              </p>
              <p className="text-sm text-gray-500">{popupInfo.location}</p>
            </div>
          </Popup>
        )}
      </Map>

      {/* Timeline controls */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg z-10 flex items-center space-x-4">
        <button
          onClick={() => setSelectedDate(prev => addDays(prev, -1))}
          className="text-gray-600 hover:text-gray-900"
        >
          ←
        </button>
        
        <div className="flex items-center space-x-2">
          {Object.values(TIMELINE_OPTIONS).map(option => (
            <button
              key={option}
              onClick={() => setTimelineView(option)}
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
    </div>
  );
};

export default MapView; 