import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Sample data for development
const SAMPLE_PROFILES = {
  '1': {
    id: '1',
    basicInfo: {
      name: 'Michael Chen',
      age: 29,
      location: 'San Francisco, CA'
    },
    availability: {
      monday: ['morning', 'evening'],
      wednesday: ['afternoon'],
      friday: ['morning', 'afternoon'],
      saturday: ['afternoon', 'evening']
    }
  }
};

const CURRENT_USER_AVAILABILITY = {
  monday: ['morning', 'afternoon'],
  wednesday: ['afternoon'],
  friday: ['afternoon'],
  saturday: ['morning', 'afternoon']
};

const TIME_SLOTS = {
  morning: { label: 'Morning (9AM-12PM)', default: '10:00 AM' },
  afternoon: { label: 'Afternoon (12PM-5PM)', default: '2:00 PM' },
  evening: { label: 'Evening (5PM-9PM)', default: '7:00 PM' }
};

const VENUES = [
  { id: 'coffee', name: 'Coffee Shop', icon: '☕️' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'park', name: 'Park', icon: '🌳' },
  { id: 'museum', name: 'Museum', icon: '🏛️' },
  { id: 'custom', name: 'Custom Venue', icon: '📍' }
];

// Helper function to get first name
const getFirstName = (fullName) => fullName.split(' ')[0];

export default function DatePlanning() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId') || '1'; // Default to '1' if no matchId provided

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('time');
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [customVenue, setCustomVenue] = useState('');
  const [match, setMatch] = useState(null);
  const [dateStatus, setDateStatus] = useState(null); // 'pending', 'confirmed', 'completed'
  const [confirmationCode, setConfirmationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [isProposer, setIsProposer] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);

  // Generate a random 6-digit confirmation code
  const generateConfirmationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Find overlapping availability between current user and match
  const findOverlappingSlots = () => {
    const overlapping = {};
    
    Object.keys(CURRENT_USER_AVAILABILITY).forEach(day => {
      const matchSlots = SAMPLE_PROFILES[matchId]?.availability[day] || [];
      const userSlots = CURRENT_USER_AVAILABILITY[day];
      
      const commonSlots = matchSlots.filter(slot => userSlots.includes(slot));
      
      if (commonSlots.length > 0) {
        overlapping[day] = commonSlots;
      }
    });
    
    return overlapping;
  };

  useEffect(() => {
    const initializeData = () => {
      try {
        setLoading(true);
        
        // For development, use sample data
        const matchData = SAMPLE_PROFILES[matchId];
        if (!matchData) {
          throw new Error('Match not found');
        }

        setMatch(matchData);
        // Set as recipient (Sarah Chen's view)
        setIsProposer(false);
        // Set confirmation code to match what's shown in UI
        setConfirmationCode('797211');
        // Set date as confirmed, waiting for code entry
        setDateStatus('confirmed');
        // Skip to details view
        setStep('details');
        // Set selected details
        setSelectedDay('monday');
        setSelectedTime('morning');
        setSelectedVenue(VENUES.find(v => v.id === 'coffee'));
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    initializeData();
  }, [matchId]);

  const handleTimeSelect = (day, time) => {
    setSelectedDay(day);
    setSelectedTime(time);
    setStep('venue');
  };

  const handleVenueSelect = (venue) => {
    setSelectedVenue(venue);
    if (venue.id !== 'custom') {
      setStep('confirm');
    }
  };

  const handleCustomVenueSubmit = (e) => {
    e.preventDefault();
    if (!customVenue.trim()) {
      toast.error('Please enter a venue');
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = () => {
    // For development, simulate date confirmation
    setDateStatus('confirmed');
    toast.success('Date confirmed! Share the confirmation code with your date.');
    setStep('details');
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (enteredCode === '797211') {
      setDateStatus('completed');
      setShowCompletionScreen(true);
      // In real app, would update Firebase here
    } else {
      toast.error('Invalid confirmation code');
    }
  };

  const renderTimeSelection = () => {
    const overlappingSlots = findOverlappingSlots();
    
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Select a Time</h2>
        <p className="text-gray-600">Choose from your overlapping availability</p>
        
        {Object.keys(overlappingSlots).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(overlappingSlots).map(([day, slots]) => (
              <div key={day} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium capitalize mb-3">{day}</h3>
                <div className="grid grid-cols-1 gap-2">
                  {slots.map(slot => (
                    <button
                      key={`${day}-${slot}`}
                      onClick={() => handleTimeSelect(day, slot)}
                      className="p-3 text-left rounded-lg border border-gray-200 hover:border-rose-500 hover:bg-rose-50"
                    >
                      <span className="font-medium">{TIME_SLOTS[slot].label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No overlapping availability found.</p>
            <button
              onClick={() => navigate('/matches')}
              className="mt-4 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderVenueSelection = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Choose a Venue</h2>
      <p className="text-gray-600">Select where you'd like to meet</p>

      <div className="grid grid-cols-2 gap-3">
        {VENUES.map(venue => (
          <button
            key={venue.id}
            onClick={() => handleVenueSelect(venue)}
            className="p-4 rounded-lg border border-gray-200 hover:border-rose-500 hover:bg-rose-50 text-center"
          >
            <span className="text-2xl block mb-2">{venue.icon}</span>
            <span className="font-medium">{venue.name}</span>
          </button>
        ))}
      </div>

      {selectedVenue?.id === 'custom' && (
        <form onSubmit={handleCustomVenueSubmit} className="mt-4">
          <input
            type="text"
            value={customVenue}
            onChange={(e) => setCustomVenue(e.target.value)}
            placeholder="Enter venue name or address"
            className="w-full p-3 border border-gray-200 rounded-lg focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
          />
          <button
            type="submit"
            className="w-full mt-3 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
          >
            Continue
          </button>
        </form>
      )}

      <div className="flex space-x-3">
        <button
          onClick={() => setStep('time')}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => navigate('/matches')}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderCompletionScreen = () => {
    const firstName = getFirstName(match.basicInfo.name);
    return (
      <div className="space-y-6 text-center">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-semibold text-gray-900">Date Completed!</h2>
        
        <div className="bg-green-50 rounded-lg p-6 space-y-4">
          <p className="text-green-800">
            Thank you for confirming your date with {firstName}!
          </p>
          <p className="text-green-700">
            We hope you had a great time. You can now browse and match with new profiles.
          </p>
        </div>

        <div className="space-y-4 mt-6">
          <button
            onClick={() => navigate('/feedback')} // TODO: Implement feedback
            className="w-full px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
          >
            Share Your Experience
          </button>

          <button
            onClick={() => navigate('/matches')}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Browse New Profiles
          </button>
        </div>
      </div>
    );
  };

  const renderDateDetails = () => {
    const firstName = getFirstName(match.basicInfo.name);
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Date Details</h2>
        
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <span className="text-gray-600">When:</span>
            <span className="font-medium capitalize">
              {selectedDay}, {TIME_SLOTS[selectedTime].default}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-gray-600">Where:</span>
            <span className="font-medium">
              {selectedVenue.id === 'custom' ? customVenue : selectedVenue.name}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-gray-600">With:</span>
            <span className="font-medium">{firstName}</span>
          </div>
        </div>

        {isProposer ? (
          <div className="bg-rose-50 rounded-lg p-4 space-y-2">
            <p className="font-medium text-rose-900">Your Confirmation Code</p>
            <p className="text-2xl font-mono font-bold text-rose-600">{confirmationCode}</p>
            <p className="text-sm text-rose-700">
              After you've met and spent time together, share this code with your date. This helps us confirm you met in person and allows both of you to meet new people afterward.
            </p>
          </div>
        ) : (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter Confirmation Code
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Ask your date for their confirmation code after you've met in person. Entering the code confirms you met and allows both of you to meet new people.
              </p>
              <input
                type="text"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full p-3 border border-gray-200 rounded-lg focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
            >
              Confirm You Met With {firstName}
            </button>
          </form>
        )}

        <div className="space-y-3">
          <button
            onClick={() => window.open(`https://maps.google.com/?q=${selectedVenue.id === 'custom' ? customVenue : selectedVenue.name}`, '_blank')}
            className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2"
          >
            <span>📍 Get Directions</span>
          </button>

          <button
            onClick={() => {/* TODO: Implement chat */}}
            className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center space-x-2"
          >
            <span>💬 Chat with {firstName}</span>
          </button>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Safety Tips</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Meet in a public place</li>
              <li>• Tell a friend about your date</li>
              <li>• Keep your phone charged</li>
              <li>• Trust your instincts</li>
            </ul>
          </div>

          <button
            onClick={() => {/* TODO: Implement emergency contact */}}
            className="w-full px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center space-x-2"
          >
            <span>🆘 Emergency Contact</span>
          </button>

          {dateStatus === 'confirmed' && (
            <button
              onClick={() => {/* TODO: Implement date rescheduling */}}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
            >
              <span>📅 Request to Reschedule</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPendingConfirmation = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Date Pending Confirmation</h2>
      
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-3">
          <span className="text-gray-600">When:</span>
          <span className="font-medium capitalize">
            {selectedDay}, {TIME_SLOTS[selectedTime].default}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-gray-600">Where:</span>
          <span className="font-medium">
            {selectedVenue.id === 'custom' ? customVenue : selectedVenue.name}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-gray-600">With:</span>
          <span className="font-medium">{match.basicInfo.name}</span>
        </div>
      </div>

      <div className="bg-yellow-50 rounded-lg p-4">
        <p className="text-yellow-800">
          Waiting for {match.basicInfo.name} to confirm this date. You'll be notified when they respond.
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => navigate('/matches')}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Back to Matches
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-rose-500 text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Match not found</h1>
        <p className="text-gray-600 mb-6">We couldn't find the match you're looking for.</p>
        <button
          onClick={() => navigate('/matches')}
          className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        {showCompletionScreen ? renderCompletionScreen() : (
          <>
            {step === 'time' && renderTimeSelection()}
            {step === 'venue' && renderVenueSelection()}
            {step === 'confirm' && renderDateDetails()}
            {step === 'details' && renderDateDetails()}
            {step === 'pending' && renderPendingConfirmation()}
          </>
        )}
      </motion.div>
    </div>
  );
} 