import React, { useState, useEffect } from 'react';
import { useEvents } from '../contexts/EventContext';
import MapView from './MapView';
import EventSidebar from './EventSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { events, handleAddEvent } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <div className="h-screen w-full bg-gray-100 flex">
      {/* Map Section - Takes up full width on mobile, shares space with sidebar on desktop */}
      <div className="flex-1 relative h-full">
        <div className="absolute inset-0">
          <MapView
            events={events}
            selectedEvent={selectedEvent}
            onEventSelect={handleEventSelect}
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
        />
      </div>

      {/* Mobile Bottom Sheet - Only shown on mobile */}
      {isMobile && (
        <AnimatePresence>
          {isBottomSheetOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-25 z-30"
                onClick={() => setIsBottomSheetOpen(false)}
              />

              {/* Bottom Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-xl shadow-lg"
                style={{ maxHeight: '85vh' }}
              >
                {/* Handle and close button */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="w-8 h-1 bg-gray-300 rounded-full mx-auto" />
                  <button
                    onClick={() => setIsBottomSheetOpen(false)}
                    className="absolute right-4 p-2 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 4rem)' }}>
                  <EventSidebar
                    events={events}
                    selectedEvent={selectedEvent}
                    onEventSelect={handleEventSelect}
                    onAddEvent={handleAddEvent}
                  />
                </div>
              </motion.div>
            </>
          )}

          {!isBottomSheetOpen && (
            <button
              onClick={() => setIsBottomSheetOpen(true)}
              className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg z-40 flex items-center space-x-2"
            >
              <ChevronUpIcon className="w-5 h-5" />
              <span>View Events</span>
            </button>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Dashboard; 