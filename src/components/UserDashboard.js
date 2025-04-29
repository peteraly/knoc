import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

// Import test profiles from Matches component
export const TEST_PROFILES = [
  {
    id: 'profile1',
    name: 'Sarah Johnson',
    age: 28,
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    bio: 'Adventure seeker and coffee enthusiast. Love hiking, photography, and trying new restaurants.',
    interests: ['Hiking', 'Photography', 'Coffee', 'Travel', 'Cooking'],
    availability: {
      Monday: ['Morning', 'Evening'],
      Wednesday: ['Afternoon', 'Evening'],
      Friday: ['Morning', 'Afternoon', 'Evening'],
      Saturday: ['Morning', 'Afternoon']
    },
    preferences: {
      venue: 'Public Places Only',
      activityLevel: 'Casual',
      timePreference: 'Daytime'
    }
  },
  {
    id: 'profile2',
    name: 'Michael Chen',
    age: 32,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    bio: 'Tech entrepreneur by day, musician by night. Always looking for new experiences and connections.',
    interests: ['Technology', 'Music', 'Fitness', 'Reading', 'Art'],
    availability: {
      Tuesday: ['Morning', 'Evening'],
      Thursday: ['Afternoon', 'Evening'],
      Saturday: ['Morning', 'Afternoon', 'Evening'],
      Sunday: ['Morning', 'Afternoon']
    },
    preferences: {
      venue: 'Public Places Only',
      activityLevel: 'Moderate',
      timePreference: 'Flexible'
    }
  },
  {
    id: 'profile3',
    name: 'Emma Davis',
    age: 29,
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    bio: 'Yoga instructor and foodie. Passionate about wellness, cooking, and meeting new people.',
    interests: ['Yoga', 'Cooking', 'Wellness', 'Food', 'Travel'],
    availability: {
      Monday: ['Morning', 'Afternoon'],
      Wednesday: ['Morning', 'Evening'],
      Friday: ['Afternoon', 'Evening'],
      Sunday: ['Morning', 'Afternoon']
    },
    preferences: {
      venue: 'Public Places Only',
      activityLevel: 'Casual',
      timePreference: 'Daytime'
    }
  }
];

// Add sample date requests for testing
const SAMPLE_DATE_REQUESTS = [
  {
    id: 'req1',
    senderId: 'profile2', // Michael Chen
    recipientId: 'profile1', // Sarah Johnson
    status: 'pending',
    createdAt: new Date(),
    lastUpdated: new Date(),
    participants: ['profile2', 'profile1']
  },
  {
    id: 'req2',
    senderId: 'profile3', // Emma Davis
    recipientId: 'profile1', // Sarah Johnson
    status: 'pending',
    createdAt: new Date(),
    lastUpdated: new Date(),
    participants: ['profile3', 'profile1']
  },
  {
    id: 'req3',
    senderId: 'profile1', // Sarah Johnson
    recipientId: 'profile2', // Michael Chen
    status: 'pending',
    createdAt: new Date(),
    lastUpdated: new Date(),
    participants: ['profile1', 'profile2']
  }
];

export default function UserDashboard({ userId, onAcceptRequest, isSplitView = false }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [dateRequests, setDateRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests'); // Default to requests tab in split view
  const [pinnedUsers, setPinnedUsers] = useState([]); // Add state for pinned users

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Find the user in test profiles
        const testProfile = TEST_PROFILES.find(p => p.id === userId);
        if (!testProfile) {
          throw new Error('User not found');
        }
        
        setUserData(testProfile);
        
        // Get relevant requests for this user
        const relevantRequests = SAMPLE_DATE_REQUESTS.filter(
          req => req.senderId === testProfile.id || req.recipientId === testProfile.id
        );
        setDateRequests(relevantRequests);
        
        // For demo purposes, let's add some pinned users
        // In a real app, this would come from the database
        const pinnedUserIds = ['profile2', 'profile3']; // Example pinned user IDs
        const pinnedUsersData = pinnedUserIds.map(id => {
          const profile = TEST_PROFILES.find(p => p.id === id);
          return profile || { id, name: 'Unknown User' };
        });
        setPinnedUsers(pinnedUsersData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);

  const renderProfileTab = () => {
    if (!userData) return null;
    
    return (
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="flex items-center space-x-4">
          <img
            src={userData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}`}
            alt={userData.name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{userData.name}</h2>
            <p className="text-gray-600">{userData.location || 'Location not set'}</p>
          </div>
        </div>

        {/* Activities */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Activities</h3>
          {userData.interests?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {userData.interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No activities selected</p>
          )}
        </div>

        {/* Availability */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Availability</h3>
          <div className="grid grid-cols-7 gap-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <div key={day} className="text-center">
                <div className="font-medium text-gray-900 mb-2">{day}</div>
                <div className="space-y-2">
                  {['Morning', 'Afternoon', 'Evening'].map((time) => (
                    <div
                      key={`${day}-${time}`}
                      className={`w-full h-4 rounded-full ${
                        userData.availability?.[day]?.includes(time)
                          ? 'bg-rose-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Preferences</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Venue Preference</h4>
              <p className="text-gray-600">{userData.preferences?.venue || 'Public Places Only'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Activity Level</h4>
              <p className="text-gray-600">{userData.preferences?.activityLevel || 'Casual'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Time Preference</h4>
              <p className="text-gray-600">{userData.preferences?.timePreference || 'Daytime'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRequestsTab = () => {
    const sentRequests = dateRequests.filter(req => req.senderId === userData?.id);
    const receivedRequests = dateRequests.filter(req => req.recipientId === userData?.id);
    
    const getUserName = (userId) => {
      const profile = TEST_PROFILES.find(p => p.id === userId);
      return profile ? profile.name : 'Another User';
    };
    
    return (
      <div className="space-y-6">
        {/* Received Requests First */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Received Requests</h3>
          {receivedRequests.length > 0 ? (
            <div className="space-y-4">
              {receivedRequests.map(request => (
                <div key={request.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        From: {getUserName(request.senderId)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status: <span className="capitalize">{request.status}</span>
                      </p>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onAcceptRequest(request)}
                          className="px-3 py-1 bg-rose-500 text-white text-sm rounded-lg hover:bg-rose-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => {
                            // Handle decline
                            const updatedRequests = dateRequests.map(req =>
                              req.id === request.id ? { ...req, status: 'rejected' } : req
                            );
                            setDateRequests(updatedRequests);
                          }}
                          className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  {request.dateDetails && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Activity: {request.dateDetails.activity}</p>
                      <p>Day: {request.dateDetails.day}</p>
                      <p>Time: {request.dateDetails.time}</p>
                      <p>Venue: {request.dateDetails.venue}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No received requests</p>
          )}
        </div>
        
        {/* Then Sent Requests */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Sent Requests</h3>
          {sentRequests.length > 0 ? (
            <div className="space-y-4">
              {sentRequests.map(request => (
                <div key={request.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        To: {getUserName(request.recipientId)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status: <span className="capitalize">{request.status}</span>
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  {request.dateDetails && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Activity: {request.dateDetails.activity}</p>
                      <p>Day: {request.dateDetails.day}</p>
                      <p>Time: {request.dateDetails.time}</p>
                      <p>Venue: {request.dateDetails.venue}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No sent requests</p>
          )}
        </div>
      </div>
    );
  };

  const renderDatesTab = () => {
    const acceptedRequests = dateRequests.filter(req => 
      req.status === 'accepted' || req.status === 'active' || req.status === 'completed'
    );
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Dates</h3>
          {acceptedRequests.length > 0 ? (
            <div className="space-y-4">
              {acceptedRequests.map(request => (
                <div key={request.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        With: {request.senderId === userId ? 
                          (request.recipientId === currentUser?.uid ? 'You' : 'Another User') : 
                          (request.senderId === currentUser?.uid ? 'You' : 'Another User')}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status: <span className="capitalize">{request.status}</span>
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      request.status === 'active' ? 'bg-green-100 text-green-800' :
                      request.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  {request.dateDetails && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Activity: {request.dateDetails.activity}</p>
                      <p>Day: {request.dateDetails.day}</p>
                      <p>Time: {request.dateDetails.time}</p>
                      <p>Venue: {request.dateDetails.venue}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No dates</p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`${isSplitView ? 'h-[600px]' : 'min-h-screen'} bg-gray-50 flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className={`${isSplitView ? '' : 'min-h-screen'} bg-gray-50`}>
      <div className={`${isSplitView ? '' : 'max-w-4xl mx-auto px-4'} py-8`}>
        {/* User Name Header - Always visible */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={userData?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}`}
              alt={userData?.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {userData?.name}'s Dashboard
              </h1>
              <p className="text-gray-600">{userData?.location || 'Location not set'}</p>
            </div>
          </div>
          {!isSplitView && (
            <button
              onClick={() => navigate('/matches')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Back to Matches
            </button>
          )}
        </div>
        
        {/* Pinned Users Section */}
        {pinnedUsers.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-medium mb-3">Pinned Users</h2>
            <div className="flex flex-wrap gap-3">
              {pinnedUsers.map(user => (
                <div 
                  key={user.id} 
                  className="flex items-center space-x-2 bg-rose-50 px-3 py-2 rounded-lg"
                >
                  <img
                    src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-medium text-rose-700">{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="flex space-x-4 border-b mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 ${
              activeTab === 'profile'
                ? 'border-b-2 border-rose-500 text-rose-500 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 ${
              activeTab === 'requests'
                ? 'border-b-2 border-rose-500 text-rose-500 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Requests
          </button>
          <button
            onClick={() => setActiveTab('dates')}
            className={`px-4 py-2 ${
              activeTab === 'dates'
                ? 'border-b-2 border-rose-500 text-rose-500 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dates
          </button>
        </div>
        
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderProfileTab()}
            </motion.div>
          )}
          
          {activeTab === 'requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderRequestsTab()}
            </motion.div>
          )}
          
          {activeTab === 'dates' && (
            <motion.div
              key="dates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderDatesTab()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 