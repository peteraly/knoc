import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DateSuggestionModal({ profile, onSubmit, onClose }) {
  const [dateDetails, setDateDetails] = useState({
    activity: profile.interests[0] || '',
    day: Object.keys(profile.availability)[0] || '',
    time: '',
    venue: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(dateDetails);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Plan Your Date with {profile.name}
          </h2>
          <p className="text-gray-600 mb-6">
            Great! Now that you've accepted the date request, let's plan the details together.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Activity Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to do?
              </label>
              <select
                value={dateDetails.activity}
                onChange={(e) => setDateDetails({ ...dateDetails, activity: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:border-rose-500 focus:ring-rose-500"
                required
              >
                <option value="">Select an activity</option>
                {profile.interests.map((interest) => (
                  <option key={interest} value={interest}>
                    {interest}
                  </option>
                ))}
              </select>
            </div>

            {/* Day Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which day works best?
              </label>
              <select
                value={dateDetails.day}
                onChange={(e) => setDateDetails({ ...dateDetails, day: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:border-rose-500 focus:ring-rose-500"
                required
              >
                <option value="">Select a day</option>
                {Object.keys(profile.availability).map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What time would you prefer?
              </label>
              <select
                value={dateDetails.time}
                onChange={(e) => setDateDetails({ ...dateDetails, time: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:border-rose-500 focus:ring-rose-500"
                required
              >
                <option value="">Select a time</option>
                {dateDetails.day && profile.availability[dateDetails.day].map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            {/* Venue Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suggest a venue or location
              </label>
              <input
                type="text"
                value={dateDetails.venue}
                onChange={(e) => setDateDetails({ ...dateDetails, venue: e.target.value })}
                placeholder="e.g., Central Park, Starbucks on 5th Ave"
                className="w-full rounded-lg border-gray-300 focus:border-rose-500 focus:ring-rose-500"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
              >
                Send Date Details
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 