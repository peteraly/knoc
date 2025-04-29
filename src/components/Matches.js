import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc, getDoc, serverTimestamp, arrayUnion, addDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Profile from './Profile';
import DiscoveryProfile from './DiscoveryProfile';
import MapView from './MapView';
import DateSuggestionModal from './DateSuggestionModal';
import UserSwitcher from './UserSwitcher';
import { auth } from '../utils/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import DashboardHeader from './DashboardHeader';
import { useAuthState } from 'react-firebase-hooks/auth';
import { SAMPLE_PROFILES, SAMPLE_DATE_REQUESTS, SAMPLE_CONFIRMED_DATES } from '../utils/seedData';

// Add notification helper function
const addNotification = async ({ userId, type, message, dateRequestId }) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type,
      message,
      dateRequestId,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding notification:', error);
  }
};

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

// Test user credentials
const TEST_USERS = {
  profile1: {
    email: 'sarah@test.com',
    password: 'testpass123'
  },
  profile2: {
    email: 'michael@test.com',
    password: 'testpass123'
  },
  profile3: {
    email: 'emma@test.com',
    password: 'testpass123'
  },
  profile4: {
    email: 'james@test.com',
    password: 'testpass123'
  },
  profile5: {
    email: 'alex@test.com',
    password: 'testpass123'
  },
  profile6: {
    email: 'jordan@test.com',
    password: 'testpass123'
  }
};

// Add RequestCard component
const RequestCard = ({ request, type, onAccept, onDecline }) => {
  // Get the other user's profile (sender for received requests, recipient for sent requests)
  const otherUserId = type === 'Received' ? request.senderId : request.recipientId;
  const profile = SAMPLE_PROFILES.find(p => p.id === otherUserId);

  if (!profile) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-start space-x-4">
        {/* Profile Photo */}
        <img
          src={profile.photo}
          alt={profile.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        
        {/* Request Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-gray-900">{profile.name}</h4>
              <p className="text-sm text-gray-500">{profile.age} years old</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              type === 'Received' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {type}
            </span>
          </div>

          {/* Date Details */}
          {request.dateDetails && (
            <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Proposed Date Details</h5>
              <div className="space-y-1">
                <p><span className="font-medium">Activity:</span> {request.dateDetails.activity}</p>
                <p><span className="font-medium">When:</span> {request.dateDetails.day} at {request.dateDetails.time}</p>
                <p><span className="font-medium">Where:</span> {request.dateDetails.venue}</p>
              </div>
            </div>
          )}

          {/* Action Buttons - Only show for received requests */}
          {type === 'Received' && (
            <div className="mt-4 space-y-3">
              <div className="text-sm text-gray-600">
                Would you like to confirm this date proposal?
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onAccept}
                  className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 flex-1 flex items-center justify-center space-x-2"
                >
                  <span>Confirm Date</span>
                  <span className="text-lg">✓</span>
                </button>
                <button
                  onClick={onDecline}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex-1 flex items-center justify-center space-x-2"
                >
                  <span>Decline</span>
                  <span className="text-lg">×</span>
                </button>
              </div>
            </div>
          )}

          {/* Status for sent requests */}
          {type === 'Sent' && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 italic">
                Waiting for {profile.name} to confirm...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Create a context for shared state
const MatchContext = createContext();

export function MatchProvider({ children }) {
  const [sharedState, setSharedState] = useState({
    dateRequests: [],
    currentView: 'discovery',
    pendingRequests: [],
    confirmedRequests: []
  });

  const updateSharedState = (updates) => {
    setSharedState(prev => ({
      ...prev,
      ...updates
    }));
  };

  return (
    <MatchContext.Provider value={{ sharedState, updateSharedState }}>
      {children}
    </MatchContext.Provider>
  );
}

export default function Matches({ currentView: initialView = 'discovery', autoLoginUserId, isSplitView }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { sharedState, updateSharedState } = useContext(MatchContext);
  const [dateRequests, setDateRequests] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [profilesWithPendingRequests, setProfilesWithPendingRequests] = useState(new Set());
  const [hasPendingOutgoingRequest, setHasPendingOutgoingRequest] = useState(false);
  const [activeDate, setActiveDate] = useState(null);
  const [lastRequestedProfile, setLastRequestedProfile] = useState(null);
  const [userInterests, setUserInterests] = useState(new Set());
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [currentView, setCurrentView] = useState(initialView);
  const [pendingRequests, setPendingRequests] = useState([]);
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
  const [loading, setLoading] = useState(false);
  const [sharedEvents, setSharedEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

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

  const handleSkip = useCallback(() => {
    console.log('Skipping profile', currentProfileIndex, 'of', profiles.length);
    
    // Add the current profile to skipped profiles if needed
    const currentProfile = profiles[currentProfileIndex];
    if (currentProfile) {
      console.log('Skipping profile:', currentProfile.name);
    }
    
    setCurrentProfileIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % profiles.length;
      console.log('Moving to profile', nextIndex);
      if (nextIndex === 0) {
        toast.info("You've seen all profiles! Starting over from the beginning.");
      }
      return nextIndex;
    });
  }, [currentProfileIndex, profiles.length, profiles]);

  const findSharedEvents = async (matchId) => {
    try {
      // Get current user's event interests
      const userEventsRef = collection(db, 'users', currentUser.uid, 'eventInterests');
      const userEventsSnap = await getDocs(userEventsRef);
      const userEvents = userEventsSnap.docs.map(doc => doc.data().eventId);

      // Get match's event interests
      const matchEventsRef = collection(db, 'users', matchId, 'eventInterests');
      const matchEventsSnap = await getDocs(matchEventsRef);
      const matchEvents = matchEventsSnap.docs.map(doc => doc.data().eventId);

      // Find overlapping events
      const overlappingEvents = userEvents.filter(eventId => 
        matchEvents.includes(eventId)
      );

      // Get full event details
      const sharedEventDetails = await Promise.all(
        overlappingEvents.map(async (eventId) => {
          const eventDoc = await getDoc(doc(db, 'events', eventId));
          return { id: eventId, ...eventDoc.data() };
        })
      );

      // Update state with shared events
      setSharedEvents(sharedEventDetails);
      
      // Return the shared events array
      return sharedEventDetails;
    } catch (error) {
      console.error('Error finding shared events:', error);
      toast.error('Failed to load shared events');
      return []; // Return empty array on error
    }
  };

  const handleProposeDate = async (profile) => {
    // Show the date suggestion modal first
    setSelectedProfile(profile);
    setShowDateModal(true);
  };

  const handleDateDetailsSubmit = async (dateDetails) => {
    try {
      setLoading(true);

      if (selectedRequest) {
        // Handle accepting a received request
        const requestRef = doc(db, 'dateRequests', selectedRequest.id);
        await updateDoc(requestRef, {
          status: 'accepted',
          dateDetails,
          lastUpdated: new Date(),
          participants: [selectedRequest.senderId, selectedRequest.recipientId] // Ensure participants are set
        });

        // Close modal and update state
        setShowDateModal(false);
        setSelectedRequest(null);

        // Show success message
        toast.success('Date details sent! Waiting for confirmation.');
      } else if (selectedProfile) {
        // Handle sending a new request
        const currentUserId = isSplitView ? autoLoginUserId : currentUser.uid;
        const newRequest = {
          id: Date.now().toString(),
          senderId: currentUserId,
          recipientId: selectedProfile.id,
          status: 'pending',
          createdAt: new Date(),
          lastUpdated: new Date(),
          participants: [currentUserId, selectedProfile.id], // Ensure both users are in participants
          dateDetails
        };

        if (isSplitView) {
          // In split view, update the shared dateRequests state
          setDateRequests(prev => {
            const updatedRequests = prev.map(r => 
              r.id === newRequest.id ? newRequest : r
            );
            return updatedRequests;
          });

          // Update pending requests state
          setPendingRequests(prev => {
            const filteredRequests = prev.filter(r => 
              !(r.participants.includes(newRequest.senderId) && r.participants.includes(newRequest.recipientId))
            );
            return [...filteredRequests, newRequest];
          });

          // Update profiles with pending requests
          setProfilesWithPendingRequests(prev => new Set([...prev, selectedProfile.id]));
          
          // Hide the profile from discovery
          setProfiles(prev => prev.filter(p => p.id !== selectedProfile.id));
        } else {
          // In regular mode, add to Firestore
          await addDoc(collection(db, 'dateRequests'), newRequest);
        }

        // Update local state
        setLastRequestedProfile(selectedProfile);
        setCurrentView('requests');
        
        // Close the modal
        setShowDateModal(false);
        setSelectedProfile(null);

        // Show success message
        toast.success(
          <div className="space-y-2">
            <div className="font-medium">Date Request Sent!</div>
            <div className="text-sm">We'll notify you when {selectedProfile.name} responds</div>
          </div>
        );
      }
    } catch (error) {
      console.error('Error handling date details:', error);
      toast.error('Failed to process date details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = (request, newStatus) => {
    // Create the updated request object
    const updatedRequest = {
      ...request,
      status: newStatus,
      confirmedAt: newStatus === 'confirmed' ? new Date().toISOString() : undefined,
      lastUpdated: new Date().toISOString()
    };

    // Update all state in one go to maintain consistency
    setDateRequests(prev => {
      // Remove the old request and add the updated one
      const otherRequests = prev.filter(r => r.id !== request.id);
      return [...otherRequests, updatedRequest];
    });

    // Update pending requests
    setPendingRequests(prev => prev.filter(r => r.id !== request.id));

    // Update profiles with pending requests
    setProfilesWithPendingRequests(prev => {
      const newSet = new Set(prev);
      if (request.participants) {
        request.participants.forEach(participantId => {
          newSet.delete(participantId);
        });
      }
      return newSet;
    });

    return updatedRequest;
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      // First update the view state to ensure UI updates
      setCurrentView('dates');
      updateSharedState(prevState => ({
        ...prevState,
        currentView: 'dates'
      }));

      if (isSplitView) {
        // In split view, update local state only
        const request = dateRequests.find(r => r.id === requestId);
        if (!request) {
          toast.error('Request not found');
          return;
        }

        const updatedRequest = {
          ...request,
          status: 'confirmed',
          confirmedAt: new Date(),
          lastUpdated: new Date(),
          participants: request.participants || [request.senderId, request.recipientId]
        };

        // Update the shared state atomically for both profiles
        updateSharedState(prevState => {
          const updatedDateRequests = prevState.dateRequests.map(r => 
            r.id === requestId ? updatedRequest : r
          );
          
          return {
            ...prevState,
            dateRequests: updatedDateRequests,
            pendingRequests: prevState.pendingRequests.filter(r => r.id !== requestId),
            currentView: 'dates'
          };
        });

        // Update local state for the current profile
        setDateRequests(prev => prev.map(r => 
          r.id === requestId ? updatedRequest : r
        ));
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));

        // Force a refresh of both views
        setTimeout(() => {
          const event = new Event('visibilitychange');
          document.dispatchEvent(event);
        }, 100);

        toast.success('Date request accepted! Check the Dates tab to view details.');
      } else {
        // In regular mode, update Firestore
        const requestRef = doc(db, 'dateRequests', requestId);
        const request = dateRequests.find(r => r.id === requestId);
        
        if (!request) {
          toast.error('Request not found');
          return;
        }

        // Update the request status in Firestore
        await updateDoc(requestRef, {
          status: 'confirmed',
          confirmedAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          participants: request.participants || [request.senderId, request.recipientId]
        });

        // Update notifications
        await addNotification({
          userId: request.senderId,
          type: 'date_request_accepted',
          message: `${request.recipientName || 'Someone'} accepted your date request!`,
          dateRequestId: requestId
        });

        // Update the shared state atomically
        updateSharedState(prevState => ({
          ...prevState,
          dateRequests: prevState.dateRequests.map(r => 
            r.id === requestId 
              ? { ...r, status: 'confirmed', confirmedAt: new Date(), participants: request.participants || [request.senderId, request.recipientId] }
              : r
          ),
          pendingRequests: prevState.pendingRequests.filter(r => r.id !== requestId),
          currentView: 'dates'
        }));

        // Update local state
        setDateRequests(prev => prev.map(r => 
          r.id === requestId 
            ? { ...r, status: 'confirmed', confirmedAt: new Date(), participants: request.participants || [request.senderId, request.recipientId] }
            : r
        ));
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));

        // Force a refresh of both views
        setTimeout(() => {
          const event = new Event('visibilitychange');
          document.dispatchEvent(event);
        }, 100);

        toast.success('Date request accepted! Check the Dates tab to view details.');
      }
    } catch (error) {
      console.error('Error accepting date request:', error);
      toast.error('Failed to accept date request. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const requestRef = doc(db, 'dateRequests', requestId);
      
      // Update the request status in Firestore
      await updateDoc(requestRef, {
        status: 'declined',
        declinedAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      // Update notifications
      await addNotification({
        userId: dateRequests.find(r => r.id === requestId).senderId,
        type: 'date_request_declined',
        message: `${dateRequests.find(r => r.id === requestId).recipientName} declined your date request`,
        dateRequestId: requestId
      });

      // Update the shared state atomically
      updateSharedState(prevState => ({
        dateRequests: prevState.dateRequests.map(r => 
          r.id === requestId 
            ? { ...r, status: 'declined', declinedAt: new Date() }
            : r
        ),
        pendingRequests: prevState.pendingRequests.filter(r => r.id !== requestId)
      }));

      toast.success('Date request declined');
      
    } catch (error) {
      console.error('Error declining date request:', error);
      toast.error('Failed to decline date request');
    }
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

      // Add to user's interested events in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        interestedEvents: arrayUnion(eventId)
      });

      // Update UI state to show interest
      setUserInterests(prev => new Set([...prev, event.title]));
      
      // Check if any matches are also interested in this event
      const matchInterests = await checkMatchInterests(eventId);
      
      if (matchInterests.length > 0) {
        // Show notification about shared interest
        toast.success(
          <div className="space-y-2">
            <div className="font-medium">Shared Interest!</div>
            <div className="text-sm">
              {matchInterests.length} {matchInterests.length === 1 ? 'match is' : 'matches are'} also interested in {event.title}
            </div>
            <button 
              onClick={() => navigate('/matches', { state: { view: 'discovery', sharedEvent: event } })}
              className="text-sm text-rose-500 underline"
            >
              View matches
            </button>
          </div>,
          { duration: 5000 }
        );
      } else {
        // Regular success message
        toast.success(`Added ${event.title} to your interested events!`);
      }
    } catch (error) {
      console.error('Error marking event interest:', error);
      toast.error('Failed to save event interest');
    }
  };
  
  // Helper function to check if any matches are interested in the same event
  const checkMatchInterests = async (eventId) => {
    try {
      // Get all matches
      const matchesQuery = query(
        collection(db, 'matches'),
        where('participants', 'array-contains', currentUser.uid),
        where('status', '==', 'accepted')
      );
      
      const matchesSnapshot = await getDocs(matchesQuery);
      const matchIds = matchesSnapshot.docs.map(doc => {
        const data = doc.data();
        return data.participants.find(id => id !== currentUser.uid);
      });
      
      // Check each match's interested events
      const interestedMatches = [];
      for (const matchId of matchIds) {
        const matchDoc = await getDoc(doc(db, 'users', matchId));
        if (matchDoc.exists()) {
          const matchData = matchDoc.data();
          if (matchData.interestedEvents?.includes(eventId)) {
            interestedMatches.push(matchData);
          }
        }
      }
      
      return interestedMatches;
    } catch (error) {
      console.error('Error checking match interests:', error);
      return [];
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
              alt={otherUser.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {otherUser.name}
              </h3>
              <p className="text-gray-600">{otherUser.age} years old</p>
            </div>
          </div>
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            Active Date
          </div>
        </div>

        {/* Date Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Date Details</h4>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-medium">Activity:</span> {request.dateDetails?.activity}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">When:</span> {request.dateDetails?.day} at {request.dateDetails?.time}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Where:</span> {request.dateDetails?.venue}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => handleDateComplete(request.id)}
            className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600"
          >
            Complete Date
          </button>
          <button
            onClick={() => handleCancelDate(request.id)}
            className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600"
          >
            Cancel Date
          </button>
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
              alt={otherUser?.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{otherUser?.name}</h3>
              <p className="text-gray-600">{otherUser?.age} years old</p>
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
                <p className="text-gray-600">Show this code to {otherUser?.name}</p>
                <p className="text-sm text-gray-500 mt-2">Code: {verificationCode}</p>
              </div>
            ) : isVerificationStarted ? (
              <div key="verification-input" className="space-y-4">
                <p className="text-gray-600 mb-2">Enter the code shown by {otherUser?.name}:</p>
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

  const renderRequestsView = () => {
    // Filter requests based on current user
    const userId = isSplitView ? autoLoginUserId : currentUser?.uid;
    console.log('Current user ID for requests:', userId);
    console.log('All requests:', dateRequests);
    
    // Get only pending requests for the current user
    const userRequests = dateRequests.filter(request => 
      request.status === 'pending' &&  // Only show pending requests
      (request.senderId === userId || request.recipientId === userId)  // User is either sender or recipient
    );
    
    console.log('Filtered pending requests for user:', userRequests);

    // Separate sent and received requests
    const sentRequests = userRequests.filter(request => request.senderId === userId);
    const receivedRequests = userRequests.filter(request => request.recipientId === userId);

    console.log('Sent requests:', sentRequests);
    console.log('Received requests:', receivedRequests);

    if (userRequests.length === 0) {
      return (
        <div className="text-center text-gray-500 mt-8">
          <p>No pending requests yet.</p>
          <p className="text-sm mt-2">When you send or receive date requests, they'll appear here!</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Show Received Requests first */}
        {receivedRequests.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Received Requests</h3>
            {receivedRequests.map(request => (
              <RequestCard
                key={request.id}
                request={request}
                type="Received"
                onAccept={() => handleAcceptRequest(request.id)}
                onDecline={() => handleRejectRequest(request.id)}
              />
            ))}
          </div>
        )}

        {/* Then show Sent Requests */}
        {sentRequests.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Sent Requests</h3>
            {sentRequests.map(request => (
              <RequestCard
                key={request.id}
                request={request}
                type="Sent"
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDatesView = () => {
    // Get current user ID based on context
    const currentUserId = isSplitView ? autoLoginUserId : currentUser?.uid;
    
    // Filter confirmed dates for the current user
    const confirmedDates = dateRequests.filter(request => 
      request.status === 'confirmed' && 
      request.participants.includes(currentUserId)
    );

    console.log('Rendering dates view:', {
      currentUserId,
      allRequests: dateRequests,
      confirmedDates
    });

    return (
      <motion.div
        key="dates"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-6"
      >
        <h2 className="text-xl font-semibold text-gray-900">Your Dates</h2>
        
        {/* Confirmed Dates */}
        {confirmedDates.map(request => {
          // Get the other user's ID and profile
          const otherUserId = request.senderId === currentUserId ? request.recipientId : request.senderId;
          const otherProfile = SAMPLE_PROFILES.find(p => p.id === otherUserId);

          return (
            <div key={`date-${request.id}`} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start space-x-4">
                {/* Profile Photo */}
                <img
                  src={otherProfile?.photo}
                  alt={otherProfile?.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                
                {/* Date Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{otherProfile?.name}</h3>
                      <p className="text-sm text-gray-500">
                        Confirmed on {new Date(request.confirmedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      Confirmed
                    </span>
                  </div>

                  {/* Date Details Card */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h4 className="font-medium text-gray-900">Date Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Activity</p>
                        <p className="font-medium">{request.dateDetails.activity}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">When</p>
                        <p className="font-medium">
                          {request.dateDetails.day} at {request.dateDetails.time}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Where</p>
                        <p className="font-medium">{request.dateDetails.venue}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => handleStartVerification(request.id)}
                      className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
                    >
                      Start Date
                    </button>
                    <button
                      onClick={() => handleCancelDate(request.id)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    >
                      Cancel Date
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* No Dates Message */}
        {confirmedDates.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600">No confirmed dates yet</p>
            <p className="text-sm text-gray-500 mt-2">
              When you confirm a date request, it will appear here
            </p>
          </div>
        )}
      </motion.div>
    );
  };

  // Add Firebase listener for date requests
  useEffect(() => {
    // Early return if neither currentUser nor isSplitView is available
    if (!currentUser && !isSplitView) return;

    if (isSplitView) {
      // Initialize sample request if needed
      if (dateRequests.length === 0) {
        const sampleRequest = {
          id: 'sample-request-1',
          senderId: 'profile1',
          recipientId: 'profile2',
          status: 'pending',
          createdAt: new Date(),
          lastUpdated: new Date(),
          participants: ['profile1', 'profile2'],
          dateDetails: {
            activity: 'Hiking',
            day: 'Monday',
            time: 'Evening',
            venue: 'Local Trail'
          }
        };
        setDateRequests([sampleRequest]);
        
        // Also update the shared state
        updateSharedState(prevState => ({
          ...prevState,
          dateRequests: [sampleRequest]
        }));
      }

      // Update pending requests based on current user
      const userRequests = dateRequests.filter(request => 
        request.participants.includes(autoLoginUserId) &&
        request.status === 'pending'
      );
      
      // Update shared state instead of local state
      updateSharedState(prevState => ({
        ...prevState,
        pendingRequests: userRequests,
        dateRequests: dateRequests // Ensure all date requests are in shared state
      }));

      // Update profiles with pending requests
      const pendingIds = new Set(userRequests.flatMap(request => request.participants));
      setProfilesWithPendingRequests(pendingIds);

      setIsLoading(false);
    } else {
      // Only proceed with Firestore listener if we have a currentUser
      if (!currentUser?.uid) return;

      // Set up Firestore listener for real users
      const q = query(
        collection(db, 'dateRequests'),
        where('participants', 'array-contains', currentUser.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const requests = [];
        const pendingProfileIds = new Set();
        
        snapshot.forEach((doc) => {
          const request = { id: doc.id, ...doc.data() };
          
          if (request.status === 'pending' || request.status === 'active') {
            const otherUserId = request.senderId === currentUser.uid ? request.recipientId : request.senderId;
            pendingProfileIds.add(otherUserId);
          }
          
          requests.push(request);
        });

        setDateRequests(requests);
        setProfilesWithPendingRequests(pendingProfileIds);
        
        const pendingReqs = requests.filter(r => r.status === 'pending');
        
        // Update shared state instead of local state
        updateSharedState(prevState => ({
          ...prevState,
          pendingRequests: pendingReqs
        }));
        
        setHasPendingOutgoingRequest(pendingReqs.some(r => r.senderId === currentUser.uid));
        
        // Filter available profiles
        const availableProfiles = SAMPLE_PROFILES.filter(profile => 
          !pendingProfileIds.has(profile.id) &&
          !requests.some(r => r.status === 'active' && [r.senderId, r.recipientId].includes(profile.id))
        );
        
        setProfiles(availableProfiles);
        setIsLoading(false);
        
        if (currentProfileIndex >= availableProfiles.length) {
          setCurrentProfileIndex(0);
        }
      });

      return () => unsubscribe();
    }
  }, [currentUser, isSplitView, autoLoginUserId, dateRequests, currentProfileIndex]);

  const handleStartVerification = async (requestId) => {
    try {
      let request;
      
      if (isSplitView) {
        // In split view, get request from local state
        request = dateRequests.find(r => r.id === requestId);
        if (!request) {
          toast.error('Date request not found');
          return;
        }
      } else {
        // In regular mode, get request from Firestore
        const requestRef = doc(db, 'dateRequests', requestId);
        const requestDoc = await getDoc(requestRef);
        if (!requestDoc.exists()) {
          toast.error('Date request not found');
          return;
        }
        request = requestDoc.data();
      }
      
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      console.log('Generated code:', code);
      
      // Update local state immediately
      const newState = {
        requestId,
        code,
        startedBy: isSplitView ? autoLoginUserId : currentUser.uid
      };
      updateVerificationState(newState);
      console.log('Updated local verification state with code:', code);

      if (isSplitView) {
        // In split view, just update local state
        setDateRequests(prev => prev.map(req => {
          if (req.id === requestId) {
            return {
              ...req,
              status: 'pre_verification',
              preVerificationCode: code,
              verificationStartedBy: autoLoginUserId,
              lastUpdated: new Date()
            };
          }
          return req;
        }));
      } else {
        // In regular mode, update Firestore
        const requestRef = doc(db, 'dateRequests', requestId);
        await updateDoc(requestRef, {
          status: 'pre_verification',
          preVerificationCode: code,
          verificationStartedBy: currentUser.uid,
          lastUpdated: serverTimestamp()
        });
      }
      
      console.log('Request updated successfully with code:', code);
      toast.success('Verification code generated!');
    } catch (error) {
      console.error('Error starting verification:', error);
      toast.error('Failed to start verification');
    }
  };

  const handleVerifyCode = async (requestId) => {
    try {
      let request;
      
      if (isSplitView) {
        // In split view, get request from local state
        request = dateRequests.find(r => r.id === requestId);
      } else {
        // In regular mode, get request from Firestore
        const requestRef = doc(db, 'dateRequests', requestId);
        const requestDoc = await getDoc(requestRef);
        if (!requestDoc.exists()) {
          toast.error('Date request not found');
          return;
        }
        request = requestDoc.data();
      }
      
      if (request.preVerificationCode !== confirmationCode) {
        toast.error('Incorrect verification code');
        setConfirmationCode('');
        return;
      }

      if (isSplitView) {
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
      } else {
        // Update Firestore
        const requestRef = doc(db, 'dateRequests', requestId);
        await updateDoc(requestRef, {
          status: 'active',
          verifiedAt: serverTimestamp(),
          lastUpdated: serverTimestamp()
        });
      }

      toast.success('Date verified! Have a great time!');
      setConfirmationCode('');
      
    } catch (error) {
      console.error('Error verifying code:', error);
      toast.error('Failed to verify code');
    }
  };

  const renderDiscoveryView = () => {
    if (isLoading) {
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
          <p className="text-gray-600 text-center mb-6">Check back later for new potential matches</p>
          <button
            onClick={handleRefreshProfiles}
            className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            Refresh Profiles
          </button>
        </div>
      );
    }

    const currentProfile = profiles[currentProfileIndex];
    console.log('Rendering profile:', currentProfileIndex, 'of', profiles.length, currentProfile?.name);
    
    return (
      <div className="flex-1 relative h-[calc(100vh-200px)]">
        <DiscoveryProfile
          profile={currentProfile}
          onSkip={handleSkip}
          onProposeDate={handleProposeDate}
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

  const handleCancelDate = async (dateId) => {
    try {
      const dateRef = doc(db, 'dateRequests', dateId);
      await updateDoc(dateRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        cancelledBy: currentUser.uid
      });

      // Show success message
      toast.success('Date cancelled successfully');
      
      // Reset view to discovery
      setCurrentView('discovery');
      
      // Reset any pending request states
      setHasPendingOutgoingRequest(false);
      setLastRequestedProfile(null);
      
    } catch (error) {
      console.error('Error cancelling date:', error);
      toast.error('Failed to cancel date. Please try again.');
    }
  };

  const handleRefreshProfiles = () => {
    // Filter out profiles that have pending requests or active dates
    const availableProfiles = SAMPLE_PROFILES.filter(profile => 
      !profilesWithPendingRequests.has(profile.id) &&
      !dateRequests.some(r => 
        r.status === 'active' && 
        [r.senderId, r.recipientId].includes(profile.id)
      )
    );
    
    setProfiles(availableProfiles);
    setCurrentProfileIndex(0);
    toast.success('Profiles refreshed!');
  };

  const renderEventSuggestions = (profile) => {
    if (sharedEvents.length === 0) return null;

    return (
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-900">Suggested Events</h4>
        <div className="grid grid-cols-2 gap-2">
          {sharedEvents.map(event => (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={`p-2 rounded-lg text-left text-sm ${
                selectedEvent?.id === event.id
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="font-medium">{event.title}</div>
              <div className="text-xs">
                {event.date} • {event.time}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderMatchCard = (match) => (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* Existing match card content */}
      {/* ... existing code ... */}

      {/* Add event suggestions */}
      {renderEventSuggestions(match)}
      
      {/* Update action buttons */}
      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => handleProposeDate(match)}
          className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
        >
          {selectedEvent ? 'Plan Date at Event' : 'Plan Date'}
        </button>
        <button
          onClick={() => handleSkip(match.id)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Skip
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    if (isSplitView && autoLoginUserId && TEST_USERS[autoLoginUserId]) {
      const { email, password } = TEST_USERS[autoLoginUserId];
      
      // First check if we're already signed in as this user
      if (auth.currentUser?.email === email) {
        return; // Already signed in as the correct user
      }

      // Sign out first to ensure clean state
      auth.signOut().then(() => {
        // Then sign in with the test user
        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            console.log('Auto-login successful for:', email);
          })
          .catch(error => {
            console.error('Auto-login failed:', error);
            toast.error('Failed to auto-login. Please try again.');
          });
      }).catch(error => {
        console.error('Sign out failed:', error);
        toast.error('Failed to switch users. Please try again.');
      });
    }
  }, [isSplitView, autoLoginUserId]);

  const handleCancelRequest = async (request) => {
    try {
      const requestRef = doc(db, 'dateRequests', request.id);
      
      // Update the request status in Firestore
      await updateDoc(requestRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      // Update notifications
      await addNotification({
        userId: request.toUserId,
        type: 'date_request_cancelled',
        message: `${request.fromUserName} cancelled their date request`,
        dateRequestId: request.id
      });

      // Update the shared state atomically
      updateSharedState(prevState => ({
        dateRequests: prevState.dateRequests.map(r => 
          r.id === request.id 
            ? { ...r, status: 'cancelled', cancelledAt: new Date() }
            : r
        ),
        pendingRequests: prevState.pendingRequests.filter(r => r.id !== request.id)
      }));

      toast.success('Date request cancelled');
      
    } catch (error) {
      console.error('Error cancelling date request:', error);
      toast.error('Failed to cancel date request');
    }
  };

  const handleWithdrawRequest = async (request) => {
    try {
      const requestRef = doc(db, 'dateRequests', request.id);
      
      // Update the request status in Firestore
      await updateDoc(requestRef, {
        status: 'withdrawn',
        withdrawnAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      // Update notifications
      await addNotification({
        userId: request.toUserId,
        type: 'date_request_withdrawn',
        message: `${request.fromUserName} withdrew their date request`,
        dateRequestId: request.id
      });

      // Update the shared state atomically
      updateSharedState(prevState => ({
        dateRequests: prevState.dateRequests.map(r => 
          r.id === request.id 
            ? { ...r, status: 'withdrawn', withdrawnAt: new Date() }
            : r
        ),
        pendingRequests: prevState.pendingRequests.filter(r => r.id !== request.id)
      }));

      toast.success('Date request withdrawn');
      
    } catch (error) {
      console.error('Error withdrawing date request:', error);
      toast.error('Failed to withdraw date request');
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
    <div className={`${isSplitView ? '' : 'min-h-screen'} bg-gray-50`}>
      {/* Add DashboardHeader */}
      {!isSplitView && <DashboardHeader userId={autoLoginUserId} />}

      <div className={`${isSplitView ? '' : 'max-w-4xl mx-auto px-4'} py-8`}>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Find Matches</h2>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => {
                updateSharedState({ currentView: 'discovery' });
                setCurrentView('discovery');
              }}
              className={`px-4 py-2 ${
                (sharedState.currentView === 'discovery' || currentView === 'discovery')
                  ? 'border-b-2 border-rose-500 text-rose-500 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Discovery
            </button>
            <button
              onClick={() => {
                updateSharedState({ currentView: 'requests' });
                setCurrentView('requests');
              }}
              className={`px-4 py-2 ${
                (sharedState.currentView === 'requests' || currentView === 'requests')
                  ? 'border-b-2 border-rose-500 text-rose-500 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Requests
            </button>
            <button
              onClick={() => {
                updateSharedState({ currentView: 'dates' });
                setCurrentView('dates');
              }}
              className={`px-4 py-2 ${
                (sharedState.currentView === 'dates' || currentView === 'dates')
                  ? 'border-b-2 border-rose-500 text-rose-500 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dates
            </button>
          </div>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {/* If there's an active or accepted date, show only that */}
          {sharedState.dateRequests.some(r => (r.status === 'active' || r.status === 'accepted') && !r.completedAt) ? (
            <motion.div
              key="active-or-accepted-date"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              {sharedState.dateRequests.find(r => r.status === 'active' && !r.completedAt) ? (
                renderActiveDateDetails({ request: sharedState.dateRequests.find(r => r.status === 'active' && !r.completedAt) })
              ) : (
                renderAcceptedDateDetails({ request: sharedState.dateRequests.find(r => r.status === 'accepted' && !r.completedAt) })
              )}
            </motion.div>
          ) : (
            <>
              {(sharedState.currentView === 'discovery' || currentView === 'discovery') && renderDiscoveryView()}
              {(sharedState.currentView === 'requests' || currentView === 'requests') && renderRequestsView()}
              {(sharedState.currentView === 'dates' || currentView === 'dates') && renderDatesView()}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Only show UserSwitcher if not in split view */}
      {!isSplitView && <UserSwitcher />}
      
      {/* Date Suggestion Modal */}
      {showDateModal && selectedProfile && (
        <DateSuggestionModal
          profile={selectedProfile}
          onSubmit={handleDateDetailsSubmit}
          onClose={() => {
            setShowDateModal(false);
            setSelectedProfile(null);
          }}
        />
      )}
    </div>
  );
} 