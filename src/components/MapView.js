import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Get the Mapbox token from environment variables
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Validate token format
const isValidToken = MAPBOX_TOKEN && MAPBOX_TOKEN.startsWith('pk.');
if (!isValidToken) {
  console.error('Invalid or missing Mapbox token. Please check your .env file and ensure you are using a public token (pk.*)');
}

// Set the token for mapboxgl
mapboxgl.accessToken = MAPBOX_TOKEN;

const MapView = ({ location, title }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [error, setError] = useState(!isValidToken);

  const mapStyles = {
    height: "200px",
    width: "100%",
    borderRadius: "8px",
  };

  // Default to DC if no location provided
  const defaultCenter = location?.longitude && location?.latitude
    ? [location.longitude, location.latitude]
    : [-77.0369, 38.9072];

  useEffect(() => {
    if (!isValidToken) {
      setError(true);
      return;
    }

    if (map.current) return; // Initialize map only once

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: defaultCenter,
        zoom: 15,
        interactive: true
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add marker if location is provided
      if (location) {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = '#F43F5E';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

        marker.current = new mapboxgl.Marker(el)
          .setLngLat(defaultCenter)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<div class="p-2 text-sm">${title || 'Location'}</div>`)
          )
          .addTo(map.current);
      }

      // Error handling
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError(true);
      });

      // Load handling
      map.current.on('load', () => {
        console.log('Map loaded successfully');
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setError(true);
    }

    // Cleanup on unmount
    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [defaultCenter, location, title]);

  // If no valid token or error state, show a placeholder
  if (error) {
    return (
      <div 
        style={{
          ...mapStyles,
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">🗺️</div>
          <p>Map configuration error</p>
          <p className="text-sm mt-1">
            {MAPBOX_TOKEN ? 'Invalid token format' : 'Token not found in .env'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      style={mapStyles}
      className="map-container shadow-md"
    />
  );
};

export default MapView; 