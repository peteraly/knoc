import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const GENDER_OPTIONS = ['woman', 'man', 'non-binary', 'other'];
const ACTIVITY_OPTIONS = [
  { id: 'coffee', label: 'Coffee & Tea', icon: '☕' },
  { id: 'walks', label: 'Outdoor Walks', icon: '🚶' },
  { id: 'museums', label: 'Museums & Galleries', icon: '🏛️' },
  { id: 'music', label: 'Live Music', icon: '🎵' },
  { id: 'dining', label: 'Food & Dining', icon: '🍽️' },
  { id: 'books', label: 'Bookstores', icon: '📚' },
  { id: 'fitness', label: 'Fitness & Wellness', icon: '💪' },
  { id: 'workshops', label: 'Creative Workshops', icon: '🎨' }
];

const STEPS = [
  'basics',
  'preferences',
  'activities',
  'emergency',
  'spotify',
  'availability'
];

export default function OnboardingForm() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    basicInfo: {
      name: '',
      age: '',
      gender: '',
      phone: '',
      location: ''
    },
    preferences: {
      venue: 'public',
      activityLevel: 'casual',
      timePreference: 'daytime'
    },
    activities: [],
    emergency: {
      name: '',
      phone: '',
      relationship: ''
    },
    spotifyLink: '',
    availability: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    }
  });

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleActivityToggle = (activityId) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.includes(activityId)
        ? prev.activities.filter(id => id !== activityId)
        : [...prev.activities, activityId]
    }));
  };

  const handleTimeSlotToggle = (day, time) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: prev.availability[day].includes(time)
          ? prev.availability[day].filter(t => t !== time)
          : [...prev.availability[day], time]
      }
    }));
  };

  const validateStep = () => {
    switch (STEPS[currentStep]) {
      case 'basics':
        return (
          formData.basicInfo.name &&
          formData.basicInfo.age &&
          formData.basicInfo.gender &&
          formData.basicInfo.location
        );
      case 'activities':
        return formData.activities.length >= 2;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      toast.success('Profile created successfully!');
      navigate('/face-selection');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const renderBasicsStep = () => (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Name"
        value={formData.basicInfo.name}
        onChange={(e) => handleInputChange('basicInfo', 'name', e.target.value)}
        className="w-full p-4 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-gray-900 placeholder-gray-500 bg-white"
      />
      <input
        type="number"
        placeholder="Age"
        value={formData.basicInfo.age}
        onChange={(e) => handleInputChange('basicInfo', 'age', e.target.value)}
        className="w-full p-4 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-gray-900 placeholder-gray-500 bg-white"
      />
      <select
        value={formData.basicInfo.gender}
        onChange={(e) => handleInputChange('basicInfo', 'gender', e.target.value)}
        className="w-full p-4 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-gray-900 bg-white appearance-none"
      >
        <option value="">Select gender...</option>
        {GENDER_OPTIONS.map(gender => (
          <option key={gender} value={gender}>
            {gender.charAt(0).toUpperCase() + gender.slice(1)}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Location (City)"
        value={formData.basicInfo.location}
        onChange={(e) => handleInputChange('basicInfo', 'location', e.target.value)}
        className="w-full p-4 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-gray-900 placeholder-gray-500 bg-white"
      />
    </div>
  );

  const renderPreferencesStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Venue</label>
        <div className="grid grid-cols-1 gap-3">
          {['public', 'any'].map(venue => (
            <button
              key={venue}
              onClick={() => handleInputChange('preferences', 'venue', venue)}
              className={`p-4 rounded-lg border ${
                formData.preferences.venue === venue
                  ? 'border-rose-500 bg-rose-50 text-rose-600'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
              } transition-colors duration-200 text-center`}
            >
              {venue === 'public' ? 'Public Places Only' : 'Any Location'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Activity Level</label>
        <div className="grid grid-cols-1 gap-3">
          {['casual', 'active'].map(level => (
            <button
              key={level}
              onClick={() => handleInputChange('preferences', 'activityLevel', level)}
              className={`p-4 rounded-lg border ${
                formData.preferences.activityLevel === level
                  ? 'border-rose-500 bg-rose-50 text-rose-600'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
              } transition-colors duration-200 text-center`}
            >
              {level === 'casual' ? 'Casual & Relaxed' : 'Active & Adventurous'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Time Preference</label>
        <div className="grid grid-cols-1 gap-3">
          {['daytime', 'any'].map(time => (
            <button
              key={time}
              onClick={() => handleInputChange('preferences', 'timePreference', time)}
              className={`p-4 rounded-lg border ${
                formData.preferences.timePreference === time
                  ? 'border-rose-500 bg-rose-50 text-rose-600'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
              } transition-colors duration-200 text-center`}
            >
              {time === 'daytime' ? 'Daytime Only' : 'Any Time'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActivitiesStep = () => (
    <div>
      <p className="text-sm text-gray-500 mb-4">Select activities you enjoy (choose at least 2)</p>
      <div className="grid grid-cols-2 gap-3">
        {ACTIVITY_OPTIONS.map(activity => (
          <button
            key={activity.id}
            onClick={() => handleActivityToggle(activity.id)}
            className={`p-4 rounded-lg border ${
              formData.activities.includes(activity.id)
                ? 'border-rose-500 bg-rose-50 text-rose-600'
                : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
            } transition-colors duration-200 text-center`}
          >
            <span className="text-2xl block mb-2">{activity.icon}</span>
            <span className="text-sm">{activity.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderEmergencyStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">For your safety and peace of mind (Optional)</p>
      <input
        type="text"
        placeholder="Contact Name"
        value={formData.emergency.name}
        onChange={(e) => handleInputChange('emergency', 'name', e.target.value)}
        className="w-full p-4 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-gray-900 placeholder-gray-500"
      />
      <input
        type="tel"
        placeholder="Contact Phone"
        value={formData.emergency.phone}
        onChange={(e) => handleInputChange('emergency', 'phone', e.target.value)}
        className="w-full p-4 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-gray-900 placeholder-gray-500"
      />
      <input
        type="text"
        placeholder="Relationship"
        value={formData.emergency.relationship}
        onChange={(e) => handleInputChange('emergency', 'relationship', e.target.value)}
        className="w-full p-4 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-gray-900 placeholder-gray-500"
      />
    </div>
  );

  const renderSpotifyStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">Share your music taste with potential matches (Optional)</p>
      <input
        type="url"
        placeholder="https://open.spotify.com/user/..."
        value={formData.spotifyLink}
        onChange={(e) => setFormData(prev => ({ ...prev, spotifyLink: e.target.value }))}
        className="w-full p-4 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-gray-900 placeholder-gray-500"
      />
      <a
        href="https://open.spotify.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-rose-600 hover:text-rose-700 font-medium"
      >
        Open Spotify
      </a>
    </div>
  );

  const renderAvailabilityStep = () => (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 mb-4">Select your typical availability for dates</p>
      <div className="space-y-4">
        {Object.keys(formData.availability).map(day => (
          <div key={day} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium capitalize mb-3">{day}</h3>
            <div className="grid grid-cols-3 gap-2">
              {['Morning', 'Afternoon', 'Evening'].map(timeSlot => (
                <button
                  key={`${day}-${timeSlot}`}
                  onClick={() => handleTimeSlotToggle(day, timeSlot.toLowerCase())}
                  className={`p-2 text-sm rounded-lg ${
                    formData.availability[day].includes(timeSlot.toLowerCase())
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition-colors duration-200`}
                >
                  {timeSlot}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const stepComponents = {
    basics: renderBasicsStep,
    preferences: renderPreferencesStep,
    activities: renderActivitiesStep,
    emergency: renderEmergencyStep,
    spotify: renderSpotifyStep,
    availability: renderAvailabilityStep
  };

  const stepTitles = {
    basics: 'About You',
    preferences: 'Your Preferences',
    activities: 'Activities You Enjoy',
    emergency: 'Emergency Contact',
    spotify: 'Connect Spotify',
    availability: 'Your Availability'
  };

  return (
    <div className="min-h-screen bg-white py-6 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Your Journey</h1>
          <p className="text-gray-600">Let's create your thoughtful dating profile</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-300 ease-out"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-500 text-center">
            Step {currentStep + 1} of {STEPS.length}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{stepTitles[STEPS[currentStep]]}</h2>
            {stepComponents[STEPS[currentStep]]()}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex justify-between">
          <button
            onClick={handleBack}
            className={`px-6 py-2 rounded-lg ${
              currentStep === 0
                ? 'invisible'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            } transition-colors duration-200`}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors duration-200"
          >
            {currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
} 