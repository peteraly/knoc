import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function AvailabilityPicker() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = ['Morning', 'Afternoon', 'Evening'];
  
  const [availability, setAvailability] = useState({
    Sunday: [],
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: []
  });

  const [blackoutDates, setBlackoutDates] = useState([]);

  const toggleTimeSlot = (day, timeSlot) => {
    setAvailability(prev => ({
      ...prev,
      [day]: prev[day].includes(timeSlot)
        ? prev[day].filter(t => t !== timeSlot)
        : [...prev[day], timeSlot]
    }));
  };

  const handleBlackoutDateAdd = (e) => {
    const date = e.target.value;
    if (date && !blackoutDates.includes(date)) {
      setBlackoutDates(prev => [...prev, date]);
    }
  };

  const removeBlackoutDate = (date) => {
    setBlackoutDates(prev => prev.filter(d => d !== date));
  };

  const handleSubmit = async () => {
    // Validate that at least some availability is selected
    const hasAvailability = Object.values(availability).some(slots => slots.length > 0);
    if (!hasAvailability) {
      toast.error('Please select at least one time slot');
      return;
    }

    setLoading(true);
    try {
      console.log('Saving availability for user:', currentUser.uid);
      console.log('Availability data:', availability);
      console.log('Blackout dates:', blackoutDates);

      // Update user profile with availability
      const userRef = doc(db, 'users', currentUser.uid);
      const updateData = {
        availability,
        blackoutDates,
        onboardingComplete: true,
        onboardingStep: 'complete'
      };
      
      console.log('Updating user document with:', updateData);
      await updateDoc(userRef, updateData);

      console.log('Availability saved successfully');
      toast.success('Availability saved successfully!');
      
      // Add a small delay before navigation to ensure the toast is visible
      setTimeout(() => {
        console.log('Navigating to matches page');
        navigate('/matches');
      }, 1000);
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-gray-900">Set Your Availability</h1>
          <p className="mt-2 text-sm text-rose-600 italic">
            Let us know when you're free to meet someone special
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
          {/* Weekly Availability */}
          <div className="space-y-4">
            <h2 className="text-xl font-serif text-gray-900">Weekly Availability</h2>
            <p className="text-sm text-gray-500">Select the times you're typically available</p>

            <div className="grid gap-4">
              {days.map((day) => (
                <div key={day} className="flex items-center space-x-4">
                  <div className="w-24 font-medium text-gray-700">{day}</div>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map((timeSlot) => (
                      <button
                        key={timeSlot}
                        onClick={() => toggleTimeSlot(day, timeSlot)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          availability[day].includes(timeSlot)
                            ? 'bg-rose-100 text-rose-700 border-2 border-rose-500'
                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-rose-200'
                        }`}
                      >
                        {timeSlot}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blackout Dates */}
          <div className="space-y-4">
            <h2 className="text-xl font-serif text-gray-900">Blackout Dates</h2>
            <p className="text-sm text-gray-500">Add any dates you know you won't be available</p>

            <div className="space-y-4">
              <input
                type="date"
                onChange={handleBlackoutDateAdd}
                min={new Date().toISOString().split('T')[0]}
                className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              />

              {blackoutDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {blackoutDates.map((date) => (
                    <div
                      key={date}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-rose-100 text-rose-700"
                    >
                      {new Date(date).toLocaleDateString()}
                      <button
                        onClick={() => removeBlackoutDate(date)}
                        className="ml-2 text-rose-500 hover:text-rose-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 