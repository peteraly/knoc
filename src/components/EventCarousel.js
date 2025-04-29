import React, { useRef, useEffect, useState } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import EventCard from './EventCard';

const EventCarousel = ({ title, events, type, onEventSelect }) => {
  const carouselRef = useRef(null);
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate boundaries
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  
  useEffect(() => {
    if (carouselRef.current) {
      const updateDimensions = () => {
        setContainerWidth(carouselRef.current.offsetWidth);
        setContentWidth(carouselRef.current.scrollWidth);
        setCardWidth(carouselRef.current.offsetWidth * 0.7); // 70% of container width
      };
      
      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
    }
  }, [events]);

  // Enhanced motion controls
  const constrainX = useTransform(x, (value) => {
    const minX = -(contentWidth - containerWidth);
    const maxX = 0;
    return Math.max(minX, Math.min(maxX, value));
  });

  const scale = useTransform(
    x,
    [-contentWidth, 0, contentWidth],
    [0.8, 1, 0.8]
  );

  const opacity = useTransform(
    x,
    [-contentWidth, 0, contentWidth],
    [0.5, 1, 0.5]
  );

  const handleDragEnd = (event, info) => {
    const velocity = info.velocity.x;
    const currentX = x.get();
    
    // Enhanced momentum scrolling with snap
    if (Math.abs(velocity) > 100) {
      const projection = currentX + (velocity * 0.2);
      const minX = -(contentWidth - containerWidth);
      const maxX = 0;
      const targetX = Math.max(minX, Math.min(maxX, projection));
      
      // Snap to nearest card
      const snapPoint = Math.round(targetX / cardWidth) * cardWidth;
      
      controls.start({
        x: snapPoint,
        transition: {
          type: "spring",
          velocity: velocity * 0.001,
          stiffness: 400,
          damping: 40
        }
      }).then(() => {
        setActiveIndex(Math.abs(Math.round(snapPoint / cardWidth)));
      });
    } else {
      // Snap to nearest card when dragged slowly
      const snapPoint = Math.round(currentX / cardWidth) * cardWidth;
      controls.start({
        x: snapPoint,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 30
        }
      }).then(() => {
        setActiveIndex(Math.abs(Math.round(snapPoint / cardWidth)));
      });
    }
  };

  const navigateToCard = (index) => {
    const targetX = -(index * cardWidth);
    controls.start({
      x: Math.max(-(contentWidth - containerWidth), Math.min(0, targetX)),
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    });
    setActiveIndex(index);
  };

  // Double tap to expand
  const [lastTap, setLastTap] = useState(0);
  const handleDoubleTap = (event) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      setIsExpanded(!isExpanded);
      event.stopPropagation();
    }
    setLastTap(now);
  };

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <motion.h2 
          className="text-xl font-semibold text-gray-800"
          animate={{ scale: isExpanded ? 1.1 : 1 }}
        >
          {title}
        </motion.h2>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateToCard(Math.max(0, activeIndex - 1))}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigateToCard(Math.min(events.length - 1, activeIndex + 1))}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Next"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <EllipsisHorizontalIcon className="h-5 w-5 text-gray-600" />
          </motion.button>
        </div>
      </div>

      <motion.div 
        ref={carouselRef}
        className="overflow-hidden"
        animate={{
          height: isExpanded ? "auto" : "300px"
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.div
          drag="x"
          dragConstraints={{ left: -(contentWidth - containerWidth), right: 0 }}
          dragElastic={0.2}
          dragMomentum={true}
          onDragEnd={handleDragEnd}
          animate={controls}
          style={{ x: constrainX }}
          className={`flex ${isExpanded ? 'flex-wrap justify-center gap-4' : 'space-x-4'}`}
        >
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              whileHover={{ scale: 1.05, zIndex: 1 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                scale: activeIndex === index ? 1 : 0.95,
                opacity: activeIndex === index ? 1 : 0.8
              }}
              className={`${isExpanded ? 'w-full md:w-1/2 lg:w-1/3' : 'flex-shrink-0 w-72'}`}
              style={{ 
                opacity: isExpanded ? 1 : opacity,
                scale: isExpanded ? 1 : scale
              }}
              onClick={() => onEventSelect(event)}
              onTap={handleDoubleTap}
            >
              <EventCard 
                event={event} 
                type={type}
                isActive={activeIndex === index}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Progress Indicators */}
      {!isExpanded && (
        <div className="flex justify-center mt-4 gap-2">
          {events.map((_, index) => (
            <motion.div
              key={index}
              className="w-2 h-2 rounded-full bg-gray-300 cursor-pointer"
              animate={{
                scale: activeIndex === index ? 1.2 : 1,
                backgroundColor: activeIndex === index ? "#3B82F6" : "#D1D5DB"
              }}
              whileHover={{ scale: 1.2 }}
              onClick={() => navigateToCard(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventCarousel; 