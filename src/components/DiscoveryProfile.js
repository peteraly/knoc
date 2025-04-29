import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// Sample profile data for testing
const SAMPLE_PROFILES = [
  {
    id: 'profile1',
    name: 'Sarah Johnson',
    age: 28,
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Adventure seeker and coffee enthusiast. Love hiking, photography, and trying new restaurants.',
    interests: ['Hiking', 'Photography', 'Coffee', 'Travel', 'Cooking'],
    availability: {
      Monday: ['Morning', 'Evening'],
      Wednesday: ['Afternoon', 'Evening'],
      Friday: ['Morning', 'Afternoon', 'Evening'],
      Saturday: ['Morning', 'Afternoon']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile2',
    name: 'Michael Chen',
    age: 32,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Tech entrepreneur by day, musician by night. Always looking for new experiences and connections.',
    interests: ['Technology', 'Music', 'Fitness', 'Reading', 'Art'],
    availability: {
      Tuesday: ['Morning', 'Evening'],
      Thursday: ['Afternoon', 'Evening'],
      Saturday: ['Morning', 'Afternoon', 'Evening'],
      Sunday: ['Morning', 'Afternoon']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile3',
    name: 'Emily Rodriguez',
    age: 26,
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Yoga instructor and wellness advocate. Passionate about healthy living and mindfulness.',
    interests: ['Yoga', 'Meditation', 'Healthy Eating', 'Nature', 'Dancing'],
    availability: {
      Monday: ['Morning', 'Afternoon'],
      Wednesday: ['Morning', 'Evening'],
      Friday: ['Morning', 'Afternoon'],
      Sunday: ['Morning', 'Afternoon', 'Evening']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile4',
    name: 'David Kim',
    age: 30,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Chef with a passion for fusion cuisine. Love exploring new flavors and sharing food experiences.',
    interests: ['Cooking', 'Food', 'Wine', 'Travel', 'Photography'],
    availability: {
      Tuesday: ['Afternoon', 'Evening'],
      Thursday: ['Morning', 'Evening'],
      Saturday: ['Morning', 'Afternoon', 'Evening'],
      Sunday: ['Morning', 'Afternoon']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile5',
    name: 'Olivia Taylor',
    age: 29,
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Art curator and creative soul. Always seeking inspiration and meaningful connections.',
    interests: ['Art', 'Museums', 'Literature', 'Theater', 'Fashion'],
    availability: {
      Monday: ['Morning', 'Afternoon'],
      Wednesday: ['Morning', 'Evening'],
      Friday: ['Afternoon', 'Evening'],
      Sunday: ['Morning', 'Afternoon']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile6',
    name: 'Alex Rivera',
    age: 31,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Software engineer who loves rock climbing and outdoor adventures. Looking for someone to share epic experiences with.',
    interests: ['Rock Climbing', 'Hiking', 'Programming', 'Board Games', 'Photography'],
    availability: {
      Monday: ['Evening'],
      Wednesday: ['Evening'],
      Saturday: ['Morning', 'Afternoon'],
      Sunday: ['Morning', 'Afternoon', 'Evening']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile7',
    name: 'Sophie Anderson',
    age: 27,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Dance instructor and part-time DJ. Always ready for spontaneous adventures and late-night conversations.',
    interests: ['Dancing', 'Music', 'Travel', 'Fashion', 'Fitness'],
    availability: {
      Tuesday: ['Morning', 'Afternoon'],
      Thursday: ['Evening'],
      Friday: ['Evening'],
      Saturday: ['Evening']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile8',
    name: 'Marcus Thompson',
    age: 33,
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Environmental lawyer and amateur botanist. Passionate about sustainability and making the world a better place.',
    interests: ['Gardening', 'Environmental Activism', 'Reading', 'Cycling', 'Cooking'],
    availability: {
      Monday: ['Morning'],
      Wednesday: ['Afternoon'],
      Friday: ['Morning', 'Afternoon'],
      Saturday: ['Morning', 'Afternoon']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile9',
    name: 'Nina Patel',
    age: 29,
    photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Veterinarian and animal lover. When not saving pets, you can find me at local comedy shows or trying new recipes.',
    interests: ['Animals', 'Comedy', 'Cooking', 'Yoga', 'Movies'],
    availability: {
      Tuesday: ['Evening'],
      Thursday: ['Evening'],
      Saturday: ['Morning', 'Afternoon'],
      Sunday: ['Afternoon', 'Evening']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile10',
    name: 'James Wilson',
    age: 30,
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Jazz musician and coffee shop owner. Looking for someone to share quiet mornings and live music nights with.',
    interests: ['Jazz', 'Coffee', 'Reading', 'Art', 'Food'],
    availability: {
      Monday: ['Morning'],
      Wednesday: ['Morning'],
      Friday: ['Evening'],
      Sunday: ['Morning', 'Afternoon']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile11',
    name: 'Luna Martinez',
    age: 28,
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Astronomy professor by day, salsa instructor by night. Searching for someone who can keep up with both science and dance.',
    interests: ['Astronomy', 'Dancing', 'Teaching', 'Languages', 'Photography'],
    availability: {
      Tuesday: ['Evening'],
      Thursday: ['Evening'],
      Saturday: ['Afternoon', 'Evening'],
      Sunday: ['Morning', 'Afternoon']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile12',
    name: 'Ryan O\'Connor',
    age: 32,
    photo: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Professional chef specializing in farm-to-table cuisine. Looking for someone to share culinary adventures and farmers market trips.',
    interests: ['Cooking', 'Farming', 'Wine Tasting', 'Sustainability', 'Travel'],
    availability: {
      Monday: ['Morning', 'Afternoon'],
      Wednesday: ['Morning'],
      Thursday: ['Morning', 'Afternoon'],
      Sunday: ['Evening']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile13',
    name: 'Zara Hassan',
    age: 29,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Neuroscientist and amateur baker. Fascinated by both the human brain and the perfect croissant. Looking for someone to share discoveries and desserts with.',
    interests: ['Science', 'Baking', 'Reading', 'Piano', 'Museums'],
    availability: {
      Tuesday: ['Evening'],
      Thursday: ['Evening'],
      Saturday: ['Morning', 'Afternoon'],
      Sunday: ['Morning', 'Afternoon']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile14',
    name: 'Thomas Wright',
    age: 34,
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Marine biologist and scuba instructor. When not exploring coral reefs, I\'m probably at a local jazz club or trying to perfect my sushi-making skills.',
    interests: ['Diving', 'Marine Life', 'Jazz', 'Cooking', 'Photography'],
    availability: {
      Monday: ['Evening'],
      Wednesday: ['Evening'],
      Friday: ['Evening'],
      Sunday: ['Morning', 'Afternoon']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile15',
    name: 'Isabella Romano',
    age: 31,
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Documentary filmmaker with a passion for storytelling. Always carrying my camera and ready for unexpected adventures. Let\'s create some stories worth telling.',
    interests: ['Filmmaking', 'Photography', 'Hiking', 'Art', 'Cultural Events'],
    availability: {
      Monday: ['Morning'],
      Wednesday: ['Morning', 'Afternoon'],
      Saturday: ['Afternoon', 'Evening'],
      Sunday: ['Morning', 'Evening']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile16',
    name: 'Kai Nakamura',
    age: 28,
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Game designer and esports enthusiast. Looking for someone to share both virtual and real-world adventures. Expert at Mario Kart, terrible at karaoke.',
    interests: ['Gaming', 'Technology', 'Anime', 'Board Games', 'Ramen'],
    availability: {
      Tuesday: ['Evening'],
      Thursday: ['Evening'],
      Saturday: ['Afternoon', 'Evening'],
      Sunday: ['Afternoon', 'Evening']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile17',
    name: 'Maya Patel',
    age: 30,
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Architect by day, salsa dancer by night. Passionate about sustainable design and creating spaces that bring people together. Always up for a dance or design discussion.',
    interests: ['Architecture', 'Dancing', 'Sustainability', 'Art', 'Travel'],
    availability: {
      Monday: ['Evening'],
      Wednesday: ['Evening'],
      Friday: ['Evening'],
      Saturday: ['Morning', 'Afternoon']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile18',
    name: 'Leo Santos',
    age: 33,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Street artist and community organizer. Believe in the power of art to transform communities. Looking for someone who wants to make the world more colorful.',
    interests: ['Street Art', 'Community Work', 'Music', 'Skateboarding', 'Photography'],
    availability: {
      Tuesday: ['Morning', 'Afternoon'],
      Thursday: ['Morning', 'Afternoon'],
      Saturday: ['Morning'],
      Sunday: ['Morning', 'Afternoon']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile19',
    name: 'Claire Bennett',
    age: 29,
    photo: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Botanical illustrator and rare plant collector. My apartment is a jungle and I\'m not sorry about it. Looking for someone to share plant care tips and life adventures.',
    interests: ['Plants', 'Art', 'Nature', 'Gardening', 'Tea'],
    availability: {
      Monday: ['Morning', 'Afternoon'],
      Wednesday: ['Morning'],
      Friday: ['Afternoon'],
      Sunday: ['Morning', 'Afternoon']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile20',
    name: 'Adrian Foster',
    age: 31,
    photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Craft beer brewer and amateur astronomer. Spend my nights either perfecting recipes or stargazing. Looking for someone to share both earthly and celestial discoveries.',
    interests: ['Brewing', 'Astronomy', 'Science', 'Hiking', 'Cooking'],
    availability: {
      Tuesday: ['Evening'],
      Thursday: ['Evening'],
      Saturday: ['Evening'],
      Sunday: ['Evening']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile21',
    name: 'Sophia Lee',
    age: 27,
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Children\'s book illustrator and volunteer art teacher. Believe in the magic of storytelling and creativity. Looking for someone who hasn\'t lost their sense of wonder.',
    interests: ['Art', 'Children', 'Books', 'Nature', 'Animation'],
    availability: {
      Monday: ['Afternoon'],
      Wednesday: ['Afternoon'],
      Friday: ['Morning', 'Afternoon'],
      Saturday: ['Morning']
    },
    isMatch: true,
    isDateScheduling: true
  },
  {
    id: 'profile22',
    name: 'Victor Ramirez',
    age: 32,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    bio: 'Urban farmer and sustainability consultant. Growing food on city rooftops and helping businesses go green. Seeking someone to share fresh harvests and eco-friendly adventures.',
    interests: ['Urban Farming', 'Sustainability', 'Cooking', 'Cycling', 'Farmers Markets'],
    availability: {
      Tuesday: ['Morning'],
      Thursday: ['Morning'],
      Saturday: ['Morning', 'Afternoon'],
      Sunday: ['Morning', 'Afternoon']
    },
    isMatch: true,
    isDateScheduling: true
  }
];

// Sample shared events for testing
const SAMPLE_SHARED_EVENTS = [
  {
    id: 'event1',
    title: 'Sunset Yoga in the Park',
    date: '2023-06-15',
    time: '6:30 PM',
    location: 'Central Park',
    coordinates: [-73.9665, 40.7812],
    description: 'Join us for a relaxing yoga session as the sun sets over the city skyline.'
  },
  {
    id: 'event2',
    title: 'Wine Tasting at Local Vineyard',
    date: '2023-06-20',
    time: '5:00 PM',
    location: 'Brooklyn Vineyards',
    coordinates: [-73.9496, 40.6501],
    description: 'Sample a variety of local wines and enjoy a guided tour of the vineyard.'
  },
  {
    id: 'event3',
    title: 'Cooking Class: Italian Pasta',
    date: '2023-06-25',
    time: '7:00 PM',
    location: 'Culinary Institute',
    coordinates: [-73.9854, 40.7484],
    description: 'Learn to make authentic Italian pasta from scratch with a professional chef.'
  }
];

// Local function to find shared events (replaces the non-existent Firebase function)
const findSharedEvents = async (userId) => {
  // In a real implementation, this would query Firestore
  // For testing, we'll just return a random selection of sample events
  const numEvents = Math.floor(Math.random() * 3);
  return SAMPLE_SHARED_EVENTS.slice(0, numEvents);
};

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

const HOLD_DURATION = 1000; // 1 second hold duration

export default function DiscoveryProfile({ profile, onSkip, onProposeDate, isLastProfile }) {
  const [activeLayer, setActiveLayer] = useState('photo');
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [showQuickDate, setShowQuickDate] = useState(false);
  const [quickDateEvent, setQuickDateEvent] = useState(null);
  const [shouldShowAvailability, setShouldShowAvailability] = useState(false);
  const [focusedLayer, setFocusedLayer] = useState('photo');
  const [isLeaving, setIsLeaving] = useState(false);
  
  // Hold gesture state
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Handle hold start
  const handleHoldStart = useCallback((e) => {
    // Prevent default only for mouse events to allow touch scrolling
    if (e.type.includes('mouse')) {
      e.preventDefault();
    }
    e.stopPropagation();
    
    console.log('Starting hold gesture');
    if (isHolding || !currentProfile) return;
    
    setIsHolding(true);
    setHoldProgress(0);
    startTimeRef.current = Date.now();
    
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);
      
      if (progress >= 100) {
        handleHoldComplete();
      }
    }, 16); // ~60fps
  }, [isHolding, currentProfile]);

  // Handle hold complete
  const handleHoldComplete = useCallback(() => {
    console.log('Hold gesture complete');
    clearInterval(holdTimerRef.current);
    setIsHolding(false);
    setHoldProgress(0);
    onProposeDate && onProposeDate(currentProfile);
  }, [currentProfile, onProposeDate]);

  // Handle hold end
  const handleHoldEnd = useCallback((e) => {
    if (e.type.includes('mouse')) {
      e.preventDefault();
    }
    e.stopPropagation();
    
    console.log('Ending hold gesture');
    clearInterval(holdTimerRef.current);
    setIsHolding(false);
    setHoldProgress(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  // Determine if we should show the availability layer
  useEffect(() => {
    setShouldShowAvailability(currentProfile?.isMatch && currentProfile?.isDateScheduling);
  }, [currentProfile]);

  // Create the layers array based on conditions
  const LAYERS = useMemo(() => {
    return shouldShowAvailability 
      ? [...BASE_LAYERS, AVAILABILITY_LAYER] 
      : BASE_LAYERS;
  }, [shouldShowAvailability]);

  // Handle auto-skip when timer expires
  const handleAutoSkip = useCallback(() => {
    if (isLastProfile) return;
    
    setIsLeaving(true);
    setTimeout(() => {
      if (onSkip && currentProfile) {
        onSkip(currentProfile);
      }
      setIsLeaving(false);
    }, INTERACTION_CONFIG.fadeOutDuration);
  }, [isLastProfile, currentProfile, onSkip]);

  // Reset auto-skip timer on any interaction
  const resetAutoSkipTimer = useCallback(() => {
    if (!isLastProfile && currentProfile) {
      const timer = setTimeout(handleAutoSkip, INTERACTION_CONFIG.autoSkipDelay);
      return () => clearTimeout(timer);
    }
  }, [isLastProfile, currentProfile, handleAutoSkip]);

  // Update useEffect with proper dependencies
  useEffect(() => {
    if (!currentProfile) return;

    const cleanup = resetAutoSkipTimer();
    return () => {
      if (cleanup) cleanup();
    };
  }, [currentProfile, resetAutoSkipTimer]);

  // Reset on profile change
  useEffect(() => {
    setCurrentProfile(profile);
  }, [profile]);

  // Update renderPhotoLayer to include hold gesture
  const renderPhotoLayer = () => (
    <div className="relative w-full h-full">
      {/* Profile photo with hold gesture */}
      <div 
        className="relative w-full h-full cursor-pointer"
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
        onTouchCancel={handleHoldEnd}
      >
        <img
          src={currentProfile?.photo}
          alt={currentProfile?.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        
        {/* Hold gesture hint */}
        <div className="absolute bottom-44 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
            Hold to propose a date
          </div>
        </div>
        
        {/* Hold progress overlay */}
        {isHolding && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="relative">
              {/* Progress circle */}
              <svg
                className="w-20 h-20"
                viewBox="0 0 100 100"
                style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,0,0,0.5))' }}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="4"
                  opacity="0.3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - holdProgress / 100)}`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              {/* Progress text */}
              <div 
                className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl"
                style={{ textShadow: '0px 0px 4px rgba(0,0,0,0.5)' }}
              >
                {Math.round(holdProgress)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center items-center gap-8 z-30">
        {/* Reject button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSkip && onSkip();
          }}
          className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
          aria-label="Skip profile"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Accept button */}
        <button
          onClick={() => onProposeDate && onProposeDate(currentProfile)}
          className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
          aria-label="Propose date"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>
  );

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
            <h2 className="text-2xl font-bold text-white">{currentProfile.name}, {currentProfile.age}</h2>
            <p className="text-gray-300">{currentProfile.bio}</p>
            {currentProfile.interests && (
              <div className="flex flex-wrap gap-2">
                {currentProfile.interests.map((interest, index) => (
                  <span key={index} className="px-3 py-1 bg-white/10 rounded-full text-sm text-white">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        );
      case 'photo':
        return renderPhotoLayer();
      case 'availability':
        return shouldShowAvailability ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold text-gray-900">Available Times</h3>
            <div className="space-y-2">
              {Object.entries(currentProfile.availability).map(([day, times]) => (
                times.length > 0 && (
                  <div key={day} className="bg-white rounded-lg p-3 shadow-sm">
                    <h4 className="font-medium text-gray-800 capitalize">{day}</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {times.map(time => (
                        <span
                          key={`${day}-${time}`}
                          className="bg-rose-100 text-rose-800 px-2 py-1 rounded-full text-sm"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
            
            {showQuickDate && quickDateEvent && (
              <div className="mt-6 bg-rose-50 p-4 rounded-lg border border-rose-200">
                <h3 className="font-medium text-rose-800">Quick Date Option</h3>
                <p className="text-rose-700">{quickDateEvent.title}</p>
                <p className="text-sm text-rose-600">
                  {quickDateEvent.date} • {quickDateEvent.time} • {quickDateEvent.location}
                </p>
                <button
                  onClick={() => onProposeDate(currentProfile)}
                  className="mt-3 w-full bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600"
                >
                  Propose This Date
                </button>
              </div>
            )}
            
            <button
              onClick={() => onProposeDate(currentProfile)}
              className="w-full mt-4 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600"
            >
              Propose a Date
            </button>
          </motion.div>
        ) : null;
      default:
        return null;
    }
  };

  // Handle layer navigation
  const handleLayerClick = useCallback((layerId) => {
    if (focusedLayer === layerId) {
      setFocusedLayer(null);
    } else {
      setFocusedLayer(layerId);
      setActiveLayer(layerId);
    }
  }, [focusedLayer]);

  if (!currentProfile) return null;

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
    </div>
  );
} 