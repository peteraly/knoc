import React, { useState } from 'react';
import { useEvent } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatTime } from '../utils/dateUtils';

const EventCancellationNotification = ({ notification, onClose }) => {
  const { transferUserToEvent, processRefund } = useEvent();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleTransfer = async (toEventId) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      await transferUserToEvent(user.uid, notification.eventId, toEventId);
      setSuccess('You have been successfully transferred to the new event.');
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to transfer to the new event.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefund = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      await processRefund(user.uid, notification.eventId);
      setSuccess('Your refund has been processed successfully.');
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to process your refund.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Event Cancelled</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-2">{notification.message}</p>
        <p className="text-gray-600 text-sm">
          We're sorry for any inconvenience. Please choose one of the options below.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4">
          {success}
        </div>
      )}
      
      {notification.similarEvents && notification.similarEvents.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Similar Events You Might Like</h4>
          <div className="space-y-3">
            {notification.similarEvents.map(event => (
              <div 
                key={event.id}
                className="border border-gray-200 rounded-md p-3 hover:border-blue-300 transition-colors"
              >
                <h5 className="font-medium text-gray-900">{event.title}</h5>
                <div className="text-sm text-gray-600 mt-1">
                  <p>{formatDate(event.date)} at {formatTime(event.time)}</p>
                  <p>{event.location}</p>
                </div>
                <button
                  onClick={() => handleTransfer(event.id)}
                  disabled={isProcessing}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Transfer to this event'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="border-t border-gray-200 pt-4">
        <p className="text-gray-700 mb-3">Or you can request a full refund:</p>
        <button
          onClick={handleRefund}
          disabled={isProcessing}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Request Refund'}
        </button>
      </div>
    </div>
  );
};

export default EventCancellationNotification; 