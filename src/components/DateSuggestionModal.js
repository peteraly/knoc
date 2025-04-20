import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

// Time slot definitions with ranges
const TIME_RANGES = {
  Morning: {
    default: '10:00',
    label: 'Morning',
    start: '09:00',
    end: '11:59'
  },
  Afternoon: {
    default: '14:00',
    label: 'Afternoon',
    start: '12:00',
    end: '16:59'
  },
  Evening: {
    default: '19:00',
    label: 'Evening',
    start: '17:00',
    end: '21:00'
  }
};

// Validation helpers
const isWithinTimeRange = (time, range) => {
  const [hours, minutes] = time.split(':').map(Number);
  const timeValue = hours * 60 + minutes;
  
  const [startHours, startMinutes] = range.start.split(':').map(Number);
  const startValue = startHours * 60 + startMinutes;
  
  const [endHours, endMinutes] = range.end.split(':').map(Number);
  const endValue = endHours * 60 + endMinutes;
  
  return timeValue >= startValue && timeValue <= endValue;
};

const isValidDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return false;
  
  // Check if date is in the past
  if (date < today) return false;
  
  // Check if date is too far in the future (e.g., 3 months)
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  if (date > threeMonthsFromNow) return false;
  
  // Check if date is on a blocked date
  const dateStr = date.toISOString().split('T')[0];
  if (blackoutDates?.includes(dateStr)) return false;
  
  return true;
};

const validateTimeSlot = (date, time, availability) => {
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
  const timeSlot = Object.entries(TIME_RANGES).find(([_, range]) => 
    isWithinTimeRange(time, range)
  )?.[0];
  
  return availability[dayOfWeek]?.includes(timeSlot?.toLowerCase());
};

const findOverlappingSlots = (user1Availability, user2Availability) => {
  const overlapping = [];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  days.forEach(day => {
    TIME_RANGES.forEach(slot => {
      if (user1Availability[day]?.includes(slot) && 
          user2Availability[day]?.includes(slot)) {
        overlapping.push({ day, slot });
      }
    });
  });
  
  return overlapping;
};

const getNextAvailableSlots = (overlappingSlots, blackoutDates = [], maxDays = 14) => {
  const slots = [];
  const today = new Date();
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow
  
  while (slots.length < 5 && currentDate.getTime() - today.getTime() < maxDays * 24 * 60 * 60 * 1000) {
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Skip if date is in blackout dates
    if (!blackoutDates.includes(dateStr)) {
      const daySlots = overlappingSlots.filter(slot => slot.day === dayName);
      daySlots.forEach(slot => {
        const timeRange = TIME_RANGES[slot.slot];
        slots.push({
          date: dateStr,
          day: dayName,
          timeSlot: slot.slot,
          timeStr: timeRange.default,
          label: timeRange.label
        });
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return slots.slice(0, 5); // Return top 5 suggestions
};

export default function DateSuggestionModal({ isOpen, onClose, match }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [venue, setVenue] = useState('');
  const [note, setNote] = useState('');
  const [showCustomDateTime, setShowCustomDateTime] = useState(false);
  const [matchAvailability, setMatchAvailability] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!isOpen || !match || !currentUser) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get both users' data
        const [userDoc, matchDoc] = await Promise.all([
          getDoc(doc(db, 'users', currentUser.uid)),
          getDoc(doc(db, 'users', match.id))
        ]);
        
        if (!userDoc.exists() || !matchDoc.exists()) {
          throw new Error('User data not found');
        }
        
        const userData = userDoc.data();
        const matchData = matchDoc.data();
        
        if (!userData.availability || !matchData.availability) {
          throw new Error('Please set your availability in your profile settings first');
        }
        
        // Store match's availability for display
        setMatchAvailability(matchData.availability);
        
        // Find overlapping availability
        const overlappingSlots = findOverlappingSlots(
          userData.availability,
          matchData.availability
        );
        
        if (overlappingSlots.length === 0) {
          setError('No overlapping availability found. Try proposing a custom time.');
        }
        
        // Get suggested date slots
        const suggestedDateSlots = getNextAvailableSlots(
          overlappingSlots,
          [...(userData.blackoutDates || []), ...(matchData.blackoutDates || [])]
        );
        
        setSuggestedSlots(suggestedDateSlots);

        // Auto-select first slot if available
        if (suggestedDateSlots.length > 0) {
          setSelectedSlot(suggestedDateSlots[0]);
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailability();
  }, [isOpen, match, currentUser]);

  const handleSubmit = async () => {
    try {
      let dateDetails;
      
      if (showCustomDateTime) {
        if (!customDate || !customTime || !venue.trim()) {
          throw new Error('Please fill in all required fields');
        }
        
        // Validate custom date and time
        if (!isValidDate(customDate)) {
          throw new Error('Invalid date selected. Please choose a date within the next 3 months.');
        }
        
        if (!validateTimeSlot(customDate, customTime, userAvailability)) {
          throw new Error('Selected time is not within your availability.');
        }
        
        dateDetails = {
          date: customDate,
          time: customTime,
          venue: venue.trim(),
          note: note.trim() || null,
          isCustomTime: true
        };
      } else {
        if (!selectedSlot || !venue.trim()) {
          throw new Error('Please select a time slot and enter a venue');
        }

        // Validate selected slot
        if (!isValidDate(selectedSlot.date)) {
          throw new Error('Invalid date selected. Please choose a different date.');
        }

        dateDetails = {
          date: selectedSlot.date,
          time: selectedSlot.timeStr,
          venue: venue.trim(),
          note: note.trim() || null,
          isCustomTime: false
        };
      }

      // Create date request
      const dateRequest = {
        senderId: currentUser.uid,
        recipientId: match.id,
        status: 'pending',
        dateDetails,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        matchId: match.matchId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      // Add to dateRequests collection
      await addDoc(collection(db, 'dateRequests'), dateRequest);

      toast.success('Date request sent! We\'ll notify you when they respond.');
      onClose();
    } catch (error) {
      console.error('Error sending date request:', error);
      toast.error(error.message || 'Failed to send date request. Please try again.');
    }
  };

  const renderMatchAvailability = () => {
    if (!matchAvailability) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">{match.basicInfo.name}'s Availability</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(matchAvailability).map(([day, slots]) => (
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
          {match.blackoutDates?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Blocked Dates</h4>
              <div className="flex flex-wrap gap-2">
                {match.blackoutDates.map(date => (
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
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Plan a Date with {match.basicInfo.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : (
          <div className="space-y-6">
            {renderMatchAvailability()}

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Select Time</h3>
              <button
                onClick={() => setShowCustomDateTime(!showCustomDateTime)}
                className="text-sm text-rose-600 hover:text-rose-700"
              >
                {showCustomDateTime ? 'View Suggested Times' : 'Propose Different Time'}
              </button>
            </div>

            {showCustomDateTime ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    max={new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    min="09:00"
                    max="21:00"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                    required
                  />
                </div>
              </div>
            ) : (
              suggestedSlots.length > 0 ? (
                <div className="space-y-4">
                  {suggestedSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full p-4 rounded-lg border ${
                        selectedSlot === slot
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">
                        {new Date(slot.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {slot.label} ({slot.timeStr})
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  No suggested times available. Try proposing a custom time.
                </div>
              )
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Enter venue name or address"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any special requests or preferences?"
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600"
              >
                Send Date Request
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
} 