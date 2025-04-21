import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TIME_PERIODS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening'
};

const INTERACTION_CONFIG = {
  autoSkipDelay: 60000, // 60 seconds of no interaction
  fadeOutDuration: 500 // ms for fade out animation
};

const THEME = {
  primary: 'from-rose-400',
  secondary: 'from-indigo-900',
  accent: 'from-purple-600',
  overlay: 'rgba(23, 25, 35, 0.85)',
  blur: '12px'
};

// Define base layers that are always shown
const BASE_LAYERS = [
  { id: 'info', label: 'Basic Info', icon: '👤' },
  { id: 'photo', label: 'Photos', icon: '📷' }
];

// Availability layer that will be conditionally added
const AVAILABILITY_LAYER = { id: 'availability', label: 'Schedule', icon: '📅' };

export default function DiscoveryProfile({ profile, onSkip, onProposeDate, isLastProfile }) {
  const [holdProgress, setHoldProgress] = useState(0);
  const [focusedLayer, setFocusedLayer] = useState(null);
  const [activeLayer, setActiveLayer] = useState('photo');
  const [isLeaving, setIsLeaving] = useState(false);
  const [showEndMessage, setShowEndMessage] = useState(false);
  
  const holdTimerRef = useRef(null);
  const autoSkipTimerRef = useRef(null);
  const isHoldingRef = useRef(false);
  const containerRef = useRef(null);
  const lastInteractionRef = useRef(Date.now());

  // Determine if we should show the availability layer
  const shouldShowAvailability = profile?.isMatch && profile?.isDateScheduling;
  
  // Create the layers array based on conditions
  const LAYERS = useMemo(() => {
    return shouldShowAvailability 
      ? [...BASE_LAYERS, AVAILABILITY_LAYER] 
      : BASE_LAYERS;
  }, [shouldShowAvailability]);

  // Reset auto-skip timer on any interaction
  const resetAutoSkipTimer = () => {
    lastInteractionRef.current = Date.now();
    if (autoSkipTimerRef.current) {
      clearTimeout(autoSkipTimerRef.current);
    }
    if (!isLastProfile && profile) {
      autoSkipTimerRef.current = setTimeout(() => {
        handleAutoSkip();
      }, INTERACTION_CONFIG.autoSkipDelay);
    }
  };

  // Handle auto-skip when timer expires
  const handleAutoSkip = () => {
    if (isLastProfile) {
      setShowEndMessage(true);
      return;
    }
    
    setIsLeaving(true);
    setTimeout(() => {
      onSkip(profile);
      setIsLeaving(false);
    }, INTERACTION_CONFIG.fadeOutDuration);
  };

  // Setup auto-skip timer and cleanup
  useEffect(() => {
    if (!profile) {
      return () => {
        if (autoSkipTimerRef.current) {
          clearTimeout(autoSkipTimerRef.current);
        }
      };
    }
    
    resetAutoSkipTimer();
    return () => {
      if (autoSkipTimerRef.current) {
        clearTimeout(autoSkipTimerRef.current);
      }
    };
  }, [profile, isLastProfile]);

  // Reset active layer when availability status changes
  useEffect(() => {
    if (!shouldShowAvailability && activeLayer === 'availability') {
      setActiveLayer('photo');
    }
  }, [shouldShowAvailability, activeLayer]);

  if (!profile) return null;

  const handleTouchStart = () => {
    if (!profile || isLastProfile) return;
    
    isHoldingRef.current = true;
    holdTimerRef.current = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          clearInterval(holdTimerRef.current);
          return 100;
        }
        return prev + 2;
      });
    }, 20);
    resetAutoSkipTimer();
  };

  const handleTouchEnd = () => {
    if (!profile || isLastProfile) return;
    
    isHoldingRef.current = false;
    clearInterval(holdTimerRef.current);
    if (holdProgress >= 100) {
      onProposeDate(profile);
    } else {
      setHoldProgress(0);
    }
    resetAutoSkipTimer();
  };

  const formatAvailability = (times) => {
    return times.map(time => TIME_PERIODS[time] || time).join(', ');
  };

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (holdProgress / 100) * circumference;

  const getLayerStyle = (layerId) => {
    const isActive = activeLayer === layerId;
    const isFocused = focusedLayer === layerId;
    const baseIndex = LAYERS.findIndex(l => l.id === layerId);
    const activeIndex = LAYERS.findIndex(l => l.id === activeLayer);
    
    const baseRotation = 15;
    const baseTranslate = 100;
    
    let rotateY = 0;
    let translateZ = 0;
    let translateX = 0;
    let opacity = 1;
    let scale = 1;

    if (isActive) {
      rotateY = 0;
      translateZ = 0;
      scale = 1;
      opacity = 1;
    } else if (baseIndex < activeIndex) {
      rotateY = -baseRotation;
      translateX = -baseTranslate;
      translateZ = -200 * (activeIndex - baseIndex);
      scale = 0.9;
      opacity = 0.5;
    } else {
      rotateY = baseRotation;
      translateX = baseTranslate;
      translateZ = -200 * (baseIndex - activeIndex);
      scale = 0.9;
      opacity = 0.5;
    }

    if (isFocused && !isActive) {
      scale = 0.95;
      opacity = 0.7;
      translateZ += 50;
    }

    return {
      transform: `perspective(2000px) rotateY(${rotateY}deg) translateZ(${translateZ}px) translateX(${translateX}px) scale(${scale})`,
      opacity: isLeaving ? 0 : opacity,
      zIndex: isActive ? 30 : (20 - Math.abs(baseIndex - activeIndex)),
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 1,
        velocity: 0
      }
    };
  };

  // Handle layer navigation
  const handleLayerClick = (layerId) => {
    if (focusedLayer === layerId) {
      setFocusedLayer(null);
    } else {
      setFocusedLayer(layerId);
      setActiveLayer(layerId);
    }
  };

  // Render layer content
  const renderLayerContent = () => {
    switch (activeLayer) {
      case 'info':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 space-y-4"
          >
            <h2 className="text-2xl font-bold text-white">{profile.name}, {profile.age}</h2>
            <p className="text-gray-300">{profile.bio}</p>
            {profile.interests && (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span key={index} className="px-3 py-1 bg-white/10 rounded-full text-sm text-white">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        );
      case 'photo':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-full"
          >
            <img
              src={profile.photo}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
            
            {/* Progress Indicator */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative w-16 h-16 filter drop-shadow-lg">
                <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="white"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-white text-lg font-medium">
                  {Math.round(holdProgress)}%
                </div>
              </div>
              <div className="text-white text-center mt-4 filter drop-shadow-lg">
                <div className="font-medium text-base bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm">
                  Hold to Plan Date
                </div>
                <div className="text-sm mt-2 opacity-90">
                  Release to Skip
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'availability':
        return shouldShowAvailability ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 space-y-4"
          >
            <h3 className="text-xl font-semibold text-white">Available Times</h3>
            {profile.availableTimes && profile.availableTimes.length > 0 ? (
              <div className="space-y-2">
                {profile.availableTimes.map((time, index) => (
                  <div key={index} className="p-3 bg-white/10 rounded-lg">
                    <p className="text-white">{time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-300">No available times set</p>
            )}
            <button
              onClick={onProposeDate}
              className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-rose-400 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Propose a Date
            </button>
          </motion.div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden">
      {/* Layer content */}
      <AnimatePresence mode="wait">
        {renderLayerContent()}
      </AnimatePresence>

      {/* Layer navigation */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex justify-center space-x-4">
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              onClick={() => handleLayerClick(layer.id)}
              className={`p-2 rounded-full transition-all ${
                focusedLayer === layer.id
                  ? 'bg-white text-gray-900'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title={layer.label}
            >
              {layer.icon}
            </button>
          ))}
        </div>
      </div>
      
      {/* Timer indicator - Only show if not last profile */}
      {!isLastProfile && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white/60 text-sm text-center">
          <div className="mb-2">
            Next profile in {Math.ceil((INTERACTION_CONFIG.autoSkipDelay - (Date.now() - lastInteractionRef.current)) / 1000)}s
          </div>
          <div>
            Hold to plan date
          </div>
        </div>
      )}
    </div>
  );
} 