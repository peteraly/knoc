import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { toast } from 'react-hot-toast';

// Default profile data
const DEFAULT_PROFILE = {
  basicInfo: {
    name: '',
    location: ''
  },
  photoURL: ''
};

// Development mode profiles for testing
const DEV_PROFILES = {
  'profile1': {
    basicInfo: {
      name: 'Sarah Johnson',
      location: 'San Francisco, CA'
    },
    photoURL: ''
  },
  'profile2': {
    basicInfo: {
      name: 'Michael Chen',
      location: 'San Francisco, CA'
    },
    photoURL: ''
  }
};

export default function DashboardHeader({ userId }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get the correct user ID
        const targetUserId = userId || currentUser?.uid;
        
        if (!targetUserId) {
          setError('No user ID available');
          return;
        }

        // In development mode, use mock data for test profiles
        if (isDevelopment && DEV_PROFILES[targetUserId]) {
          setProfile(DEV_PROFILES[targetUserId]);
          setLoading(false);
          return;
        }

        // Fetch from Firestore
        const docRef = doc(db, 'users', targetUserId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setProfile({
            ...DEFAULT_PROFILE,
            ...profileData
          });
        } else {
          setError('Profile not found');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile');
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, currentUser, isDevelopment]);

  // Loading skeleton
  if (loading) {
    return (
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
              <div>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-28 h-10 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  // Error state
  if (error) {
    return (
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">!</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Welcome Back!</h1>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/matches')}
              className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors"
            >
              Find Matches
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Generate profile photo URL with fallback to UI Avatars
  const profilePhotoUrl = profile.photoURL || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.basicInfo?.name || 'User')}&background=f43f5e&color=fff`;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img
              src={profilePhotoUrl}
              alt={profile.basicInfo?.name || 'Profile photo'}
              className="w-10 h-10 rounded-full object-cover border-2 border-rose-100"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.basicInfo?.name || 'User')}&background=f43f5e&color=fff`;
              }}
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {profile.basicInfo?.name || 'Welcome Back!'}
              </h1>
              <p className="text-sm text-gray-600">
                {profile.basicInfo?.location || 'Set your location'}
              </p>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/matches')}
              className="bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors"
            >
              Find Matches
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 