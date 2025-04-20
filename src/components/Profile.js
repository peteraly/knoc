import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { initiateSpotifyLogin } from '../utils/spotify';
import toast from 'react-hot-toast';
import AvailabilityPicker from './AvailabilityPicker';

const GENDER_OPTIONS = [
  { value: 'Woman', label: 'Woman' },
  { value: 'Man', label: 'Man' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Other', label: 'Other' }
];

// Default form data structure
const DEFAULT_FORM_DATA = {
  basicInfo: {
    name: '',
    age: '',
    location: '',
    bio: '',
    gender: '',
    photoURL: ''
  },
  preferences: {
    interestedIn: [],
    ageRange: { min: 18, max: 35 },
    maxDistance: 25,
    interests: []
  },
  activities: [],
  spotifyProfile: null,
  availability: {},
  blackoutDates: []
};

export default function Profile({ activeTab = 'basic' }) {
  const { currentUser, isTestUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const spotifyStatus = params.get('spotify');
    
    if (spotifyStatus === 'success') {
      toast.success('Successfully connected to Spotify!');
    } else if (spotifyStatus === 'error') {
      toast.error('Failed to connect to Spotify');
    }
  }, [location]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }

    const initializeFormData = async () => {
      try {
        setLoading(true);
        
        // For test users, we can use the currentUser data directly
        if (isTestUser) {
          setFormData({
            basicInfo: currentUser.basicInfo || DEFAULT_FORM_DATA.basicInfo,
            preferences: {
              ...DEFAULT_FORM_DATA.preferences,
              ...currentUser.preferences
            },
            activities: currentUser.activities || [],
            spotifyProfile: currentUser.spotifyProfile || null,
            availability: currentUser.availability || {},
            blackoutDates: currentUser.blackoutDates || []
          });
          setLoading(false);
          return;
        }

        // For regular users, fetch from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            basicInfo: userData.basicInfo || DEFAULT_FORM_DATA.basicInfo,
            preferences: {
              ...DEFAULT_FORM_DATA.preferences,
              ...userData.preferences
            },
            activities: userData.activities || [],
            spotifyProfile: userData.spotifyProfile || null,
            availability: userData.availability || {},
            blackoutDates: userData.blackoutDates || []
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    initializeFormData();
  }, [currentUser, navigate, isTestUser]);

  const handleSave = async () => {
    if (!formData.basicInfo.name || !formData.basicInfo.age || !formData.basicInfo.gender || formData.preferences.interestedIn.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const age = parseInt(formData.basicInfo.age);
    if (isNaN(age) || age < 18 || age > 100) {
      toast.error('Please enter a valid age between 18 and 100');
      return;
    }

    try {
      const updatedData = {
        basicInfo: formData.basicInfo,
        preferences: formData.preferences,
        activities: formData.activities,
        availability: formData.availability,
        blackoutDates: formData.blackoutDates,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'users', currentUser.uid), updatedData);

      setEditing(false);
      toast.success('Profile updated successfully');
      
      if (!isTestUser) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const [section, field] = name.split('.');
    
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleGenderChange = (gender) => {
    setFormData(prev => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        gender
      }
    }));
  };

  const handleInterestToggle = (gender) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        interestedIn: prev.preferences.interestedIn.includes(gender)
          ? prev.preferences.interestedIn.filter(g => g !== gender)
          : [...prev.preferences.interestedIn, gender]
      }
    }));
  };

  const handleConnectSpotify = () => {
    initiateSpotifyLogin();
  };

  const renderAvailabilitySection = () => (
    <section className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Availability</h3>
        <button
          onClick={() => setShowAvailabilityPicker(!showAvailabilityPicker)}
          className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600"
        >
          {showAvailabilityPicker ? 'Hide Availability' : 'Edit Availability'}
        </button>
      </div>

      {showAvailabilityPicker ? (
        <AvailabilityPicker />
      ) : (
        <div className="bg-gray-50 rounded-lg p-4">
          {Object.entries(formData.availability || {}).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData.availability).map(([day, slots]) => (
                slots.length > 0 && (
                  <div key={day} className="bg-white p-3 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-900">{day}</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {slots.map(slot => (
                        <span
                          key={slot}
                          className="px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-sm"
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No availability set. Click "Edit Availability" to set your schedule.
            </p>
          )}

          {formData.blackoutDates?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Blocked Dates</h4>
              <div className="flex flex-wrap gap-2">
                {formData.blackoutDates.map(date => (
                  <span
                    key={date}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                  >
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Profile</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
            {editing && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info Section */}
          {activeTab === 'basic' && (
            <>
              <section>
                <h3 className="text-xl font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="basicInfo.name"
                      value={formData.basicInfo.name}
                      onChange={handleChange}
                      disabled={!editing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <input
                      type="number"
                      name="basicInfo.age"
                      value={formData.basicInfo.age}
                      onChange={handleChange}
                      disabled={!editing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input
                      type="text"
                      name="basicInfo.location"
                      value={formData.basicInfo.location}
                      onChange={handleChange}
                      disabled={!editing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select
                      name="basicInfo.gender"
                      value={formData.basicInfo.gender}
                      onChange={(e) => handleGenderChange(e.target.value)}
                      disabled={!editing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select gender</option>
                      {GENDER_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    name="basicInfo.bio"
                    value={formData.basicInfo.bio}
                    onChange={handleChange}
                    disabled={!editing}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </section>

              {renderAvailabilitySection()}
            </>
          )}

          {/* Preferences Section */}
          {activeTab === 'preferences' && (
            <section>
              <h3 className="text-xl font-semibold mb-4">Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Interested In</label>
                  <div className="mt-2 space-x-4">
                    {GENDER_OPTIONS.map(option => (
                      <label key={option.value} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.preferences.interestedIn.includes(option.value)}
                          onChange={() => handleInterestToggle(option.value)}
                          disabled={!editing}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age Range</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        name="preferences.ageRange.min"
                        value={formData.preferences.ageRange.min}
                        onChange={handleChange}
                        disabled={!editing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">Min</span>
                    </div>
                    <div>
                      <input
                        type="number"
                        name="preferences.ageRange.max"
                        value={formData.preferences.ageRange.max}
                        onChange={handleChange}
                        disabled={!editing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">Max</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Maximum Distance (miles)</label>
                  <input
                    type="number"
                    name="preferences.maxDistance"
                    value={formData.preferences.maxDistance}
                    onChange={handleChange}
                    disabled={!editing}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Spotify Section */}
          <section>
            <h3 className="text-xl font-semibold mb-4">Spotify Connection</h3>
            <div className="flex items-center space-x-4">
              {formData.spotifyProfile ? (
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">✓ Connected</span>
                  <span className="text-gray-600">as {formData.spotifyProfile.display_name}</span>
                </div>
              ) : (
                <button
                  onClick={handleConnectSpotify}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Connect Spotify
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}