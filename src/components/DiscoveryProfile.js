import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

const TIME_PERIODS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening'
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function DiscoveryProfile({ profile, onSkip, onProposeDate }) {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef(null);
  const isHoldingRef = useRef(false);

  if (!profile) {
    return null;
  }

  const handleTouchStart = () => {
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
  };

  const handleTouchEnd = () => {
    isHoldingRef.current = false;
    clearInterval(holdTimerRef.current);
    if (holdProgress >= 100) {
      onProposeDate(profile);
    } else {
      setHoldProgress(0);
    }
  };

  const formatAvailability = (times) => {
    return times.map(time => TIME_PERIODS[time] || time).join(', ');
  };

  // Calculate the circle's circumference and offset
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (holdProgress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white min-h-screen w-full relative"
    >
      <div 
        className="relative aspect-[4/3] w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <img
          src={profile.photo}
          alt={profile.basicInfo.name}
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
          style={{ background: `linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)` }}
        />
        
        {/* Circular Progress Indicator */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="relative w-24 h-24">
            {/* Background circle */}
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="4"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="white"
                strokeWidth="4"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                style={{ transition: 'stroke-dashoffset 0.05s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-medium">
              {Math.round(holdProgress)}%
            </div>
          </div>
          <div className="text-white text-center mt-4">
            <div className="font-medium">Hold to Plan Date</div>
            <div className="text-sm text-white/70">Release to Skip</div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {profile.basicInfo.name}, {profile.basicInfo.age}
          </h2>
          <p className="text-white/90">{profile.basicInfo.location}</p>
        </div>

        {profile.availability && (
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Available Times</h3>
            <div className="space-y-1">
              {Object.entries(profile.availability).map(([day, times]) => (
                times.length > 0 && (
                  <div key={day} className="text-white/90">
                    <span className="capitalize">{day}:</span>{' '}
                    <span>{formatAvailability(times)}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
} 