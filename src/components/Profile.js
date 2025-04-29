import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import toast from 'react-hot-toast';
import { auth, storage } from '../utils/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FiCalendar, FiClock, FiMapPin, FiUser, FiSettings, FiActivity, FiLink } from 'react-icons/fi';

const TIME_PERIODS = {
  morning: '9 AM - 12 PM',
  afternoon: '12 PM - 5 PM',
  evening: '5 PM - 9 PM'
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Initialize default availability with empty arrays
const DEFAULT_AVAILABILITY = DAYS.reduce((acc, day) => {
  acc[day] = [];
  return acc;
}, {});

// Test user profiles for split view
const TEST_PROFILES = {
  profile1: {
    basicInfo: {
      name: 'Sarah Johnson',
      age: 28,
      location: 'San Francisco, CA',
      bio: 'Adventure seeker and coffee enthusiast. Love hiking, photography, and trying new restaurants.'
    },
    activities: ['Hiking', 'Photography', 'Coffee', 'Travel', 'Cooking'],
    availability: {
      monday: ['morning', 'evening'],
      wednesday: ['afternoon', 'evening'],
      friday: ['morning', 'afternoon', 'evening'],
      saturday: ['morning', 'afternoon']
    },
    preferences: {
      venue: 'Public Places Only',
      activityLevel: 'Casual',
      timePreference: 'Daytime'
    }
  },
  profile2: {
    basicInfo: {
      name: 'Michael Chen',
      age: 32,
      location: 'San Francisco, CA',
      bio: 'Tech entrepreneur by day, musician by night. Always looking for new experiences and connections.'
    },
    activities: ['Technology', 'Music', 'Fitness', 'Reading', 'Art'],
    availability: {
      tuesday: ['morning', 'evening'],
      thursday: ['afternoon', 'evening'],
      saturday: ['morning', 'afternoon', 'evening'],
      sunday: ['morning', 'afternoon']
    },
    preferences: {
      venue: 'Public Places Only',
      activityLevel: 'Moderate',
      timePreference: 'Flexible'
    }
  }
};

// Default profile structure
const DEFAULT_PROFILE = {
  basicInfo: {
    name: '',
    age: '',
    location: '',
    bio: '',
    photoURL: ''
  },
  activities: [],
  availability: DEFAULT_AVAILABILITY,
  preferences: {
    venue: 'public',
    activityLevel: 'casual',
    timePreference: 'daytime',
    notificationPreferences: {
      email: true,
      push: true,
      eventReminders: true,
      eventUpdates: true,
      newEvents: true
    }
  },
  stats: {
    eventsAttended: 0,
    eventsHosted: 0,
    totalConnections: 0,
    averageRating: 0
  },
  connectedAccounts: {
    google: false,
    facebook: false,
    twitter: false
  }
};

export default function Profile({ isSplitView, autoLoginUserId }) {
  const { currentUser, signOut } = useAuth();
  const { events } = useEvents();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_PROFILE);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setError(null);
        let profileData;

        if (isSplitView && autoLoginUserId && TEST_PROFILES[autoLoginUserId]) {
          // Use test profile data in split view
          profileData = TEST_PROFILES[autoLoginUserId];
        } else {
          if (!currentUser) {
            navigate('/login');
            return;
          }
          // Fetch from Firestore for regular view
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            profileData = docSnap.data();
          } else {
            navigate('/onboarding');
            return;
          }
        }

        if (!isMounted) return;

        // Calculate stats from events
        const userEvents = events.filter(event => 
          event.attendees?.includes(currentUser.uid) || 
          event.hosts?.includes(currentUser.uid)
        );
        
        const stats = {
          eventsAttended: userEvents.filter(e => e.attendees?.includes(currentUser.uid)).length,
          eventsHosted: userEvents.filter(e => e.hosts?.includes(currentUser.uid)).length,
          totalConnections: userEvents.reduce((acc, event) => 
            acc + (event.attendees?.length || 0), 0),
          averageRating: 4.5 // Placeholder - would be calculated from actual ratings
        };

        // Ensure all required fields exist with defaults
        const normalizedProfile = {
          ...DEFAULT_PROFILE,
          ...profileData,
          stats,
          basicInfo: {
            ...DEFAULT_PROFILE.basicInfo,
            ...(profileData.basicInfo || {})
          },
          availability: Object.keys(DEFAULT_AVAILABILITY).reduce((acc, day) => {
            acc[day] = Array.isArray(profileData.availability?.[day]) 
              ? profileData.availability[day] 
              : [];
            return acc;
          }, {...DEFAULT_AVAILABILITY}),
          preferences: {
            ...DEFAULT_PROFILE.preferences,
            ...(profileData.preferences || {})
          }
        };

        if (isMounted) {
          setProfile(normalizedProfile);
          setFormData(normalizedProfile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (isMounted) {
          setError('Failed to load profile');
          toast.error('Failed to load profile');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [currentUser, navigate, isSplitView, autoLoginUserId, events]);

  const handleSave = async () => {
    if (isSplitView) {
      // In split view, just update the local state
      setProfile(formData);
      setEditMode(false);
      toast.success('Profile updated successfully!');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Validate form data before saving
      if (!formData.basicInfo?.name?.trim()) {
        throw new Error('Name is required');
      }

      const updatedData = {
        ...formData,
        updatedAt: new Date(),
        availability: Object.keys(DEFAULT_AVAILABILITY).reduce((acc, day) => {
          acc[day] = Array.isArray(formData.availability?.[day]) 
            ? formData.availability[day] 
            : [];
          return acc;
        }, {...DEFAULT_AVAILABILITY})
      };

      await updateDoc(doc(db, 'users', currentUser.uid), updatedData);
      setProfile(updatedData);
      setEditMode(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = (day, period) => {
    setFormData(prev => {
      // Ensure we have a valid array to work with
      const currentDayAvailability = Array.isArray(prev.availability?.[day]) 
        ? prev.availability[day] 
        : [];

      return {
        ...prev,
        availability: {
          ...DEFAULT_AVAILABILITY,
          ...prev.availability,
          [day]: currentDayAvailability.includes(period)
            ? currentDayAvailability.filter(p => p !== period)
            : [...currentDayAvailability, period]
        }
      };
    });
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Create a reference to the file location in Firebase Storage
      const storageRef = ref(storage, `profile-photos/${user.uid}/${file.name}`);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update the user's profile with the new photo URL
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'basicInfo.photoURL': downloadURL
      });

      // Update local state
      setProfile(prev => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          photoURL: downloadURL
        }
      }));

    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${isSplitView ? '' : 'min-h-screen'} bg-gray-50 flex items-center justify-center`}>
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${isSplitView ? '' : 'min-h-screen'} bg-gray-50 flex items-center justify-center`}>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const renderProfileContent = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 relative">
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
              <img
                src={profile.basicInfo?.photoURL || '/default-avatar.png'}
                alt={profile.basicInfo?.name || 'Profile'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
            </div>
            {editMode && (
              <label 
                htmlFor="photo-upload" 
                className="absolute bottom-0 right-0 bg-rose-500 text-white p-2 rounded-full cursor-pointer hover:bg-rose-600 transition-colors"
              >
                <FiUser size={16} />
              </label>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              id="photo-upload"
              className="hidden"
            />
          </div>
          
          <div className="flex-1">
            {editMode ? (
              <input
                type="text"
                value={formData.basicInfo?.name || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  basicInfo: { ...prev.basicInfo, name: e.target.value }
                }))}
                className="text-2xl font-semibold mb-2 p-2 border rounded w-full"
                placeholder="Your name"
                required
              />
            ) : (
              <h2 className="text-2xl font-semibold mb-2">
                {profile.basicInfo?.name || 'Add your name'}
              </h2>
            )}
            
            <div className="flex items-center text-gray-600 space-x-4">
              <div className="flex items-center">
                <FiMapPin className="mr-1" />
                {editMode ? (
                  <input
                    type="text"
                    value={formData.basicInfo?.location || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      basicInfo: { ...prev.basicInfo, location: e.target.value }
                    }))}
                    className="p-1 border rounded"
                    placeholder="Your location"
                  />
                ) : (
                  profile.basicInfo?.location || 'Add your location'
                )}
              </div>
              <div className="flex items-center">
                <FiCalendar className="mr-1" />
                <span>Joined {new Date(currentUser?.metadata?.creationTime).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {editMode ? (
            <textarea
              value={formData.basicInfo?.bio || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, bio: e.target.value }
              }))}
              placeholder="Tell others about yourself..."
              className="w-full p-3 border rounded-lg"
              rows={3}
            />
          ) : (
            profile.basicInfo?.bio && (
              <p className="text-gray-700">{profile.basicInfo.bio}</p>
            )
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-gray-500 text-sm">Events Attended</div>
          <div className="text-2xl font-semibold mt-1">{profile.stats.eventsAttended}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-gray-500 text-sm">Events Hosted</div>
          <div className="text-2xl font-semibold mt-1">{profile.stats.eventsHosted}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-gray-500 text-sm">Total Connections</div>
          <div className="text-2xl font-semibold mt-1">{profile.stats.totalConnections}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-gray-500 text-sm">Average Rating</div>
          <div className="text-2xl font-semibold mt-1">{profile.stats.averageRating.toFixed(1)}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {events
            .filter(event => 
              event.attendees?.includes(currentUser?.uid) || 
              event.hosts?.includes(currentUser?.uid)
            )
            .slice(0, 5)
            .map(event => (
              <div key={event.id} className="flex items-center space-x-4 py-2 border-b last:border-0">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500">
                  {event.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString()} • {event.time}
                  </div>
                </div>
                <div className="text-sm font-medium text-rose-500">
                  {event.hosts?.includes(currentUser?.uid) ? 'Hosted' : 'Attended'}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Availability Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">Your Availability</h3>
        <div className="space-y-4">
          {DAYS.map(day => (
            <div key={day} className="border rounded-lg p-4">
              <h4 className="font-medium capitalize mb-2">{day}</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TIME_PERIODS).map(([period, label]) => {
                  const dayAvailability = Array.isArray(formData.availability?.[day])
                    ? formData.availability[day]
                    : [];
                  
                  return (
                    <button
                      key={period}
                      onClick={() => editMode && handleAvailabilityToggle(day, period)}
                      disabled={!editMode}
                      className={`p-2 text-sm rounded-lg transition-colors ${
                        dayAvailability.includes(period)
                          ? 'bg-rose-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      } ${editMode ? 'hover:bg-rose-100' : ''}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPreferencesContent = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {Object.entries(profile.preferences.notificationPreferences).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => {
                    if (editMode) {
                      setFormData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          notificationPreferences: {
                            ...prev.preferences.notificationPreferences,
                            [key]: !value
                          }
                        }
                      }));
                    }
                  }}
                  disabled={!editMode}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">Connected Accounts</h3>
        <div className="space-y-4">
          {Object.entries(profile.connectedAccounts).map(([platform, isConnected]) => (
            <div key={platform} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center">
                <FiLink className="mr-2" />
                <div className="font-medium capitalize">{platform}</div>
              </div>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isConnected
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-rose-500 text-white hover:bg-rose-600'
                }`}
                onClick={() => {
                  // Handle account connection/disconnection
                  toast.success(`${isConnected ? 'Disconnected from' : 'Connected to'} ${platform}`);
                }}
              >
                {isConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`${isSplitView ? '' : 'min-h-screen'} bg-gray-50 p-6`}
    >
      <div className={`${isSplitView ? 'px-4' : 'max-w-4xl mx-auto px-4'} py-8`}>
        <div className="max-w-lg mx-auto space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white rounded-lg shadow-sm p-1 mb-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'profile'
                  ? 'bg-rose-500 text-white'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center">
                <FiUser className="mr-2" />
                Profile
              </div>
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'preferences'
                  ? 'bg-rose-500 text-white'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center">
                <FiSettings className="mr-2" />
                Preferences
              </div>
            </button>
          </div>

          {/* Save Button */}
          {editMode && (
            <div className="fixed bottom-6 right-6 z-10">
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors flex items-center"
              >
                Save Changes
              </button>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'profile' ? renderProfileContent() : renderPreferencesContent()}
        </div>
      </div>
    </motion.div>
  );
}