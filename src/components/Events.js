import React, { useState, useEffect } from 'react';
import EventSidebar from './EventSidebar';
import MapView from './MapView';
import { useEvents } from '../contexts/EventContext';

const Events = () => {
  const { events, selectedEvent, addEvent, editEvent, deleteEvent, selectEvent } = useEvents();
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] relative">
      {isPortrait ? (
        <>
          <div className="absolute inset-x-0 top-0 z-30 h-32 bg-white border-b border-gray-200">
            <EventSidebar
              events={events}
              onAddEvent={addEvent}
              onEditEvent={editEvent}
              onDeleteEvent={deleteEvent}
              selectedEvent={selectedEvent}
              onEventSelect={selectEvent}
              isPortrait={isPortrait}
            />
          </div>
          <div className="absolute inset-0 z-10">
            <MapView 
              events={events} 
              selectedEvent={selectedEvent}
              onEventSelect={selectEvent}
            />
          </div>
        </>
      ) : (
        <div className="h-full flex">
          <div className="w-[420px] h-full flex-shrink-0 relative z-30">
            <EventSidebar
              events={events}
              onAddEvent={addEvent}
              onEditEvent={editEvent}
              onDeleteEvent={deleteEvent}
              selectedEvent={selectedEvent}
              onEventSelect={selectEvent}
              isPortrait={isPortrait}
            />
          </div>
          <div className="flex-1 relative z-20">
            <MapView 
              events={events} 
              selectedEvent={selectedEvent}
              onEventSelect={selectEvent}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Events; 