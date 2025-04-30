import React, { useState } from 'react';
import { XMarkIcon, UserPlusIcon, ShareIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const EventShare = ({ event, onClose, friends }) => {
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleShare = async () => {
    // Here you would implement the actual sharing logic
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const toggleFriend = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold">Share Event</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Event Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{event.emoji}</span>
              <div>
                <h4 className="font-medium">{event.title}</h4>
                <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
              </div>
            </div>
          </div>

          {/* Friend Selection */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Invite Friends</h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {friends.map(friend => (
                <label
                  key={friend.id}
                  className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => toggleFriend(friend.id)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex items-center">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt="" className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {friend.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="ml-2 text-sm font-medium text-gray-900">{friend.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Add a Message</h4>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Write a personal message..."
              className="w-full p-2 border rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <button
              onClick={handleShare}
              disabled={selectedFriends.length === 0}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Send Invites ({selectedFriends.length})
            </button>
            
            <div className="flex space-x-2">
              <button className="flex-1 flex items-center justify-center px-4 py-2 border rounded-md hover:bg-gray-50">
                <ShareIcon className="h-5 w-5 mr-2" />
                Copy Link
              </button>
              <button className="flex-1 flex items-center justify-center px-4 py-2 border rounded-md hover:bg-gray-50">
                Share to Social
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
            <div className="text-center">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto" />
              <p className="mt-2 text-lg font-medium text-gray-900">Invites Sent!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventShare; 