import React, { useState, useEffect } from 'react';
import EventSidebar from './EventSidebar';
import MapView from './MapView';
import { useEvents } from '../contexts/EventContext';
import { motion, AnimatePresence } from 'framer-motion';
import { startOfDay } from 'date-fns';

const TIMELINE_OPTIONS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month'
};

const Events = () => {
  const { events, selectedEvent, addEvent, editEvent, deleteEvent, selectEvent } = useEvents();
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [timelineView, setTimelineView] = useState(TIMELINE_OPTIONS.DAY);

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTimelineChange = (view, date) => {
    setTimelineView(view);
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] relative overflow-hidden">
      {/* Map View - Always Full Screen */}
      <div className="absolute inset-0">
        <MapView 
          events={events} 
          selectedEvent={selectedEvent}
          onEventSelect={selectEvent}
          timelineView={timelineView}
          selectedDate={selectedDate}
          onTimelineChange={handleTimelineChange}
        />
      </div>

      {/* Events Panel */}
      <AnimatePresence>
        {isPortrait ? (
          // Bottom Sheet in Portrait Mode
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: isBottomSheetOpen ? '0%' : '90%' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="absolute inset-x-0 bottom-0 z-30 bg-white rounded-t-xl shadow-lg"
            style={{ height: '75vh', touchAction: 'none' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                setIsBottomSheetOpen(false);
              } else if (info.offset.y < -100) {
                setIsBottomSheetOpen(true);
              }
            }}
          >
            {/* Drag Handle */}
            <div className="w-full h-1.5 flex justify-center items-center py-4">
              <div className="w-12 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="overflow-y-auto h-full pb-safe">
              <EventSidebar
                events={events}
                onAddEvent={addEvent}
                onEditEvent={editEvent}
                onDeleteEvent={deleteEvent}
                selectedEvent={selectedEvent}
                onEventSelect={selectEvent}
                isPortrait={isPortrait}
                timelineView={timelineView}
                selectedDate={selectedDate}
                onTimelineChange={handleTimelineChange}
              />
            </div>
          </motion.div>
        ) : (
          // Side Panel in Landscape Mode
          <motion.div
            initial={{ x: -420 }}
            animate={{ x: 0 }}
            exit={{ x: -420 }}
            className="absolute left-0 top-0 bottom-0 w-[420px] z-30 bg-white shadow-lg"
          >
            <EventSidebar
              events={events}
              onAddEvent={addEvent}
              onEditEvent={editEvent}
              onDeleteEvent={deleteEvent}
              selectedEvent={selectedEvent}
              onEventSelect={selectEvent}
              isPortrait={isPortrait}
              timelineView={timelineView}
              selectedDate={selectedDate}
              onTimelineChange={handleTimelineChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Events; 