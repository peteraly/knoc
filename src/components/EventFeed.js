import React from 'react';
import { UserGroupIcon, CalendarIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const EventFeed = ({ activities }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'join':
        return <UserGroupIcon className="h-8 w-8 text-green-500" />;
      case 'create':
        return <CalendarIcon className="h-8 w-8 text-blue-500" />;
      case 'invite':
        return <UserIcon className="h-8 w-8 text-purple-500" />;
      default:
        return null;
    }
  };

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'join':
        return (
          <span>
            <span className="font-medium">{activity.user}</span> joined{' '}
            <span className="font-medium">{activity.event.title}</span>
          </span>
        );
      case 'create':
        return (
          <span>
            <span className="font-medium">{activity.user}</span> created a new event:{' '}
            <span className="font-medium">{activity.event.title}</span>
          </span>
        );
      case 'invite':
        return (
          <span>
            <span className="font-medium">{activity.user}</span> invited friends to{' '}
            <span className="font-medium">{activity.event.title}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Activity Feed</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  {getActivityMessage(activity)}
                </p>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>{format(new Date(activity.event.date), 'MMM d')} at {activity.event.time}</span>
                  <MapPinIcon className="h-4 w-4 ml-4 mr-1" />
                  <span>{activity.event.location}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventFeed; 