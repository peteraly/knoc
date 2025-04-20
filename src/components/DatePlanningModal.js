import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DateSuggestionModal from './DateSuggestionModal';
import { toast } from 'react-hot-toast';

export default function DatePlanningModal({ isOpen, onClose, match }) {
  const { currentUser } = useAuth();
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Add validation check when modal opens
  useEffect(() => {
    if (isOpen && match?.id === currentUser?.uid) {
      toast.error("You cannot schedule a date with yourself!");
      onClose();
    }
  }, [isOpen, match?.id, currentUser?.uid, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Plan a Date</h2>
        
        <div className="space-y-6">
          <p className="text-gray-600">
            Would you like to see suggested times based on both of your availabilities?
          </p>

          <div className="flex space-x-3">
            <button
              onClick={() => setShowSuggestions(true)}
              className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600"
            >
              View Suggestions
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {showSuggestions && (
        <DateSuggestionModal
          isOpen={showSuggestions}
          onClose={() => {
            setShowSuggestions(false);
            onClose();
          }}
          match={match}
        />
      )}
    </div>
  );
} 