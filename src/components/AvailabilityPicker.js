import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { toast } from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityPicker() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState({});
  const [blackoutDates, setBlackoutDates] = useState([]);
  const [newBlackoutDate, setNewBlackoutDate] = useState(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Initialize availability with existing data or empty slots
          const initialAvailability = userData.availability || {};
          DAYS.forEach(day => {
            if (!initialAvailability[day]) {
              initialAvailability[day] = [];
            }
          });
          setAvailability(initialAvailability);
          setBlackoutDates(userData.blackoutDates || []);
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
        toast.error('Failed to load your availability');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [currentUser]);

  const toggleTimeSlot = (day, slot) => {
    setAvailability(prev => {
      const updatedAvailability = { ...prev };
      const daySlots = updatedAvailability[day] || [];
      
      if (daySlots.includes(slot)) {
        updatedAvailability[day] = daySlots.filter(s => s !== slot);
      } else {
        updatedAvailability[day] = [...daySlots, slot].sort();
      }
      
      return updatedAvailability;
    });
  };

  const addBlackoutDate = () => {
    if (!newBlackoutDate) return;

    const dateStr = newBlackoutDate.toISOString().split('T')[0];
    if (blackoutDates.includes(dateStr)) {
      toast.error('This date is already blocked');
      return;
    }

    setBlackoutDates(prev => [...prev, dateStr].sort());
    setNewBlackoutDate(null);
  };

  const removeBlackoutDate = (dateStr) => {
    setBlackoutDates(prev => prev.filter(d => d !== dateStr));
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Validate that at least one time slot is selected
      const hasTimeSlots = Object.values(availability).some(slots => slots.length > 0);
      if (!hasTimeSlots) {
        throw new Error('Please select at least one time slot');
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        availability,
        blackoutDates,
        updatedAt: new Date()
      });

      toast.success('Availability updated successfully');
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error(error.message || 'Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Weekly Availability</h2>
        <div className="grid gap-4">
          {DAYS.map(day => (
            <div key={day} className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-700 mb-2">{day}</div>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot}
                    onClick={() => toggleTimeSlot(day, slot)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                      ${availability[day]?.includes(slot)
                        ? 'bg-rose-500 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Blocked Dates</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <DatePicker
              selected={newBlackoutDate}
              onChange={setNewBlackoutDate}
              minDate={new Date()}
              placeholderText="Select a date to block"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
              dateFormat="MMMM d, yyyy"
            />
            <button
              onClick={addBlackoutDate}
              disabled={!newBlackoutDate}
              className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>

          <div className="grid gap-2">
            {blackoutDates.map(date => (
              <div
                key={date}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <span>
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <button
                  onClick={() => removeBlackoutDate(date)}
                  className="text-rose-500 hover:text-rose-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
} 