import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import toast from 'react-hot-toast';

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

// Default profile structure
const DEFAULT_PROFILE = {
  basicInfo: {
    name: '',
    age: '',
    location: '',
    bio: ''
  },
  activities: [],
  availability: DEFAULT_AVAILABILITY,
  preferences: {
    venue: 'public',
    activityLevel: 'casual',
    timePreference: 'daytime'
  }
};

export default function Profile() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_PROFILE);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!currentUser) {
        navigate('/signin');
        return;
      }

      try {
        setError(null);
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (!isMounted) return;

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Ensure all required fields exist with defaults
          const profileData = {
            ...DEFAULT_PROFILE,
            ...data,
            basicInfo: {
              ...DEFAULT_PROFILE.basicInfo,
              ...(data.basicInfo || {})
            },
            // Ensure availability is properly structured
            availability: Object.keys(DEFAULT_AVAILABILITY).reduce((acc, day) => {
              acc[day] = Array.isArray(data.availability?.[day]) 
                ? data.availability[day] 
                : [];
              return acc;
            }, {...DEFAULT_AVAILABILITY}),
            preferences: {
              ...DEFAULT_PROFILE.preferences,
              ...(data.preferences || {})
            }
          };

          setProfile(profileData);
          setFormData(profileData);
        } else {
          navigate('/onboarding');
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
  }, [currentUser, navigate]);

  const handleSave = async () => {
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
        // Ensure availability is properly structured
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="min-h-screen bg-gray-50 p-6"
    >
      <div className="max-w-lg mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 relative">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-gray-600 hover:text-gray-900"
            >
              {editMode ? 'Cancel' : 'Edit'}
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
              <img
                src={profile.photoURL || '/default-avatar.png'}
                alt={profile.basicInfo?.name || 'Profile'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
            </div>
            <div>
              {editMode ? (
                <input
                  type="text"
                  value={formData.basicInfo?.name || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    basicInfo: { ...prev.basicInfo, name: e.target.value }
                  }))}
                  className="text-xl font-semibold mb-1 p-1 border rounded"
                  placeholder="Your name"
                  required
                />
              ) : (
                <h2 className="text-xl font-semibold mb-1">
                  {profile.basicInfo?.name || 'Add your name'}
                </h2>
              )}
              <p className="text-gray-600">
                {profile.basicInfo?.location || 'Add your location'}
              </p>
            </div>
          </div>

          {editMode ? (
            <textarea
              value={formData.basicInfo?.bio || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                basicInfo: { ...prev.basicInfo, bio: e.target.value }
              }))}
              placeholder="Tell others about yourself..."
              className="mt-4 w-full p-3 border rounded-lg"
              rows={3}
            />
          ) : (
            profile.basicInfo?.bio && (
              <p className="mt-4 text-gray-700">{profile.basicInfo.bio}</p>
            )
          )}
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

        {/* Activities Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Activities You Enjoy</h3>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(profile.activities) && profile.activities.map(activity => (
              <span
                key={activity}
                className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm"
              >
                {activity}
              </span>
            ))}
            {(!Array.isArray(profile.activities) || profile.activities.length === 0) && (
              <p className="text-gray-500">No activities selected yet</p>
            )}
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Your Preferences</h3>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Venue Preference</p>
              <p className="text-gray-600 capitalize">
                {profile.preferences?.venue ? `${profile.preferences.venue} places only` : 'Not set'}
              </p>
            </div>
            <div>
              <p className="font-medium">Activity Level</p>
              <p className="text-gray-600 capitalize">
                {profile.preferences?.activityLevel || 'Not set'}
              </p>
            </div>
            <div>
              <p className="font-medium">Time Preference</p>
              <p className="text-gray-600 capitalize">
                {profile.preferences?.timePreference || 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          {editMode ? (
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-3 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          ) : (
            <button
              onClick={() => signOut()}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}