import React, { useState, useEffect } from 'react';
import { useEvents } from '../contexts/EventContext';
import MapView from './MapView';
import EventSidebar from './EventSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { startOfDay } from 'date-fns';

const TIMELINE_OPTIONS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month'
};

const Dashboard = () => {
  const { events, handleAddEvent } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [timelineView, setTimelineView] = useState(TIMELINE_OPTIONS.DAY);

  // Check if screen is mobile with a more tablet-friendly breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Changed to 1024px (lg breakpoint)
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    if (isMobile) {
      setIsBottomSheetOpen(true);
    }
  };

  const handleTimelineChange = (view, date) => {
    setTimelineView(view);
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <div className="h-screen w-full bg-gray-100 flex">
      {/* Map Section - Takes up full width on mobile, shares space with sidebar on desktop */}
      <div className="flex-1 relative h-full">
        <div className="absolute inset-0">
          <MapView
            events={events}
            selectedEvent={selectedEvent}
            onEventSelect={handleEventSelect}
            timelineView={timelineView}
            selectedDate={selectedDate}
            onTimelineChange={handleTimelineChange}
          />
        </div>
      </div>

      {/* Desktop Sidebar - Fixed width, only shown on desktop */}
      <div className="hidden lg:block w-[400px] border-l border-gray-200 flex-shrink-0">
        <EventSidebar
          events={events}
          selectedEvent={selectedEvent}
          onEventSelect={handleEventSelect}
          onAddEvent={handleAddEvent}
          timelineView={timelineView}
          selectedDate={selectedDate}
          onTimelineChange={handleTimelineChange}
        />
      </div>

      {/* Mobile Bottom Sheet - Only shown on mobile */}
      <AnimatePresence>
        {isMobile && isBottomSheetOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setIsBottomSheetOpen(false)}
            />
            
            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg z-50"
              style={{ height: '75vh' }}
            >
              {/* Drag Handle */}
              <div className="w-full h-1.5 flex justify-center items-center py-4">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>

              <div className="overflow-y-auto h-[calc(75vh-2rem)]">
                <EventSidebar
                  events={events}
                  selectedEvent={selectedEvent}
                  onEventSelect={handleEventSelect}
                  onAddEvent={handleAddEvent}
                  timelineView={timelineView}
                  selectedDate={selectedDate}
                  onTimelineChange={handleTimelineChange}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard; 