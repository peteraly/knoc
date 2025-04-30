import React from 'react';
import { UserCircleIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const FriendActivity = ({ friends }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Friends' Events</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {friends.map((friend) => (
          <div key={friend.id} className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              {friend.avatar ? (
                <img src={friend.avatar} alt={friend.name} className="h-8 w-8 rounded-full" />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
              )}
              <span className="font-medium text-gray-900">{friend.name}</span>
            </div>
            {friend.upcomingEvents.map((event) => (
              <div key={event.id} className="ml-11 mb-3 last:mb-0">
                <div className="flex items-center space-x-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">{event.title}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {format(new Date(event.date), 'MMM d')} at {event.time}
                </p>
                <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">
                  Join {friend.name}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendActivity; 