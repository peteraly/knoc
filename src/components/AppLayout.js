import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventContext';
import MapView from './MapView';
import EventCarousel from './EventCarousel';
import UserProfile from './UserProfile';
import Notifications from './Notifications';
import { ChevronUpIcon, BellIcon, UserCircleIcon, MapIcon, SearchIcon } from '@heroicons/react/24/outline';

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { events, selectedEvent } = useEvents();
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [bottomSheetHeight, setBottomSheetHeight] = useState('85%');
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const bottomSheetRef = useRef(null);
  const dragThreshold = 50;
  
  // Motion values for smooth animations
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-200, 0, 200], [0.2, 1, 0.2]);
  const scale = useTransform(y, [-200, 0, 200], [0.8, 1, 0.8]);
  const springY = useSpring(y, { stiffness: 400, damping: 40 });

  // Enhanced gesture handling
  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      const newY = e.touches[0].clientY;
      setCurrentY(newY);
      const delta = newY - startY;
      y.set(delta);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      const dragDistance = currentY - startY;
      if (Math.abs(dragDistance) > dragThreshold) {
        if (dragDistance > 0) {
          // Dragged down
          if (bottomSheetHeight === '90vh') {
            setBottomSheetHeight('50vh');
          } else {
            setIsBottomSheetOpen(false);
          }
        } else {
          // Dragged up
          if (!isBottomSheetOpen || bottomSheetHeight === '50vh') {
            setBottomSheetHeight('90vh');
            setIsBottomSheetOpen(true);
          }
        }
      }
      y.set(0);
      setIsDragging(false);
    }
  };

  // Double tap to expand map
  const [lastTap, setLastTap] = useState(0);
  const handleMapDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      setIsMapFullscreen(!isMapFullscreen);
    }
    setLastTap(now);
  };

  // Search gesture handling
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchY = useMotionValue(0);
  const searchOpacity = useTransform(searchY, [-50, 0], [1, 0]);

  const handleSearchPull = (_, info) => {
    if (info.offset.y < -50) {
      setIsSearchVisible(true);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      {/* Main Map View */}
      <motion.div 
        className="h-full w-full"
        animate={{ scale: isMapFullscreen ? 1.2 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onTap={handleMapDoubleTap}
      >
        <MapView 
          events={events}
          selectedEvent={selectedEvent}
          onEventSelect={(event) => {
            setIsBottomSheetOpen(true);
            navigate(`/events/${event.id}`);
          }}
        />
      </motion.div>

      {/* Search Pull Down */}
      <AnimatePresence>
        {isSearchVisible && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="absolute top-0 left-0 right-0 bg-white shadow-lg rounded-b-xl p-4"
          >
            <div className="flex items-center space-x-4">
              <SearchIcon className="h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search events..."
                className="flex-1 bg-transparent outline-none"
                autoFocus
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSearchVisible(false)}
                className="text-gray-500"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar */}
      <motion.div 
        className="absolute top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm px-4 py-3 flex justify-between items-center"
        style={{ opacity }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onDrag={handleSearchPull}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/profile')}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <UserCircleIcon className="h-6 w-6 text-gray-700" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMapFullscreen(!isMapFullscreen)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <MapIcon className="h-6 w-6 text-gray-700" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-full hover:bg-gray-100 relative"
        >
          <BellIcon className="h-6 w-6 text-gray-700" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </motion.button>
      </motion.div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        <motion.div
          ref={bottomSheetRef}
          initial={{ y: '100%' }}
          animate={{ 
            y: isBottomSheetOpen ? '0%' : '85%',
            height: bottomSheetHeight
          }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          style={{ y: springY }}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-lg"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle */}
          <motion.div 
            className="flex justify-center py-2"
            whileHover={{ scale: 1.1 }}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </motion.div>

          {/* Content Area */}
          <motion.div 
            className="px-4 h-full overflow-y-auto pb-safe"
            style={{ scale }}
          >
            {/* Event Carousel */}
            <div className="mb-6">
              <motion.h2 
                className="text-lg font-semibold mb-3"
                animate={{ opacity: isBottomSheetOpen ? 1 : 0.7 }}
              >
                Upcoming Events
              </motion.h2>
              <EventCarousel 
                events={events}
                onEventSelect={(event) => {
                  setIsBottomSheetOpen(true);
                  setBottomSheetHeight('90vh');
                  navigate(`/events/${event.id}`);
                }}
              />
            </div>

            {/* Dynamic Content Area */}
            <motion.div 
              className="space-y-6"
              animate={{ opacity: isBottomSheetOpen ? 1 : 0.7 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Quick Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/events/new')}
        className="absolute bottom-24 right-4 bg-blue-600 text-white rounded-full p-4 shadow-lg"
        style={{ opacity }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </motion.button>
    </div>
  );
};

export default AppLayout; 