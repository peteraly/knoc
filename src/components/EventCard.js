import React from 'react';
import { format } from 'date-fns';
import { MapPinIcon, CalendarIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useEvents } from '../contexts/EventContext';

const EventCard = ({ event, type = 'discover' }) => {
  const { 
    toggleAttendance, 
    isUserAttending, 
    isUserWaitlisted,
    getEventAttendeeCount,
    getEventStatusText,
    getEventStatusColor
  } = useEvents();

  const isAttending = isUserAttending(event.id);
  const isWaitlisted = isUserWaitlisted(event.id);
  const attendeeCount = getEventAttendeeCount(event.id);
  const statusText = getEventStatusText(event.id);
  const statusColor = getEventStatusColor(event.id);

  const handleActionClick = () => {
    toggleAttendance(event.id);
  };

  const getActionButton = () => {
    switch (type) {
      case 'confirmed':
        return (
          <button
            onClick={handleActionClick}
            className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Cancel Attendance
          </button>
        );
      case 'waitlist':
        return (
          <button
            onClick={handleActionClick}
            className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Leave Waitlist
          </button>
        );
      default:
        return (
          <button
            onClick={handleActionClick}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {attendeeCount >= event.maxAttendees ? 'Join Waitlist' : 'Attend Event'}
          </button>
        );
    }
  };

  return (
    <div className="w-72 bg-white rounded-xl shadow-lg p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{event.emoji}</span>
        <h3 className="text-lg font-semibold text-gray-800 truncate">{event.title}</h3>
      </div>

      <div className="space-y-2 flex-grow">
        <div className="flex items-center gap-2 text-gray-600">
          <CalendarIcon className="h-5 w-5" />
          <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <ClockIcon className="h-5 w-5" />
          <span>{event.time}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <MapPinIcon className="h-5 w-5" />
          <span className="truncate">{event.location}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <UserGroupIcon className="h-5 w-5" />
          <span>{attendeeCount} / {event.maxAttendees} attendees</span>
        </div>

        <div className={`text-sm font-medium ${statusColor}`}>
          {statusText}
        </div>
      </div>

      {getActionButton()}
    </div>
  );
};

export default EventCard; 