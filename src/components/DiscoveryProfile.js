import React from 'react';
import { motion } from 'framer-motion';

const TIME_PERIODS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening'
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function DiscoveryProfile({ profile, onSkip, onProposeDate }) {
  if (!profile) {
    console.error('No profile provided to DiscoveryProfile');
    return null;
  }

  const handleProposeDate = () => {
    console.log('Profile data being passed:', profile); // Debug log
    onProposeDate(profile);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden"
    >
      {/* Profile Header */}
      <div className="relative">
        <div className="aspect-[4/5] bg-gray-200">
          <img
            src={profile.photo || '/default-avatar.png'}
            alt={profile.basicInfo?.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <h2 className="text-2xl font-semibold text-white">
            {profile.basicInfo?.name}, {profile.basicInfo?.age}
          </h2>
          <p className="text-white/90">{profile.basicInfo?.location}</p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {/* Bio */}
        {profile.basicInfo?.bio && (
          <div>
            <p className="text-gray-700">{profile.basicInfo.bio}</p>
          </div>
        )}

        {/* Activities */}
        <div>
          <h3 className="text-lg font-medium mb-3">Activities They Enjoy</h3>
          <div className="flex flex-wrap gap-2">
            {profile.activities?.map(activity => (
              <span
                key={activity}
                className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-sm"
              >
                {activity}
              </span>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div>
          <h3 className="text-lg font-medium mb-3">Their Availability</h3>
          <div className="space-y-3">
            {DAYS.map(day => {
              const dayAvailability = profile.availability?.[day] || [];
              if (dayAvailability.length === 0) return null;

              return (
                <div key={day} className="border rounded-lg p-3">
                  <h4 className="font-medium capitalize mb-2">{day}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(TIME_PERIODS).map(([period, label]) => (
                      <div
                        key={period}
                        className={`p-2 text-sm rounded-lg text-center ${
                          dayAvailability.includes(period)
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-gray-50 text-gray-400'
                        }`}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-3 px-6 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleProposeDate}
            className="flex-1 py-3 px-6 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 transition-colors"
          >
            Propose a Date
          </button>
        </div>
      </div>
    </motion.div>
  );
} 