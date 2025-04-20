import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const DatePlanning = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: View Availability, 2: Select Time, 3: Choose Venue, 4: Confirm
  const [dateRequest, setDateRequest] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [venue, setVenue] = useState('');
  const [note, setNote] = useState('');
  const [matchAvailability, setMatchAvailability] = useState(null);
  const [dateCode, setDateCode] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmationInput, setShowConfirmationInput] = useState(false);

  // Generate a random 6-digit code
  const generateDateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  useEffect(() => {
    const fetchDateRequest = async () => {
      const params = new URLSearchParams(location.search);
      const dateRequestId = params.get('dateRequestId');
      const matchId = params.get('matchId');

      if (!dateRequestId && !matchId) {
        setError('No date request or match ID provided');
        setLoading(false);
        return;
      }

      try {
        if (dateRequestId) {
          const requestRef = doc(db, 'dateRequests', dateRequestId);
          const requestSnap = await getDoc(requestRef);
          
          if (!requestSnap.exists()) {
            throw new Error('Date request not found');
          }

          const requestData = requestSnap.data();
          setDateRequest({
            id: requestSnap.id,
            ...requestData
          });

          // Fetch match's availability
          const otherUserId = requestData.senderId === currentUser.uid 
            ? requestData.recipientId 
            : requestData.senderId;
          
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            setMatchAvailability(userDoc.data().availability || {});
          }
        } else if (matchId) {
          // Fetch match details
          const matchRef = doc(db, 'matches', matchId);
          const matchSnap = await getDoc(matchRef);
          
          if (!matchSnap.exists()) {
            throw new Error('Match not found');
          }

          const matchData = matchSnap.data();
          const otherUserId = matchData.users.find(id => id !== currentUser.uid);
          
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            setMatchAvailability(userDoc.data().availability || {});
          }

          setDateRequest({
            matchId,
            otherUserId
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDateRequest();
  }, [currentUser, location]);

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedTime || !venue.trim()) {
      toast.error('Please select a time and enter a venue');
      return;
    }

    try {
      const generatedCode = generateDateCode();
      setDateCode(generatedCode);

      const dateDetails = {
        date: selectedTime.date,
        time: selectedTime.timeStr,
        venue: venue.trim(),
        note: note.trim() || null,
        confirmationCode: generatedCode,
        status: 'scheduled'
      };

      if (dateRequest.id) {
        // Update existing date request
        await updateDoc(doc(db, 'dateRequests', dateRequest.id), {
          dateDetails,
          status: 'scheduled',
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new date request
        const newDateRequest = {
          senderId: currentUser.uid,
          recipientId: dateRequest.otherUserId,
          matchId: dateRequest.matchId,
          status: 'scheduled',
          dateDetails,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'dateRequests'), newDateRequest);
      }

      setStep(4);
      toast.success('Date planned successfully!');
    } catch (error) {
      console.error('Error planning date:', error);
      toast.error('Failed to plan date. Please try again.');
    }
  };

  const handleConfirmDate = async () => {
    if (!confirmationCode) {
      toast.error('Please enter the confirmation code');
      return;
    }

    if (confirmationCode !== dateCode) {
      toast.error('Invalid confirmation code');
      return;
    }

    try {
      await updateDoc(doc(db, 'dateRequests', dateRequest.id), {
        status: 'completed',
        completedAt: serverTimestamp()
      });

      toast.success('Date confirmed! Check out new matches.');
      navigate('/matches');
    } catch (error) {
      console.error('Error confirming date:', error);
      toast.error('Failed to confirm date');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-rose-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium">{error}</p>
          <button
            onClick={() => navigate('/matches')}
            className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Date Details Section */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Date Details</h2>
            {dateCode ? (
              <div className="space-y-6">
                <div className="bg-rose-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Your Date Details</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Day:</span> {selectedTime.day}</p>
                    <p><span className="font-medium">Time:</span> {selectedTime.timeStr}</p>
                    <p><span className="font-medium">Venue:</span> {venue}</p>
                    {note && <p><span className="font-medium">Note:</span> {note}</p>}
                  </div>
                </div>

                <div className="bg-rose-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Confirmation Code</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Exchange this code with your date when you meet to confirm the date happened:
                  </p>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-2xl font-mono font-bold text-rose-500">{dateCode}</p>
                  </div>
                </div>

                {showConfirmationInput && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Enter Confirmation Code
                      </label>
                      <input
                        type="text"
                        value={confirmationCode}
                        onChange={(e) => setConfirmationCode(e.target.value)}
                        placeholder="Enter the code you received"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500"
                      />
                    </div>
                    <button
                      onClick={handleConfirmDate}
                      className="w-full px-6 py-3 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                    >
                      Confirm Date Happened
                    </button>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setShowConfirmationInput(!showConfirmationInput)}
                    className="text-rose-600 hover:text-rose-700 font-medium"
                  >
                    {showConfirmationInput ? 'Hide Confirmation' : 'Enter Confirmation Code'}
                  </button>
                  <button
                    onClick={() => navigate('/matches')}
                    className="text-gray-600 hover:text-gray-700 font-medium"
                  >
                    Back to Matches
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Existing form fields */}
                {/* ... */}
                <button
                  onClick={handleSubmit}
                  className="w-full px-6 py-3 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                >
                  Confirm Date Details
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatePlanning; 