import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, getDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Profile from './Profile';
import DiscoveryProfile from './DiscoveryProfile';
import MapView from './MapView';

// Sample profiles matching seeded test users
const SAMPLE_PROFILES = [
  {
    id: 'maya_patel',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    basicInfo: {
      name: 'Maya Patel',
      age: 28,
      location: 'San Francisco, CA',
      bio: 'Tech enthusiast and yoga lover. Always up for trying new restaurants and exploring the city!'
    },
    availability: {
      monday: ['morning', 'evening'],
      wednesday: ['afternoon'],
      friday: ['morning', 'afternoon', 'evening'],
      saturday: ['afternoon', 'evening']
    },
    activities: ['coffee', 'fitness', 'dining']
  },
  {
    id: 'sarah_johnson',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80',
    basicInfo: {
      name: 'Sarah Johnson',
      age: 27,
      location: 'San Francisco, CA',
      bio: 'Coffee enthusiast and hiking lover. Always up for trying new restaurants!'
    },
    availability: {
      monday: ['morning', 'evening'],
      wednesday: ['afternoon'],
      friday: ['morning', 'afternoon', 'evening'],
      saturday: ['afternoon', 'evening']
    },
    activities: ['coffee', 'hiking', 'dining']
  },
  {
    id: 'michael_chen',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    basicInfo: {
      name: 'Michael Chen',
      age: 29,
      location: 'San Francisco, CA',
      bio: 'Tech professional by day, amateur chef by night. Love exploring the city!'
    },
    availability: {
      tuesday: ['morning', 'afternoon'],
      thursday: ['evening'],
      friday: ['morning', 'afternoon'],
      sunday: ['morning', 'afternoon', 'evening']
    },
    activities: ['dining', 'museums', 'music']
  },
  {
    id: 'emily_rodriguez',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    basicInfo: {
      name: 'Emily Rodriguez',
      age: 26,
      location: 'Oakland, CA',
      bio: 'Art gallery curator and yoga instructor. Always seeking new adventures!'
    },
    availability: {
      monday: ['afternoon'],
      wednesday: ['morning', 'evening'],
      thursday: ['afternoon', 'evening'],
      saturday: ['morning', 'afternoon']
    },
    activities: ['museums', 'fitness', 'coffee']
  }
];

const EVENT_CATEGORIES = [
  { id: 'social', label: 'Social', icon: '👥' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎭' },
  { id: 'activities', label: 'Activities', icon: '🎨' }
];

// Update LOCAL_SUGGESTIONS to ensure all categories have complete event data
const LOCAL_SUGGESTIONS = {
  social: [
    {
      title: "Weekly Trivia Night",
      location: "The Brew House",
      time: "Every Tuesday, 7 PM",
      description: "Team up and test your knowledge!",
      emoji: "🎯",
      attendees: 24,
      distance: "0.8 miles",
      streak: 3, // Number of weeks attended in a row
      friendsMade: 8, // Number of connections made
      achievements: ["Trivia Champion 🏆", "Regular Player 🌟"],
      nextMilestone: {
        type: "attendance",
        current: 3,
        target: 5,
        reward: "Trivia Host Badge"
      }
    },
    {
      title: "Salsa Dancing Social",
      location: "Dance Studio SF",
      time: "Fridays, 8 PM",
      description: "All skill levels welcome",
      emoji: "💃",
      attendees: 42,
      distance: "1.2 miles",
      streak: 2,
      friendsMade: 5,
      achievements: ["Dance Enthusiast 💃"],
      nextMilestone: {
        type: "skill",
        current: 2,
        target: 3,
        reward: "Dance Partner Badge"
      }
    },
    {
      title: "Board Game Meetup",
      location: "Meeple's Cafe",
      time: "Wednesdays, 6 PM",
      description: "Join fellow gamers for casual gaming",
      emoji: "🎲",
      attendees: 18,
      distance: "0.5 miles",
      streak: 1,
      friendsMade: 3,
      achievements: ["First Timer 🎉"],
      nextMilestone: {
        type: "games",
        current: 4,
        target: 5,
        reward: "Game Master Badge"
      }
    }
  ],
  entertainment: [
    {
      title: "Live Jazz Night",
      location: "Blue Note Lounge",
      time: "Thursday-Saturday, 9 PM",
      description: "Featured local artists",
      emoji: "🎷",
      attendees: 56,
      distance: "1.5 miles",
      streak: 0,
      friendsMade: 12,
      achievements: ["Music Lover 🎵"],
      nextMilestone: {
        type: "attendance",
        current: 2,
        target: 5,
        reward: "Jazz Enthusiast Badge"
      }
    },
    {
      title: "Comedy Open Mic",
      location: "Laugh Factory",
      time: "Mondays, 8 PM",
      description: "Watch upcoming comedians",
      emoji: "🎤",
      attendees: 34,
      distance: "2.1 miles",
      streak: 0,
      friendsMade: 8,
      achievements: ["Comedy Fan 😄"],
      nextMilestone: {
        type: "attendance",
        current: 1,
        target: 3,
        reward: "Comedy Club Regular"
      }
    },
    {
      title: "Outdoor Movie Night",
      location: "Central Park",
      time: "Saturday, 8 PM",
      description: "Classic films under the stars",
      emoji: "🎬",
      attendees: 85,
      distance: "1.8 miles",
      streak: 0,
      friendsMade: 15,
      achievements: ["Movie Buff 🎥"],
      nextMilestone: {
        type: "attendance",
        current: 3,
        target: 5,
        reward: "Film Critic Badge"
      }
    }
  ],
  activities: [
    {
      title: "Group Hiking",
      location: "Twin Peaks",
      time: "Weekends, 9 AM",
      description: "Moderate difficulty, beautiful views",
      emoji: "🏃",
      attendees: 28,
      distance: "3.2 miles",
      streak: 0,
      friendsMade: 10,
      achievements: ["Trail Explorer 🏔️"],
      nextMilestone: {
        type: "distance",
        current: 15,
        target: 25,
        reward: "Peak Conqueror"
      }
    },
    {
      title: "Pottery Workshop",
      location: "Clay Studio",
      time: "Various times",
      description: "Learn wheel throwing basics",
      emoji: "🏺",
      attendees: 12,
      distance: "0.9 miles",
      streak: 0,
      friendsMade: 6,
      achievements: ["Clay Artist 🎨"],
      nextMilestone: {
        type: "projects",
        current: 2,
        target: 5,
        reward: "Master Potter"
      }
    },
    {
      title: "Cooking Class",
      location: "Culinary Institute",
      time: "Weekends",
      description: "Different cuisines each week",
      emoji: "👨‍🍳",
      attendees: 16,
      distance: "1.6 miles",
      streak: 0,
      friendsMade: 8,
      achievements: ["Chef in Training 🍳"],
      nextMilestone: {
        type: "recipes",
        current: 3,
        target: 6,
        reward: "Gourmet Chef"
      }
    }
  ]
};

export default function Matches({ currentView: initialView = 'discovery' }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState(initialView);
  const [dateRequests, setDateRequests] = useState([]);
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDate, setActiveDate] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [hasPendingOutgoingRequest, setHasPendingOutgoingRequest] = useState(false);
  const [lastRequestedProfile, setLastRequestedProfile] = useState(null);
  const [userInterests, setUserInterests] = useState(new Set());
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [verificationState, setVerificationState] = useState({
    requestId: null,
    code: null,
    startedBy: null
  });
  const [events, setEvents] = useState([
    {
      title: "Art Gallery Opening",
      date: "This Friday",
      time: "7:00 PM",
      location: "Downtown Art Gallery",
      description: "Join us for an evening of art, wine, and conversation. Perfect for a first date!",
      image: "https://source.unsplash.com/random/800x600/?art-gallery",
      attendees: 12,
      achievements: ["Art Lover", "Social Butterfly"],
      friendsMade: 3
    },
    {
      title: "Coffee Tasting Workshop",
      date: "This Saturday",
      time: "10:00 AM",
      location: "Local Coffee Roasters",
      description: "Learn about different coffee origins and brewing methods. Great for coffee enthusiasts!",
      image: "https://source.unsplash.com/random/800x600/?coffee",
      attendees: 8,
      achievements: ["Coffee Connoisseur"],
      friendsMade: 2
    },
    {
      title: "Sunset Yoga in the Park",
      date: "Next Wednesday",
      time: "6:30 PM",
      location: "Central Park",
      description: "Unwind with a relaxing yoga session as the sun sets. All skill levels welcome!",
      image: "https://source.unsplash.com/random/800x600/?yoga",
      attendees: 15,
      achievements: ["Wellness Warrior", "Outdoor Enthusiast"],
      friendsMade: 5
    }
  ]);
  const [profiles, setProfiles] = useState(SAMPLE_PROFILES);
  const [loading, setLoading] = useState(false);

  // Debug logging for verification state and requests
  useEffect(() => {
    console.log('Verification state updated:', verificationState);
  }, [verificationState]);

  useEffect(() => {
    console.log('Date requests updated:', dateRequests);
  }, [dateRequests]);

  // Add debug logging for verification state changes
  const updateVerificationState = (newState) => {
    console.log('Updating verification state:', newState);
    setVerificationState(newState);
  };

  const generateConfirmationCode = () => {
    // Generate a 4-digit numeric code that's easier to remember and share
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleSkip = () => {
    if (hasPendingOutgoingRequest) return;
    setCurrentProfileIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % availableProfiles.length;
      return nextIndex;
    });
  };

  const handleProposeDate = async (profile) => {
    // Check if user already has an active or accepted date
    const hasActiveDate = dateRequests.some(
      request => (request.status === 'active' || request.status === 'accepted') && !request.completedAt
    );

    if (hasActiveDate) {
      toast.error('Please complete your current date before starting a new one');
      return;
    }

    // Check for pending outgoing request
    if (hasPendingOutgoingRequest) {
      toast.error('You already have a pending date request');
      return;
    }

    // Validate profile data
    if (!profile || !profile.id || !profile.basicInfo || !profile.availability || !profile.activities) {
      console.error('Invalid profile data:', profile);
      toast.error('Unable to propose date at this time');
      return;
    }

    // Set state for pending request UI
    setLastRequestedProfile(profile);
    setHasPendingOutgoingRequest(true);
    setCurrentView('discovery');

    // Find relevant events based on profile's activities
    const relevantEvents = events.filter(event => 
      profile.activities.some(activity => 
        event.title.toLowerCase().includes(activity.toLowerCase()) || 
        event.description.toLowerCase().includes(activity.toLowerCase())
      )
    );

    // Update events to show relevant ones first
    setEvents(prevEvents => {
      const nonRelevantEvents = prevEvents.filter(e => 
        !relevantEvents.find(re => re.title === e.title)
      );
      return [...relevantEvents, ...nonRelevantEvents];
    });

    // Navigate to date planning
    const profileData = {
      id: profile.id,
      basicInfo: profile.basicInfo,
      photo: profile.photo,
      availability: profile.availability,
      activities: profile.activities,
      location: profile.basicInfo.location
    };

    navigate('/date-planning/new', {
      state: {
        profile: profileData,
        returnTo: '/matches'
      },
      replace: true
    });
  };

  const handleViewRequest = (request) => {
    const profile = SAMPLE_PROFILES.find(p => p.id === request.senderId);
    if (!profile) {
      toast.error('Profile not found');
      return;
    }

    const profileData = {
      id: profile.id,
      basicInfo: profile.basicInfo,
      photo: profile.photo,
      availability: profile.availability,
      activities: profile.activities,
      location: profile.basicInfo.location
    };

    navigate('/date-planning/new', {
      state: {
        profile: profileData,
        requestId: request.id,
        returnTo: '/matches'
      },
      replace: true
    });
  };

  const handleViewDate = (date) => {
    navigate('/date-planning/new', {
      state: {
        requestId: date.id,
        returnTo: '/matches'
      }
    });
  };

  const handleEventInterest = async (eventId) => {
    try {
      // Find the event
      const event = events.find(e => e.id === eventId);
      if (!event) {
        toast.error('Event not found');
        return;
      }

      // Add to user's interested events
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        interestedEvents: arrayUnion(eventId)
      });

      toast.success(`Added ${event.title} to your interested events!`);
    } catch (error) {
      console.error('Error marking event interest:', error);
      toast.error('Failed to save event interest');
    }
  };

  const handleAcceptRequest = async (request) => {
    try {
      const requestRef = doc(db, 'dateRequests', request.id);
      
      // Update the request status to accepted
      await updateDoc(requestRef, {
        status: 'accepted',
        acceptedAt: new Date(),
        lastUpdated: new Date(),
        participants: [request.senderId, request.recipientId] // Ensure both users are in participants
      });

      const sender = SAMPLE_PROFILES.find(p => p.id === request.senderId);
      
      // Find relevant events based on shared interests
      const senderActivities = sender?.activities || [];
      const relevantEvents = events.filter(event => 
        senderActivities.some(activity => 
          event.title.toLowerCase().includes(activity.toLowerCase()) || 
          event.description.toLowerCase().includes(activity.toLowerCase())
        )
      );

      // Update events to show relevant ones first
      setEvents(prevEvents => {
        const nonRelevantEvents = prevEvents.filter(e => 
          !relevantEvents.find(re => re.title === e.title)
        );
        return [...relevantEvents, ...nonRelevantEvents];
      });

      // Show success message
      toast.success(
        <div className="space-y-2">
          <div className="font-medium">Invite Accepted!</div>
          <div className="text-sm">You're now connected with {sender?.basicInfo.name}</div>
          {relevantEvents.length > 0 && (
            <div className="text-sm text-gray-600">
              Found {relevantEvents.length} events you might both enjoy!
            </div>
          )}
        </div>,
        { duration: 5000 }
      );

      // Set current view to discovery to show the waiting/events screen
      setCurrentView('discovery');
      setHasPendingOutgoingRequest(true);
      setLastRequestedProfile(sender);

    } catch (error) {
      console.error('Error accepting invite:', error);
      toast.error('Failed to accept invite. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const requestRef = doc(db, 'dateRequests', requestId);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: new Date(),
        lastUpdated: new Date()
      });
      
      toast.success('Request declined');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to decline request');
    }
  };

  const renderEventCard = (event, index, isExpanded = false) => {
    const hasAchievements = event.achievements?.length > 0;
    const nextMilestone = hasAchievements ? event.achievements[0] : null;

    return (
      <motion.div
        key={`${event.title}-${index}`}
        layout
        className={`bg-white rounded-lg shadow-sm overflow-hidden ${
          isExpanded ? 'fixed inset-4 z-50 max-w-2xl mx-auto' : 'cursor-pointer'
        }`}
        onClick={() => !isExpanded && setExpandedEvent(event)}
      >
        <div className="relative aspect-video">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedEvent(null);
              }}
              className="absolute top-4 right-4 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center"
            >
              ×
            </button>
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-medium">{event.title}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEventInterest(event.id);
              }}
              className={`px-3 py-1 rounded-full text-sm ${
                userInterests.has(event.title)
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {userInterests.has(event.title) ? "I'm Going!" : "I'm Interested"}
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600">{event.date} at {event.time}</p>
            <p className="text-gray-600">{event.location}</p>
            {isExpanded && (
              <p className="text-gray-600 mt-4">{event.description}</p>
            )}
          </div>
          {hasAchievements && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {event.friendsMade || 0} connections made
                  </span>
                </div>
                {nextMilestone && (
                  <span className="text-sm text-rose-600">
                    Achievement: {nextMilestone}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderActiveDateDetails = ({ request }) => {
    const otherUser = request.senderId === currentUser.uid ? 
      SAMPLE_PROFILES.find(p => p.id === request.recipientId) :
      SAMPLE_PROFILES.find(p => p.id === request.senderId);
    
    if (!otherUser) return null;

    return (
      <div className="space-y-6">
        {/* Profile and Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={otherUser.photo}
              alt={otherUser.basicInfo.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {otherUser.basicInfo.name}
              </h3>
              <p className="text-gray-600">{otherUser.basicInfo.location}</p>
            </div>
          </div>
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            Active Date
          </div>
        </div>

        {/* Date Details Card */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">Date Details</h4>
          <div className="space-y-2 text-gray-700">
            {request.dateDetails?.activity && (
              <p className="flex items-center">
                <span className="w-24 text-gray-500">Activity:</span>
                <span className="font-medium">{request.dateDetails.activity}</span>
              </p>
            )}
            <p className="flex items-center">
              <span className="w-24 text-gray-500">When:</span>
              <span className="font-medium">
                {request.dateDetails?.day} at {request.dateDetails?.time}
              </span>
            </p>
            {request.dateDetails?.venue && (
              <p className="flex items-center">
                <span className="w-24 text-gray-500">Where:</span>
                <span className="font-medium">{request.dateDetails.venue}</span>
              </p>
            )}
          </div>
        </div>

        {/* Events Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">Events You Might Both Enjoy</h4>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {events.slice(0, 3).map((event, index) => (
              <div 
                key={`event-${index}`}
                className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:border-rose-200 transition-colors"
              >
                <div className="flex items-center space-x-4 p-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-rose-100 rounded-lg flex items-center justify-center text-2xl">
                      {event.emoji || '🎉'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-base font-medium text-gray-900 truncate">{event.title}</h5>
                    <p className="text-sm text-gray-500">{event.date} at {event.time}</p>
                    <p className="text-sm text-gray-500">{event.location}</p>
                  </div>
                  <button
                    onClick={() => handleEventInterest(event.id)}
                    className="flex-shrink-0 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-sm transition-colors"
                  >
                    I'm Interested
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complete Date Button */}
        <div className="border-t pt-6">
          <button
            onClick={() => handleDateComplete(request.id)}
            className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 
                     transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <span>Mark Date as Complete</span>
          </button>
          <p className="text-sm text-gray-500 text-center mt-3">
            Complete this date to see new matches and requests
          </p>
        </div>
      </div>
    );
  };

  const renderAcceptedDateDetails = ({ request }) => {
    const otherUser = SAMPLE_PROFILES.find(p => p.id === (request.senderId === currentUser.uid ? request.recipientId : request.senderId));
    
    console.log('Rendering accepted date details:', {
      request,
      currentUser: currentUser.uid,
      verificationState,
      requestVerification: {
        startedBy: request.verificationStartedBy,
        code: request.preVerificationCode
      }
    });

    // Use both local state and request state for verification
    const isVerificationStarted = request.status === 'pre_verification' || verificationState.requestId === request.id;
    const showVerificationCode = isVerificationStarted && 
      ((verificationState.startedBy === currentUser.uid) || (request.verificationStartedBy === currentUser.uid));
    const verificationCode = verificationState.requestId === request.id ? 
      verificationState.code : request.preVerificationCode;

    console.log('Verification display logic:', {
      isVerificationStarted,
      showVerificationCode,
      verificationCode,
      status: request.status,
      verificationState
    });

    return (
      <div className="space-y-6">
        {/* Profile and Date Details */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={otherUser?.photo}
              alt={otherUser?.basicInfo.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{otherUser?.basicInfo.name}</h3>
              <p className="text-gray-600">{otherUser?.basicInfo.location}</p>
            </div>
          </div>
          <div className="bg-rose-100 text-rose-800 px-4 py-2 rounded-full text-sm font-medium">
            Upcoming Date
          </div>
        </div>

        {/* Date Details Card */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-gray-900">Date Details</h4>
          <div className="space-y-2 text-gray-700">
            <p className="flex items-center">
              <span className="w-24 text-gray-500">Activity:</span>
              <span className="font-medium">{request.dateDetails?.activity}</span>
            </p>
            <p className="flex items-center">
              <span className="w-24 text-gray-500">When:</span>
              <span className="font-medium">{request.dateDetails?.day} at {request.dateDetails?.time}</span>
            </p>
            <p className="flex items-center">
              <span className="w-24 text-gray-500">Where:</span>
              <span className="font-medium">{request.dateDetails?.venue}</span>
            </p>
          </div>
        </div>

        {/* Verification Code Section */}
        <div className="bg-white rounded-lg p-6 border border-gray-100">
          <div className="text-center space-y-4">
            {showVerificationCode ? (
              <div key="verification-code" className="space-y-4">
                <p className="text-gray-600 mb-2">Your verification code:</p>
                <div className="text-4xl font-mono font-bold tracking-wider bg-rose-50 text-rose-600 p-4 rounded-lg inline-block">
                  {verificationCode}
                </div>
                <p className="text-gray-600">Show this code to {otherUser?.basicInfo.name}</p>
                <p className="text-sm text-gray-500 mt-2">Code: {verificationCode}</p>
              </div>
            ) : isVerificationStarted ? (
              <div key="verification-input" className="space-y-4">
                <p className="text-gray-600 mb-2">Enter the code shown by {otherUser?.basicInfo.name}:</p>
                <input
                  type="text"
                  maxLength="4"
                  placeholder="Enter 4-digit code"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-4xl font-mono tracking-wider w-40 p-4 border-2 border-gray-200 rounded-lg focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
                <button
                  onClick={() => handleVerifyCode(request.id)}
                  disabled={confirmationCode.length !== 4}
                  className="px-6 py-2 bg-rose-500 text-white rounded-lg disabled:opacity-50"
                >
                  Verify Code
                </button>
              </div>
            ) : (
              <div key="verification-start" className="space-y-4">
                <button
                  onClick={() => handleStartVerification(request.id)}
                  className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                >
                  Start Verification
                </button>
                <p className="text-sm text-gray-500">Generate a code to verify you met</p>
              </div>
            )}
          </div>
        </div>

        {/* Events Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">Events You Might Both Enjoy</h4>
            <span className="text-sm text-gray-500">Based on shared interests</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {events.slice(0, 3).map((event, index) => (
              <div 
                key={`event-${index}`}
                className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:border-rose-200 transition-colors"
              >
                <div className="flex items-center space-x-4 p-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-rose-100 rounded-lg flex items-center justify-center text-2xl">
                      {event.emoji || '🎉'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-base font-medium text-gray-900 truncate">{event.title}</h5>
                    <p className="text-sm text-gray-500">{event.date} at {event.time}</p>
                    <p className="text-sm text-gray-500">{event.location}</p>
                  </div>
                  <button
                    onClick={() => handleEventInterest(event.id)}
                    className="flex-shrink-0 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-sm transition-colors"
                  >
                    I'm Interested
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDatesView = () => (
    <motion.div
      key="dates"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-semibold text-gray-900">Your Dates</h2>
      
      {/* Confirmed Dates */}
      {dateRequests
        .filter(request => request.status === 'confirmed')
        .map(request => (
          <div key={`date-${request.id}`}>
            {renderAcceptedDateDetails({ request })}
          </div>
        ))}

      {/* No Dates Message */}
      {!dateRequests.some(r => r.status === 'confirmed') && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-600">No confirmed dates yet</p>
          <p className="text-sm text-gray-500 mt-2">
            When you accept a date request, it will appear here
          </p>
        </div>
      )}
    </motion.div>
  );

  // Add Firebase listener for date requests
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'dateRequests'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = [];
      snapshot.forEach((doc) => {
        const request = { id: doc.id, ...doc.data() };
        
        // Update verification state if this request has verification started
        if (request.status === 'pre_verification' && request.preVerificationCode) {
          console.log('Found request with verification:', request);
          
          // Only update verification state if it's different from current
          if (verificationState.requestId !== request.id || 
              verificationState.code !== request.preVerificationCode) {
            console.log('Updating verification state from Firebase');
            updateVerificationState({
              requestId: request.id,
              code: request.preVerificationCode,
              startedBy: request.verificationStartedBy
            });
          }
        }
        
        requests.push(request);
      });

      console.log('All requests:', requests);
      setDateRequests(requests);
      
      // Update pending request state
      const hasPending = requests.some(r => 
        (r.status === 'pending' || r.status === 'pre_verification') && 
        r.senderId === currentUser.uid
      );
      setHasPendingOutgoingRequest(hasPending);

      // Update last requested profile if there's a pending request
      const pendingRequest = requests.find(r => 
        (r.status === 'pending' || r.status === 'pre_verification') && 
        r.senderId === currentUser.uid
      );
      if (pendingRequest) {
        const profile = SAMPLE_PROFILES.find(p => p.id === pendingRequest.recipientId);
        setLastRequestedProfile(profile);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleStartVerification = async (requestId) => {
    try {
      console.log('Starting verification for request:', requestId);
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      console.log('Generated code:', code);
      
      // Update local state immediately
      const newState = {
        requestId,
        code,
        startedBy: currentUser.uid
      };
      updateVerificationState(newState);
      console.log('Updated local verification state with code:', code);

      // Update Firestore
      const requestRef = doc(db, 'dateRequests', requestId);
      await updateDoc(requestRef, {
        status: 'pre_verification',
        preVerificationCode: code,
        verificationStartedBy: currentUser.uid,
        lastUpdated: serverTimestamp()
      });
      
      console.log('Firestore updated successfully with code:', code);
      toast.success('Verification code generated!');
    } catch (error) {
      console.error('Error starting verification:', error);
      // Reset verification state on error
      updateVerificationState({
        requestId: null,
        code: null,
        startedBy: null
      });
      toast.error('Failed to generate verification code. Please try again.');
    }
  };

  const handleVerifyCode = async (requestId) => {
    try {
      const requestRef = doc(db, 'dateRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        toast.error('Date request not found');
          return;
      }

      const request = requestDoc.data();
      
      if (request.preVerificationCode !== confirmationCode) {
        toast.error('Incorrect verification code');
        setConfirmationCode('');
        return;
      }

      // Update the request status to 'active' instead of 'confirmed'
      await updateDoc(requestRef, {
        status: 'active',
        verifiedAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      // Update local state
      setDateRequests(prev => prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'active',
            verifiedAt: new Date(),
            lastUpdated: new Date()
          };
        }
        return req;
      }));

      toast.success('Date verified! Have a great time!');
      setConfirmationCode('');
      
      // Don't navigate away, let the UI update to show the active date screen
    } catch (error) {
      console.error('Error verifying code:', error);
      toast.error('Failed to verify code');
    }
  };

  const renderRequestsView = () => (
    <motion.div
      key="requests"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-semibold text-gray-900">Date Requests</h2>
      
      {/* Pending Requests */}
      {pendingRequests
        .filter(request => request.recipientId === currentUser.uid)
        .map(request => {
          const sender = SAMPLE_PROFILES.find(p => p.id === request.senderId);
          if (!sender) return null;
          
          return (
            <div key={request.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <img
                  src={sender.photo}
                  alt={sender.basicInfo.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold">{sender.basicInfo.name}</h3>
                  <p className="text-gray-600">{sender.basicInfo.location}</p>
                </div>
              </div>
              
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h4 className="font-medium mb-2">Date Details</h4>
                <div className="space-y-1 text-gray-600">
                  <p>Activity: {request.dateDetails?.activity}</p>
                  <p>When: {request.dateDetails?.day} at {request.dateDetails?.time}</p>
                  <p>Where: {request.dateDetails?.venue}</p>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleAcceptRequest(request)}
                  className="flex-1 bg-rose-500 text-white py-2 rounded-lg hover:bg-rose-600 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRejectRequest(request.id)}
                  className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          );
        })}
      
      {/* No Requests Message */}
      {!pendingRequests.some(r => r.recipientId === currentUser.uid) && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-600">No pending requests</p>
          <p className="text-sm text-gray-500 mt-2">
            When someone sends you a date request, it will appear here
          </p>
        </div>
      )}
    </motion.div>
  );

  const renderDiscoveryView = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
        </div>
      );
    }

    if (!profiles.length) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No more profiles available</h2>
          <p className="text-gray-600 text-center mb-4">Check back later for new potential matches</p>
        </div>
      );
    }

    return (
      <div className="flex-1 relative">
        <DiscoveryProfile
          profile={profiles[currentProfileIndex]}
          onSkip={() => {
            if (currentProfileIndex < profiles.length - 1) {
              setCurrentProfileIndex(currentProfileIndex + 1);
            } else {
              setProfiles([]);
            }
          }}
          onProposeDate={(profile) => handleProposeDate(profile)}
          isLastProfile={currentProfileIndex === profiles.length - 1}
        />
      </div>
    );
  };

  const handleDateComplete = async (dateId) => {
    try {
      const dateRef = doc(db, 'dateRequests', dateId);
      await updateDoc(dateRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      toast.success('Date marked as completed! You can now browse new matches.');
      setCurrentView('discovery');
    } catch (error) {
      console.error('Error completing date:', error);
      toast.error('Failed to complete date');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeDate ? 'Active Date' : 'Find Matches'}
            </h1>
            
            {/* Only show navigation tabs if there's no active or accepted date */}
            {!dateRequests.some(r => (r.status === 'active' || r.status === 'accepted') && !r.completedAt) && (
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('discovery')}
                  className={`px-4 py-2 rounded-lg ${
                    currentView === 'discovery'
                      ? 'bg-rose-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Discovery
                </button>
                <button
                  onClick={() => setCurrentView('requests')}
                  className={`px-4 py-2 rounded-lg relative ${
                    currentView === 'requests'
                      ? 'bg-rose-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Requests
                  {pendingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full" />
                  )}
                </button>
                <button
                  onClick={() => setCurrentView('dates')}
                  className={`px-4 py-2 rounded-lg ${
                    currentView === 'dates'
                      ? 'bg-rose-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Dates
                </button>
              </div>
            )}
            </div>
          </div>
          
        {/* Main Content */}
        <AnimatePresence mode="wait">
          {/* If there's an active or accepted date, show only that */}
          {dateRequests.some(r => (r.status === 'active' || r.status === 'accepted') && !r.completedAt) ? (
            <motion.div
              key="active-or-accepted-date"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              {dateRequests.find(r => r.status === 'active' && !r.completedAt) ? (
                renderActiveDateDetails({ request: dateRequests.find(r => r.status === 'active' && !r.completedAt) })
              ) : (
                renderAcceptedDateDetails({ request: dateRequests.find(r => r.status === 'accepted' && !r.completedAt) })
              )}
            </motion.div>
          ) : (
            <>
              {currentView === 'discovery' && renderDiscoveryView()}
              {currentView === 'requests' && renderRequestsView()}
              {currentView === 'dates' && renderDatesView()}
            </>
          )}
        </AnimatePresence>
        </div>
    </div>
  );
} 