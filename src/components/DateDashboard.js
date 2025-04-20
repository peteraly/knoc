import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, doc as firestoreDoc, updateDoc, serverTimestamp, getDoc, addDoc, onSnapshot, orderBy, writeBatch } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export default function DateDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({
    current: null,
    past: []
  });
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchDates = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      // Fetch sent and received date requests
      const sentQuery = query(
        collection(db, 'dateRequests'),
        where('senderId', '==', currentUser.uid),
        where('status', 'in', ['confirmed', 'completed'])
      );
      const receivedQuery = query(
        collection(db, 'dateRequests'),
        where('recipientId', '==', currentUser.uid),
        where('status', 'in', ['confirmed', 'completed'])
      );

      const [sentSnap, receivedSnap] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
      ]);

      const processedDates = {
        current: null,
        past: []
      };

      const processDateDoc = async (doc) => {
        const date = doc.data();
        const otherUserId = date.senderId === currentUser.uid ? date.recipientId : date.senderId;
        const otherUserDoc = await getDoc(firestoreDoc(db, 'users', otherUserId));
        const otherUserData = otherUserDoc.data();

        return {
          id: doc.id,
          ...date,
          type: date.senderId === currentUser.uid ? 'sent' : 'received',
          dateDetails: date.dateDetails || null,
          otherUser: {
            id: otherUserId,
            name: otherUserData?.basicInfo?.name || 'User',
            photo: otherUserData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUserData?.basicInfo?.name || 'User')}`
          }
        };
      };

      // Process all date requests
      const allDates = await Promise.all([
        ...sentSnap.docs.map(doc => processDateDoc(doc)),
        ...receivedSnap.docs.map(doc => processDateDoc(doc))
      ]);

      // Find the current active date (confirmed but not completed)
      const currentDate = allDates.find(date => 
        date.status === 'confirmed' && 
        date.dateDetails?.confirmationCode &&
        !date.completedAt
      );

      // All other completed dates go to past
      const pastDates = allDates.filter(date => 
        date.status === 'completed' || 
        date.completedAt
      );

      processedDates.current = currentDate || null;
      processedDates.past = pastDates.sort((a, b) => 
        (b.completedAt?.toDate() || 0) - (a.completedAt?.toDate() || 0)
      );

      setDates(processedDates);
    } catch (error) {
      console.error('Error fetching dates:', error);
      toast.error('Failed to load dates');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  const handleConfirmDate = (date) => {
    setSelectedDate(date);
    setShowConfirmationModal(true);
  };

  const handleConfirmationSubmit = async () => {
    if (!confirmationCode) {
      toast.error('Please enter the confirmation code');
      return;
    }

    try {
      const dateRef = firestoreDoc(db, 'dateRequests', selectedDate.id);
      const dateDoc = await getDoc(dateRef);
      
      if (!dateDoc.exists()) {
        throw new Error('Date request not found');
      }

      const dateData = dateDoc.data();
      if (confirmationCode !== dateData.dateDetails.confirmationCode) {
        toast.error('Invalid confirmation code');
        return;
      }

      await updateDoc(dateRef, {
        status: 'completed',
        completedAt: serverTimestamp()
      });

      // Update local state
      setDates(prev => ({
        current: null,
        past: [{ ...selectedDate, status: 'completed', completedAt: new Date() }, ...prev.past]
      }));

      setShowConfirmationModal(false);
      setConfirmationCode('');
      setSelectedDate(null);

      toast.success('Date confirmed! You can now browse new matches.');
      navigate('/matches');
    } catch (error) {
      console.error('Error confirming date:', error);
      toast.error('Failed to confirm date');
    }
  };

  const renderConfirmationModal = () => {
    if (!showConfirmationModal || !selectedDate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold mb-4">Confirm Date</h3>
          <p className="text-gray-600 mb-4">
            Enter the confirmation code you received from {selectedDate.otherUser.name} to verify the date happened.
          </p>
          <input
            type="text"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            placeholder="Enter confirmation code"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowConfirmationModal(false);
                setConfirmationCode('');
                setSelectedDate(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmationSubmit}
              className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDateCard = (date, isCurrent = false) => {
    if (!date) return null;

    return (
      <motion.div
        key={date.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={date.otherUser.photo}
              alt={date.otherUser.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-medium text-lg">{date.otherUser.name}</h3>
              <p className="text-sm text-gray-500">
                {isCurrent ? 'Current Date' : 'Past Date'}
                {date.completedAt && ` · Completed ${new Date(date.completedAt.toDate()).toLocaleDateString()}`}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm ${
            isCurrent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {isCurrent ? 'Active' : 'Completed'}
          </span>
        </div>

        {date.dateDetails && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(date.dateDetails.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </div>
            {date.dateDetails.time && (
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {date.dateDetails.time}
              </div>
            )}
            {date.dateDetails.venue && (
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {date.dateDetails.venue}
              </div>
            )}
          </div>
        )}

        {isCurrent && (
          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => handleConfirmDate(date)}
              className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
            >
              Enter Confirmation Code
            </button>
            {date.chatId && (
              <button
                onClick={() => navigate(`/chat/${date.chatId}`)}
                className="flex-1 px-4 py-2 border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50"
              >
                Chat
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Dates</h1>
      </div>

      <div className="space-y-8">
        {/* Current Date Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Current Date</h2>
          {dates.current ? (
            renderDateCard(dates.current, true)
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600">No active date at the moment.</p>
              <button
                onClick={() => navigate('/matches')}
                className="mt-4 px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
              >
                Find Matches
              </button>
            </div>
          )}
        </div>

        {/* Past Dates Section */}
        {dates.past.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Past Dates</h2>
            <div className="space-y-4">
              {dates.past.map(date => renderDateCard(date, false))}
            </div>
          </div>
        )}
      </div>

      {renderConfirmationModal()}
    </div>
  );
} 