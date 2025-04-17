import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../utils/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function OnboardingForm() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    location: '',
    comfortPreferences: {
      venue: 'public',
      activity: 'casual',
      time: 'daytime'
    },
    activityPreferences: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const activityOptions = [
    'Coffee & Tea',
    'Outdoor Walks',
    'Museums & Galleries',
    'Live Music',
    'Food & Dining',
    'Bookstores',
    'Fitness & Wellness',
    'Creative Workshops'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleActivityToggle = (activity) => {
    setFormData(prev => ({
      ...prev,
      activityPreferences: prev.activityPreferences.includes(activity)
        ? prev.activityPreferences.filter(a => a !== activity)
        : [...prev.activityPreferences, activity]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.age || !formData.gender || !formData.phone || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate activities
    if (formData.activityPreferences.length < 2) {
      toast.error('Please select at least 2 activities you enjoy');
      return;
    }

    setLoading(true);
    try {
      // Save to Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        basicInfo: {
          name: formData.name,
          age: formData.age,
          gender: formData.gender,
          phone: formData.phone,
          location: formData.location,
          comfortLevel: formData.comfortPreferences,
          activities: formData.activityPreferences,
          emergencyContact: formData.emergencyContact
        },
        onboardingStep: 'face-selection'
      });

      toast.success('Profile saved successfully!');
      navigate('/face-selection');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-gray-900">Welcome to Your Journey</h1>
          <p className="mt-2 text-sm text-rose-600 italic">
            Let's create your thoughtful dating profile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow-sm">
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-serif text-gray-900">About You</h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  min="18"
                  max="120"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                  required
                >
                  <option value="">Select gender...</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Location (City)
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Comfort Preferences */}
          <div className="space-y-6">
            <h2 className="text-xl font-serif text-gray-900">Comfort Preferences</h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Preferred Venue
                </label>
                <select
                  name="comfortPreferences.venue"
                  value={formData.comfortPreferences.venue}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                >
                  <option value="public">Public Places Only</option>
                  <option value="semi-private">Semi-Private (e.g., Reserved Areas)</option>
                  <option value="either">Either is Fine</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Activity Level
                </label>
                <select
                  name="comfortPreferences.activity"
                  value={formData.comfortPreferences.activity}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                >
                  <option value="casual">Casual & Relaxed</option>
                  <option value="active">Active & Engaging</option>
                  <option value="mixed">Mix of Both</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Time Preference
                </label>
                <select
                  name="comfortPreferences.time"
                  value={formData.comfortPreferences.time}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                >
                  <option value="daytime">Daytime Only</option>
                  <option value="evening">Evening Preferred</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            </div>
          </div>

          {/* Activity Preferences */}
          <div className="space-y-6">
            <h2 className="text-xl font-serif text-gray-900">Activity Preferences</h2>
            <p className="text-sm text-gray-500">Select activities you enjoy (choose at least 2)</p>
            
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {activityOptions.map((activity) => (
                <button
                  key={activity}
                  type="button"
                  onClick={() => handleActivityToggle(activity)}
                  className={`p-4 text-left rounded-lg border ${
                    formData.activityPreferences.includes(activity)
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-gray-200 hover:border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-6">
            <h2 className="text-xl font-serif text-gray-900">Emergency Contact (Optional)</h2>
            <p className="text-sm text-gray-500">For your safety and peace of mind</p>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergencyContact.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Relationship
                </label>
                <input
                  type="text"
                  name="emergencyContact.relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue to Face Selection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 