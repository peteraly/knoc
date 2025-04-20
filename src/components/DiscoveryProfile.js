import React, { useState, useRef, useEffect } from 'react';
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

const LAYERS = [
  { id: 'info', label: 'Basic Info', icon: '👤' },
  { id: 'photo', label: 'Photos', icon: '📷' },
  { id: 'availability', label: 'Schedule', icon: '📅' }
];

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

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0B0F] pt-4">
      <div className="flex-1 flex flex-col">
        <div 
          ref={containerRef}
          className="flex-1 relative"
          style={{
            perspective: '2000px',
            perspectiveOrigin: '50% 50%',
            transformStyle: 'preserve-3d'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="relative w-[90vw] h-[80vh] max-w-xl"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {LAYERS.map((layer, index) => (
                <motion.div
                  key={layer.id}
                  className={`absolute inset-0 rounded-3xl cursor-pointer overflow-hidden
                             ${layer.id !== 'photo' ? 'backdrop-blur-xl' : ''}
                             shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                             ${activeLayer === layer.id ? 'z-30' : 'z-20'}`}
                  style={{ 
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                    willChange: 'transform, opacity'
                  }}
                  initial={false}
                  animate={getLayerStyle(layer.id)}
                  onHoverStart={() => setFocusedLayer(layer.id)}
                  onHoverEnd={() => setFocusedLayer(null)}
                  onClick={() => setActiveLayer(layer.id)}
                >
                  {layer.id === 'photo' && (
                    <div className="absolute inset-0 rounded-3xl overflow-hidden">
                      <img
                        src={profile.photo}
                        alt={profile.basicInfo.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
                      
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
                    </div>
                  )}
                  
                  {layer.id === 'info' && (
                    <div className="absolute inset-0 rounded-3xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1b26]/95 to-[#1a1b26]/80" />
                      <div className="relative p-8 text-white h-full flex flex-col">
                        <h2 className="text-4xl font-semibold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/90">
                          {profile.basicInfo.name}, {profile.basicInfo.age}
                        </h2>
                        <p className="text-2xl text-white/90 mb-4">
                          {profile.basicInfo.location}
                        </p>
                        {profile.basicInfo.bio && (
                          <p className="text-xl text-white/80 leading-relaxed">
                            {profile.basicInfo.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {layer.id === 'availability' && (
                    <div className="absolute inset-0 rounded-3xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#2a1b3d]/95 to-[#1a1b26]/90" />
                      <div className="relative p-8 text-white h-full">
                        <h3 className="text-2xl font-medium mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/90">
                          Available Times
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(profile.availability).map(([day, times]) => (
                            times.length > 0 && (
                              <div key={day} 
                                   className="bg-white/10 p-4 rounded-xl backdrop-blur-sm 
                                            hover:bg-white/15 transition-all duration-300
                                            border border-white/5 shadow-lg">
                                <span className="block capitalize font-medium text-lg mb-1 text-white/90">
                                  {day}
                                </span>
                                <span className="text-white/70">
                                  {formatAvailability(times)}
                                </span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* End of Profiles Message */}
          {isLastProfile && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl text-center max-w-md"
              >
                <h3 className="text-2xl font-semibold text-white mb-4">
                  That's all for now!
                </h3>
                <p className="text-white/80 mb-6">
                  You've seen all available profiles. Check back later for new potential matches!
                </p>
                <div className="flex justify-center gap-4">
                  <button 
                    className="px-6 py-2 bg-rose-500 text-white rounded-full font-medium"
                    onClick={() => window.location.reload()}
                  >
                    Refresh
                  </button>
                  <button 
                    className="px-6 py-2 bg-white/10 text-white rounded-full font-medium"
                    onClick={() => {/* Handle navigation to another section */}}
                  >
                    View Requests
                  </button>
                </div>
              </motion.div>
            </div>
          )}
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

        {/* Layer Navigation - Only show if not last profile */}
        {!isLastProfile && (
          <div className="p-4 flex justify-center gap-6 bg-[#0A0B0F]/80 backdrop-blur-sm">
            {LAYERS.map(layer => (
              <motion.button
                key={layer.id}
                className={`p-4 rounded-full transition-all duration-300
                           ${activeLayer === layer.id 
                             ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20' 
                             : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                onClick={() => {
                  setActiveLayer(layer.id);
                  resetAutoSkipTimer();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">{layer.icon}</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 