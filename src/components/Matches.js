import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Profile from './Profile';
import DiscoveryProfile from './DiscoveryProfile';

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

export default function Matches() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('discovery');
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [dateRequests, setDateRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPendingOutgoingRequest, setHasPendingOutgoingRequest] = useState(false);
  const [lastRequestedProfile, setLastRequestedProfile] = useState(null);
  const [userInterests, setUserInterests] = useState(new Set());
  const [expandedEvent, setExpandedEvent] = useState(null);
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

  const handleProposeDate = (profile) => {
    // Prevent proposing if already have pending request
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

    // Set state for pending request UI immediately
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

    // Navigate to date planning with complete profile data
    navigate('/date-planning/new', {
      state: {
        profile: {
          id: profile.id,
          basicInfo: profile.basicInfo,
          photo: profile.photo,
          availability: profile.availability,
          activities: profile.activities
        },
        returnTo: '/matches'
      }
    });
  };

  const handleViewRequest = (request) => {
    const profile = SAMPLE_PROFILES.find(p => p.id === request.senderId);
      if (!profile) {
      toast.error('Profile not found');
      return;
    }

    navigate('/date-planning/new', {
      state: {
        profile: {
          id: profile.id,
          basicInfo: profile.basicInfo,
          photo: profile.photo,
          availability: profile.availability,
          activities: profile.activities
        },
        requestId: request.id,
        returnTo: '/matches'
      }
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

  const handleEventInterest = (event, e) => {
    e.stopPropagation();
    const newInterests = new Set(userInterests);
    
    if (newInterests.has(event.title)) {
      newInterests.delete(event.title);
      toast.success(`We'll stop sending you updates about ${event.title}`);
    } else {
      newInterests.add(event.title);
      
      // Show achievement toast for first interaction
      if (newInterests.size === 1) {
        toast.success('🎉 Achievement Unlocked: Social Explorer!', {
          duration: 3000,
          icon: '🌟'
        });
      }
      
      // Show connection potential
      const potentialConnections = Math.min(event.attendees, 3);
      toast.success(
        <div className="space-y-2">
          <div>You're interested in {event.title}!</div>
          <div className="text-sm text-gray-600">
            {potentialConnections} people with similar interests are going
          </div>
        </div>,
        { duration: 4000 }
      );
    }
    
    setUserInterests(newInterests);
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
                handleEventInterest(event, e);
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

  const renderDatesView = () => (
    <motion.div
      key="dates"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold text-gray-900">Your Dates</h2>
      {dateRequests
        .filter(date => date.status === 'confirmed')
        .map((date, index) => {
          const otherPerson = SAMPLE_PROFILES.find(
            p => p.id === (date.senderId === currentUser.uid ? date.recipientId : date.senderId)
          );
          return (
            <div
              key={`${date.id}-${index}`}
              className="bg-white rounded-xl shadow-sm p-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={otherPerson?.photo}
                  alt={otherPerson?.basicInfo.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{otherPerson?.basicInfo.name}</h3>
                  <p className="text-sm text-gray-600">
                    {date.dateDetails.day} at {date.dateDetails.time}
                  </p>
                  <p className="text-sm text-gray-600">
                    Activity: {date.dateDetails.activity}
                  </p>
                </div>
                <button
                  onClick={() => handleViewDate(date)}
                  className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
                >
                  View
                </button>
              </div>
            </div>
          );
        })}
      {dateRequests.filter(r => r.status === 'confirmed').length === 0 && (
        <p className="text-center text-gray-600 py-8">No confirmed dates</p>
      )}
    </motion.div>
  );

  // Convert to a proper React component
  const AcceptedDateDetails = ({ request }) => {
    const navigate = useNavigate();
    const otherUser = SAMPLE_PROFILES.find(p => 
      p.id === (request.senderId === currentUser.uid ? request.recipientId : request.senderId)
    );
    const [confirmationCode, setConfirmationCode] = useState('');
    const [isDateComplete, setIsDateComplete] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const handleStartVerification = async () => {
      try {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        console.log('Generated verification code:', code);
        
        const requestRef = doc(db, 'dateRequests', request.id);
        const updateData = {
          status: 'pre_verification',
          preVerificationCode: code,
          verificationStartedBy: currentUser.uid,
          lastUpdated: new Date(),
          codeExpiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
        };
        
        await updateDoc(requestRef, updateData);
        toast.success('Show this code to your date partner!');
      } catch (error) {
        console.error('Error starting verification:', error);
        toast.error('Failed to start verification. Please try again.');
      }
    };

    const handleVerifyCode = async () => {
      if (!confirmationCode) {
        toast.error('Please enter the verification code');
        return;
      }

      try {
        const requestRef = doc(db, 'dateRequests', request.id);
        const requestDoc = await getDoc(requestRef);
        const requestData = requestDoc.data();

        if (requestData.preVerificationCode === confirmationCode) {
          await updateDoc(requestRef, {
            status: 'in_progress',
            preVerificationCode: null,
            verificationStartedBy: null,
            verifiedAt: new Date(),
            lastUpdated: new Date()
          });

          setConfirmationCode('');
          toast.success('Verified! Have a great date!');
          setTimeout(() => navigate('/'), 2000);
        } else {
          setRetryCount(prev => prev + 1);
          toast.error('Incorrect code. Please try again.');
        }
    } catch (error) {
        console.error('Error verifying code:', error);
        toast.error('Failed to verify code. Please try again.');
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            You're Connected!
          </h2>
          <p className="text-gray-600">
            You and {otherUser?.basicInfo.name} can now plan your date!
          </p>
        </div>
        
        <div className="flex items-center justify-center space-x-4 mb-6">
          <img
            src={otherUser?.photo}
            alt={otherUser?.basicInfo.name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div className="text-left">
            <h3 className="font-medium text-lg">{otherUser?.basicInfo.name}</h3>
            <p className="text-gray-600">{otherUser?.basicInfo.location}</p>
          </div>
        </div>

        <div className="bg-rose-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-rose-900 mb-2">Date Details</h4>
          <div className="space-y-2 text-rose-800">
            <p><span className="font-medium">When:</span> {request.dateDetails.day} at {request.dateDetails.time}</p>
            <p><span className="font-medium">Activity:</span> {request.dateDetails.activity}</p>
            {request.dateDetails.message && (
              <p><span className="font-medium">Message:</span> {request.dateDetails.message}</p>
            )}
          </div>
        </div>

        {request.status === 'accepted' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center p-4 bg-rose-50 rounded-lg mb-4">
              <p className="text-gray-700">
                When you meet {otherUser?.basicInfo.name}, verify you found each other by sharing a quick code
              </p>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate('/chat')}
                className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                Start Planning
              </button>
              <button
                onClick={handleStartVerification}
                className="px-6 py-2 border border-rose-500 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              >
                Start Verification
              </button>
            </div>
          </div>
        )}

        {request.status === 'pre_verification' && (
          <div className="mt-6">
            {request.verificationStartedBy === currentUser.uid ? (
              <div className="text-center p-6 bg-rose-50 rounded-lg">
                <p className="text-lg font-medium text-rose-900 mb-2">Your Verification Code</p>
                <p className="text-4xl font-mono tracking-wider text-rose-600 mb-4">
                  {request.preVerificationCode}
                </p>
                <p className="text-sm text-rose-700">
                  Show this code to {otherUser?.basicInfo.name} to verify you found each other
                </p>
                <p className="mt-2 text-xs text-rose-600">
                  Code expires in 5 minutes
                </p>
                <button
                  onClick={handleStartVerification}
                  className="mt-4 px-4 py-2 text-sm border border-rose-500 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  Generate New Code
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-4 bg-rose-50 rounded-lg mb-4">
                  <p className="text-gray-700">
                    Ask {otherUser?.basicInfo.name} for their verification code
                  </p>
                </div>
                <div className="flex flex-col items-center space-y-4">
                  <input
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setConfirmationCode(value);
                      if (value.length === 4) {
                        handleVerifyCode();
                      }
                    }}
                    placeholder="0000"
                    className="w-36 px-4 py-2 text-center text-3xl font-mono tracking-wider border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    maxLength={4}
                    autoFocus
                  />
                  <p className="text-sm text-gray-500">
                    Enter the 4-digit code
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {request.status === 'in_progress' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg mb-4">
              <p className="text-green-700">
                Verified! Have a great date!
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              Return to Discovery
            </button>
          </div>
        )}
      </div>
    );
  };

  // Update the renderDiscoveryView function to use the new component
  const renderDiscoveryView = () => {
    // Find accepted request if it exists
    const acceptedRequest = dateRequests.find(r => 
      r.status === 'accepted' && 
      (r.senderId === currentUser.uid || r.recipientId === currentUser.uid)
    );

    return (
      <motion.div
        key="discovery"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-8"
      >
        {acceptedRequest ? (
          <div className="space-y-8">
            <AcceptedDateDetails request={acceptedRequest} />

            {events.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Events You Might Both Enjoy
                  </h3>
                  <p className="text-gray-600">
                    Here are some events that match your shared interests:
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map((event, index) => (
                    <motion.div
                      key={`${event.title}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {renderEventCard(event, index)}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : hasPendingOutgoingRequest && lastRequestedProfile ? (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Invite Sent!
                </h2>
                <p className="text-gray-600">
                  We'll notify you when {lastRequestedProfile.basicInfo.name} responds to your invite.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-4">
                <img
                  src={lastRequestedProfile.photo}
                  alt={lastRequestedProfile.basicInfo.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div className="text-left">
                  <h3 className="font-medium text-lg">{lastRequestedProfile.basicInfo.name}</h3>
                  <p className="text-gray-600">{lastRequestedProfile.basicInfo.location}</p>
                </div>
              </div>
            </div>

            {events.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    While You Wait...
                  </h3>
                  <p className="text-gray-600">
                    Check out these local events that match your interests:
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map((event, index) => (
                    <motion.div
                      key={`${event.title}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {renderEventCard(event, index)}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : availableProfiles.length > 0 ? (
          <DiscoveryProfile
            profile={availableProfiles[currentProfileIndex]}
            onSkip={handleSkip}
            onProposeDate={handleProposeDate}
          />
        ) : (
          <div className="text-center py-8 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600">No more profiles available</p>
            <p className="text-sm text-gray-500 mt-2">
              Check back later for new matches!
            </p>
          </div>
        )}
      </motion.div>
    );
  };

  // Update the requests view to show more details
  const renderRequestsView = () => (
    <motion.div
      key="requests"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <h2 className="text-xl font-semibold text-gray-900">Date Requests</h2>
      {dateRequests
        .filter(request => request.status === 'pending' && request.recipientId === currentUser.uid)
        .map(request => {
          const sender = SAMPLE_PROFILES.find(p => p.id === request.senderId);
          if (!sender) return null;
          
          return (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center gap-6">
                <img
                  src={sender.photo}
                  alt={sender.basicInfo.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-1">{sender.basicInfo.name}</h3>
                  <p className="text-gray-600 mb-2">{sender.basicInfo.location}</p>
                  {request.dateDetails && (
                    <div className="text-sm text-gray-600">
                      <p>Suggested: {request.dateDetails.activity}</p>
                      <p>{request.dateDetails.day} at {request.dateDetails.time}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleAcceptRequest(request)}
                    className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleViewRequest(request)}
                    className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      {dateRequests.filter(r => r.status === 'pending' && r.recipientId === currentUser.uid).length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-600">No pending requests</p>
          <p className="text-sm text-gray-500 mt-2">
            When someone sends you a date request, it will appear here
          </p>
        </div>
      )}
    </motion.div>
  );

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }

    const checkExistingRequests = async () => {
      const sentRequestsQuery = query(
        collection(db, 'dateRequests'),
        where('senderId', '==', currentUser.uid)
      );

      const receivedRequestsQuery = query(
        collection(db, 'dateRequests'),
        where('recipientId', '==', currentUser.uid)
      );

      const unsubscribeSent = onSnapshot(sentRequestsQuery, (snapshot) => {
        handleRequestsSnapshot(snapshot, 'sent');
      });

      const unsubscribeReceived = onSnapshot(receivedRequestsQuery, (snapshot) => {
        handleRequestsSnapshot(snapshot, 'received');
      });

      return () => {
        unsubscribeSent();
        unsubscribeReceived();
      };
    };

    const handleRequestsSnapshot = (snapshot, type) => {
      const requests = new Map();
      let hasAcceptedInvite = false;
      let acceptedInviteData = null;
      let hasPendingOutgoing = false;
      let hasPendingIncoming = false;
      let lastRequested = null;
      
      snapshot.forEach((doc) => {
        const request = { id: doc.id, ...doc.data() };
        requests.set(doc.id, request);

        // Check for accepted, pre_verification, or pending confirmation invites
        if (request.status === 'accepted' || 
            request.status === 'pre_verification' || 
            request.status === 'pending_confirmation') {
          hasAcceptedInvite = true;
          acceptedInviteData = request;
          
          const otherUserId = request.senderId === currentUser.uid ? request.recipientId : request.senderId;
          const otherProfile = SAMPLE_PROFILES.find(p => p.id === otherUserId);
          
          if (otherProfile) {
            const sharedActivities = otherProfile.activities || [];
            const relevantEvents = events.filter(event => 
              sharedActivities.some(activity => 
                event.title.toLowerCase().includes(activity.toLowerCase()) || 
                event.description.toLowerCase().includes(activity.toLowerCase())
              )
            );
            
            setEvents(prevEvents => {
              const nonRelevantEvents = prevEvents.filter(e => 
                !relevantEvents.find(re => re.title === e.title)
              );
              return [...relevantEvents, ...nonRelevantEvents];
            });
          }
        }
        
        // Check for pending requests
        if (request.status === 'pending') {
          if (type === 'sent') {
            hasPendingOutgoing = true;
            const recipientProfile = SAMPLE_PROFILES.find(p => p.id === request.recipientId);
            if (recipientProfile) {
              lastRequested = recipientProfile;
            }
          } else if (type === 'received') {
            hasPendingIncoming = true;
            // If we have incoming requests, switch to requests view
            setCurrentView('requests');
          }
        }
      });

      // Update states based on request status
      setHasPendingOutgoingRequest(prev => prev || hasPendingOutgoing);
      if (lastRequested) setLastRequestedProfile(lastRequested);
      
      // If there's an accepted invite or pre-verification, both users should see the appropriate screen
      if (hasAcceptedInvite) {
        setCurrentView('discovery');
        setHasPendingOutgoingRequest(true);
        
        const otherUserId = acceptedInviteData.senderId === currentUser.uid 
          ? acceptedInviteData.recipientId 
          : acceptedInviteData.senderId;
        const otherProfile = SAMPLE_PROFILES.find(p => p.id === otherUserId);
        setLastRequestedProfile(otherProfile);
      }

      // Update state with unique requests
      setDateRequests(prev => {
        const newRequests = Array.from(requests.values());
        const existingIds = new Set(prev.map(r => r.id));
        const uniqueNewRequests = newRequests.filter(r => !existingIds.has(r.id));
        return [...prev, ...uniqueNewRequests];
      });
      
      setPendingRequests(prev => {
        const newPending = Array.from(requests.values()).filter(r => r.status === 'pending');
        const existingIds = new Set(prev.map(r => r.id));
        const uniqueNewPending = newPending.filter(r => !existingIds.has(r.id));
        return [...prev, ...uniqueNewPending];
      });

      // Show toast for incoming requests
      if (hasPendingIncoming) {
        toast.success(
          <div className="space-y-2">
            <div className="font-medium">New Date Request!</div>
            <div className="text-sm">Someone wants to connect with you</div>
          </div>,
          { duration: 5000, id: 'incoming-request' }
        );
      }

      // Filter available profiles
      const unavailableProfileIds = new Set(
        Array.from(requests.values()).flatMap(request => [request.senderId, request.recipientId])
      );
      
      setAvailableProfiles(prev => {
        const filteredProfiles = SAMPLE_PROFILES.filter(profile => 
          profile.id !== currentUser.uid && 
          !unavailableProfileIds.has(profile.id) &&
          !hasAcceptedInvite // Don't show profiles if there's an accepted invite
        );
        return filteredProfiles;
      });
      
      setCurrentProfileIndex(0);
      setIsLoading(false);
    };

    checkExistingRequests();
  }, [currentUser, navigate, events]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Navigation Tabs - Hide when there's an accepted invite */}
      {!dateRequests.some(r => r.status === 'accepted') && (
        <div className="flex justify-between items-center mb-6">
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
              {pendingRequests.some(r => r.recipientId === currentUser.uid) && (
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
            </div>
          )}

      {/* Main Content */}
      <div className="relative">
        {/* Always show discovery view when there's an accepted invite */}
        {dateRequests.some(r => r.status === 'accepted') ? (
          renderDiscoveryView()
        ) : (
          <>
            {currentView === 'discovery' && renderDiscoveryView()}
            {currentView === 'requests' && renderRequestsView()}
            {currentView === 'dates' && renderDatesView()}
          </>
        )}
      </div>

      {/* Overlay for expanded event card */}
      <AnimatePresence>
        {expandedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setExpandedEvent(null)}
          >
            {renderEventCard(expandedEvent, 0, true)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 