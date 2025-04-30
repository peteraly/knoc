import React, { useState } from 'react';
import { UserCircleIcon, CalendarIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const FriendsList = ({ friends, onAddFriend, onViewFriendEvents }) => {
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');

  const handleAddFriend = (e) => {
    e.preventDefault();
    onAddFriend(friendEmail);
    setFriendEmail('');
    setShowAddFriend(false);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Friends</h2>
        <button
          onClick={() => setShowAddFriend(true)}
          className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
        >
          <UserPlusIcon className="h-4 w-4 mr-1" />
          Add Friend
        </button>
      </div>

      <div className="p-4 space-y-4">
        {friends.map(friend => (
          <div key={friend.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {friend.avatar ? (
                <img src={friend.avatar} alt="" className="h-10 w-10 rounded-full" />
              ) : (
                <UserCircleIcon className="h-10 w-10 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{friend.name}</p>
              {friend.nextEvent && (
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <p className="truncate">
                    Next: {friend.nextEvent.title} on {format(new Date(friend.nextEvent.date), 'MMM d')}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => onViewFriendEvents(friend)}
              className="flex-shrink-0 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200"
            >
              View Calendar
            </button>
          </div>
        ))}
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Friend</h3>
              <button
                onClick={() => setShowAddFriend(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddFriend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Friend's Email
                </label>
                <input
                  type="email"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddFriend(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsList; 