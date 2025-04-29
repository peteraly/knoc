import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import EventCancellationNotification from './EventCancellationNotification';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const { notifications, markAsRead, deleteNotification } = useNotification();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    if (user) {
      const count = notifications.filter(n => !n.read).length;
      setUnreadCount(count);
    }
  }, [notifications, user]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // If it's a cancellation notification with similar events, show the special UI
    if (notification.type === 'event_cancelled' && notification.similarEvents) {
      setSelectedNotification(notification);
    } else {
      // Handle other notification types normally
      // For now, just close the notification
      deleteNotification(notification.id);
    }
  };

  const handleCloseCancellationNotification = () => {
    if (selectedNotification) {
      deleteNotification(selectedNotification.id);
      setSelectedNotification(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <span className="sr-only">View notifications</span>
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            </div>
            
            {notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for cancellation notification */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <EventCancellationNotification
            notification={selectedNotification}
            onClose={handleCloseCancellationNotification}
          />
        </div>
      )}
    </div>
  );
};

export default Notifications; 