import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { db } from '../utils/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp, getDoc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';

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
    },
    activities: ['Coffee & Tea', 'Outdoor Walks', 'Museums & Galleries']
  },
  currentUser: {
    availability: {
      monday: ['6:00 PM', '7:00 PM', '8:00 PM'],
      wednesday: ['5:00 PM', '6:00 PM', '7:00 PM'],
      friday: ['6:00 PM', '7:00 PM', '8:00 PM']
    }
  }
};

const CURRENT_USER_AVAILABILITY = {
  monday: ['morning', 'afternoon'],
  wednesday: ['afternoon'],
  friday: ['afternoon'],
  saturday: ['morning', 'afternoon']
};

const TIME_PERIODS = {
  morning: ['9:00 AM', '10:00 AM', '11:00 AM'],
  afternoon: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
  evening: ['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM']
};

const VENUES = [
  { id: 'coffee', name: 'Coffee Shop', icon: '☕️' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'park', name: 'Park', icon: '🌳' },
  { id: 'museum', name: 'Museum', icon: '🏛️' },
  { id: 'custom', name: 'Custom Venue', icon: '📍' }
];

const ACTIVITIES = [
  { id: 1, name: 'Coffee & Conversation', type: 'casual' },
  { id: 2, name: 'Wine Tasting', type: 'romantic' },
  { id: 3, name: 'Dinner', type: 'formal' },
  { id: 4, name: 'Picnic', type: 'outdoor' }
];

// Helper function to get first name
const getFirstName = (fullName) => fullName.split(' ')[0];

const STEPS = {
  SELECT_TIME: 'select_time',
  SELECT_ACTIVITY: 'select_activity',
  CONFIRM: 'confirm',
  CUSTOM_DATE: 'custom_date'
};

const SAMPLE_VENUES = [
  {
    id: 'v1',
    name: 'The Coffee House',
    type: 'Café',
    address: '123 Main St',
    image: 'https://source.unsplash.com/random/800x600/?cafe'
  },
  {
    id: 'v2',
    name: 'Central Park',
    type: 'Park',
    address: 'Central Park West',
    image: 'https://source.unsplash.com/random/800x600/?park'
  },
  {
    id: 'v3',
    name: 'Art Gallery',
    type: 'Cultural',
    address: '456 Culture Ave',
    image: 'https://source.unsplash.com/random/800x600/?art-gallery'
  }
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function DatePlanning() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const profile = location.state?.profile || null;
  const returnTo = location.state?.returnTo || '/discovery';
  const [currentStep, setCurrentStep] = useState(STEPS.SELECT_TIME);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [customVenue, setCustomVenue] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [dateRequest, setDateRequest] = useState(null);
  const [isRecipient, setIsRecipient] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [overlappingSlots, setOverlappingSlots] = useState({});
  const [currentUserAvailability, setCurrentUserAvailability] = useState(null);

  // Calculate overlapping availability using useMemo
  const calculateOverlappingSlots = useMemo(() => {
    if (!profile?.availability || !currentUserAvailability) {
      console.log('Missing availability data:', { profile: profile?.availability, currentUser: currentUserAvailability });
      return {};
    }

    console.log('Profile availability:', profile.availability);
    console.log('Current user availability:', currentUserAvailability);

    const overlapping = {};
    
    DAYS.forEach(day => {
      const userPeriods = currentUserAvailability[day] || [];
      const matchPeriods = profile.availability[day] || [];
      
      if (userPeriods.length > 0 && matchPeriods.length > 0) {
        // Find overlapping periods (morning, afternoon, evening)
        const overlappingPeriods = matchPeriods.filter(period => 
          userPeriods.includes(period)
        );
        
        if (overlappingPeriods.length > 0) {
          overlapping[day] = overlappingPeriods;
          console.log(`Found overlapping periods for ${day}:`, overlappingPeriods);
        }
      }
    });

    console.log('Final overlapping slots:', overlapping);
    return overlapping;
  }, [profile?.availability, currentUserAvailability]);

  useEffect(() => {
    console.log('DatePlanning mounted with profile:', profile);
    
    if (!profile) {
      console.error('No profile data provided');
      toast.error('Missing profile data');
      navigate(returnTo);
      return;
    }

    // Fetch current user's availability
    const fetchCurrentUserAvailability = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUserAvailability(userData.availability || {});
          console.log('Fetched current user availability:', userData.availability);
        } else {
          console.error('Current user document not found');
          toast.error('Failed to load your availability');
          navigate(returnTo);
        }
      } catch (error) {
        console.error('Error fetching current user availability:', error);
        toast.error('Failed to load your availability');
        navigate(returnTo);
      }
    };

    fetchCurrentUserAvailability();

    if (location.state?.requestId) {
      setRequestId(location.state.requestId);
      // Use a simple document reference instead of a compound query
      const dateRequestRef = doc(db, 'dateRequests', location.state.requestId);
      
      const unsubscribe = onSnapshot(dateRequestRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setDateRequest(data);
          setIsRecipient(data.recipientId === currentUser.uid);
          
          if (data.dateDetails) {
            setSelectedDay(data.dateDetails.day || '');
            setSelectedTime(data.dateDetails.time || '');
            setSelectedActivity(data.dateDetails.activity || '');
            if (data.dateDetails.venue) {
              const venue = VENUES.find(v => v.name === data.dateDetails.venue);
              setSelectedVenue(venue || { id: 'custom', name: data.dateDetails.venue });
              if (!venue) {
                setCustomVenue(data.dateDetails.venue);
              }
            }
          }
        }
      }, (error) => {
        console.error('Error fetching date request:', error);
        toast.error('Failed to load date request details');
      });

      return () => unsubscribe();
    }

    setLoading(false);
  }, [profile, location.state?.requestId, currentUser?.uid, navigate, returnTo]);

  // Update overlapping slots when availability changes
  useEffect(() => {
    if (currentUserAvailability && profile?.availability) {
      setOverlappingSlots(calculateOverlappingSlots);
      setLoading(false);
    }
  }, [currentUserAvailability, profile?.availability, calculateOverlappingSlots]);

  const handleNext = () => {
    if (currentStep === STEPS.SELECT_TIME && selectedDay && selectedTime) {
      setCurrentStep(STEPS.SELECT_ACTIVITY);
    } else if (currentStep === STEPS.SELECT_ACTIVITY && selectedActivity) {
      setCurrentStep(STEPS.CONFIRM);
    }
  };

  const handleBack = () => {
    if (currentStep === STEPS.SELECT_ACTIVITY) {
      setCurrentStep(STEPS.SELECT_TIME);
    } else if (currentStep === STEPS.CONFIRM) {
      setCurrentStep(STEPS.SELECT_ACTIVITY);
    } else {
      navigate(returnTo);
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedDay || !selectedTime || !selectedActivity) {
      toast.error('Please select a day, time, and activity');
      return;
    }

    try {
      const dateRequestRef = collection(db, 'dateRequests');
      const newRequest = {
        senderId: currentUser.uid,
        recipientId: profile.id,
        participants: [currentUser.uid, profile.id], // Add both users to participants array
        status: 'pending',
        dateDetails: {
          day: selectedDay,
          time: selectedTime,
          activity: selectedActivity
        },
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      const docRef = await addDoc(dateRequestRef, newRequest);
      console.log('Created date request with ID:', docRef.id);
      
      toast.success('Date request sent successfully!');
      navigate(returnTo || '/matches');
    } catch (error) {
      console.error('Error creating date request:', error);
      toast.error('Failed to send date request');
    }
  };

  const handleReject = async () => {
    if (!location.state?.requestId) return;

    try {
      await updateDoc(doc(db, 'dateRequests', location.state.requestId), {
        status: 'rejected',
        updatedAt: new Date()
      });
      toast.success('Date request declined');
      navigate('/matches');
    } catch (error) {
      console.error('Error rejecting date:', error);
      toast.error('Failed to decline date request');
    }
  };

  // Render different views based on request status
  if (dateRequest?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Date Request Declined</h2>
            <p className="text-gray-600 mb-6">This date request has been declined.</p>
            <button
              onClick={() => navigate('/matches')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
            >
              Back to Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (dateRequest?.status === 'confirmed') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Date Confirmed!</h2>
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-green-800">
                  Your date is set for {dateRequest.dateDetails.day} at {dateRequest.dateDetails.time}
                </p>
                <p className="text-green-700 mt-2">
                  Activity: {dateRequest.dateDetails.activity}
                </p>
                {dateRequest.dateDetails.message && (
                  <p className="text-green-700 mt-2 italic">
                    "{dateRequest.dateDetails.message}"
                  </p>
                )}
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-800 font-medium">Confirmation Code</p>
                <p className="text-blue-900 text-2xl font-mono mt-2">
                  {dateRequest.dateDetails.confirmationCode}
                </p>
                <p className="text-blue-700 text-sm mt-2">
                  Share this code with your date after meeting to confirm the date happened!
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/matches')}
              className="w-full mt-6 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
            >
              Back to Matches
            </button>
          </div>
        </div>
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
      <div className="max-w-lg mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {Object.values(STEPS).map((step, index) => (
              <div
                key={step}
                className={`flex items-center ${
                  index < Object.values(STEPS).indexOf(currentStep)
                    ? 'text-rose-500'
                    : index === Object.values(STEPS).indexOf(currentStep)
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium">
                  {index + 1}
                </div>
                {index < Object.values(STEPS).length - 1 && (
                  <div className="hidden sm:block w-24 h-0.5 mx-2 bg-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {currentStep === STEPS.SELECT_TIME && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Select Day</h3>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS.map(day => {
                    const hasAvailability = overlappingSlots[day]?.length > 0;
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={!hasAvailability}
                        onClick={() => setSelectedDay(day)}
                        className={`p-3 rounded-lg text-left capitalize ${
                          selectedDay === day
                            ? 'bg-rose-500 text-white'
                            : hasAvailability
                            ? 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDay && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Select Time</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {overlappingSlots[selectedDay]?.map(period => (
                      <div key={period} className="space-y-2">
                        <h4 className="font-medium capitalize">{period}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {TIME_PERIODS[period].map(time => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`p-3 rounded-lg text-left ${
                                selectedTime === time
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === STEPS.SELECT_ACTIVITY && (
            <div>
              <h3 className="text-lg font-medium mb-4">Select Activity</h3>
              <div className="grid grid-cols-2 gap-2">
                {profile.activities.map(activity => (
                  <button
                    key={activity}
                    type="button"
                    onClick={() => setSelectedActivity(activity)}
                    className={`p-3 rounded-lg text-left ${
                      selectedActivity === activity
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {activity}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === STEPS.CONFIRM && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Confirm Date Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><span className="font-medium">With:</span> {profile.basicInfo?.name}</p>
                <p><span className="font-medium">Day:</span> {selectedDay}</p>
                <p><span className="font-medium">Time:</span> {selectedTime}</p>
                <p><span className="font-medium">Activity:</span> {selectedActivity}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add a message (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Looking forward to meeting you!"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  rows={3}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Once you send this request, {profile.basicInfo?.name.split(' ')[0]} will need to confirm.
                  After your date, you'll both need to enter a confirmation code.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          {currentStep === STEPS.CONFIRM ? (
            <button
              onClick={handleCreateRequest}
              disabled={loading}
              className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Date Request'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === STEPS.SELECT_TIME && (!selectedDay || !selectedTime)) ||
                (currentStep === STEPS.SELECT_ACTIVITY && !selectedActivity)
              }
              className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
} 