import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, doc as firestoreDoc, getDoc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { findOverlappingTimeSlots } from '../utils/matcher';

export default function DatingDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upcomingDates, setUpcomingDates] = useState([]);
  const [newMatches, setNewMatches] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [currentView, setCurrentView] = useState('profiles');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBio, setShowBio] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [step, setStep] = useState('view');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [userAvailability, setUserAvailability] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState(null);

  // Get current item based on view and index
  const currentItem = currentView === 'matches' 
    ? newMatches[currentIndex] 
    : currentView === 'upcoming'
    ? upcomingDates[currentIndex]
    : allProfiles[currentIndex];

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const processedProfiles = [];
        
        for (const userDoc of usersSnapshot.docs) {
          if (userDoc.id !== currentUser.uid) {
            const userData = userDoc.data();
            processedProfiles.push({
              id: userDoc.id,
              type: 'profile',
              otherUser: {
                id: userDoc.id,
                name: userData.basicInfo?.name,
                age: userData.basicInfo?.age,
                location: userData.basicInfo?.location,
                photo: userData.photoURL,
                bio: userData.basicInfo?.bio,
                interests: userData.interests,
                activities: userData.activities,
                availability: userData.availability
              }
            });
          }
        }

        // Fetch existing matches
        const matchesSnapshot = await getDocs(
          query(
            collection(db, 'matches'),
            where('users', 'array-contains', currentUser.uid)
          )
        );

        const processedMatches = [];
        const matchIds = new Set();

        for (const matchDoc of matchesSnapshot.docs) {
          const matchData = matchDoc.data();
          const otherUserId = matchData.users.find(id => id !== currentUser.uid);
          matchIds.add(otherUserId);

          try {
            const otherUserDoc = await getDoc(firestoreDoc(db, 'users', otherUserId));
            const otherUserData = otherUserDoc.data();

            processedMatches.push({
              id: matchDoc.id,
              type: 'match',
              otherUser: {
                id: otherUserId,
                name: otherUserData?.basicInfo?.name,
                age: otherUserData?.basicInfo?.age,
                location: otherUserData?.basicInfo?.location,
                photo: otherUserData?.photoURL
              }
            });
          } catch (err) {
            console.error('Error fetching user data:', err);
          }
        }

        // Fetch upcoming dates
        const datesSnapshot = await getDocs(
          query(
            collection(db, 'dateRequests'),
            where('status', '==', 'accepted')
          )
        );

        const processedDates = [];

        for (const dateDoc of datesSnapshot.docs) {
          const dateData = dateDoc.data();
          const otherUserId = dateData.senderId === currentUser.uid
            ? dateData.recipientId
            : dateData.senderId;

          try {
            const otherUserDoc = await getDoc(firestoreDoc(db, 'users', otherUserId));
            const otherUserData = otherUserDoc.data();

            processedDates.push({
              id: dateDoc.id,
              type: 'date',
              scheduledFor: dateData.scheduledFor,
              location: dateData.location,
              otherUser: {
                id: otherUserId,
                name: otherUserData?.basicInfo?.name,
                age: otherUserData?.basicInfo?.age,
                location: otherUserData?.basicInfo?.location,
                photo: otherUserData?.photoURL
              }
            });
          } catch (err) {
            console.error('Error fetching user data:', err);
          }
        }

        // Filter out profiles that are already matches
        const availableProfiles = processedProfiles.filter(
          profile => !matchIds.has(profile.otherUser.id)
        );

        setAllProfiles(availableProfiles);
        setNewMatches(processedMatches);
        setUpcomingDates(processedDates);
        setCurrentIndex(0);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load profiles and matches. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handlePlanDate = (matchId) => {
    const match = newMatches.find(m => m.id === matchId);
    if (match) {
      setSelectedMatch(match);
      setStep('plan');
      navigate(`/date-planning/new?matchId=${matchId}`);
    }
  };

  const handleConfirmDate = async (dateId) => {
    setSelectedDateId(dateId);
    setShowConfirmationModal(true);
  };

  const handleConfirmationSubmit = async () => {
    if (!confirmationCode) {
      toast.error('Please enter the confirmation code');
      return;
    }

    try {
      const dateRef = firestoreDoc(db, 'dateRequests', selectedDateId);
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
      setUpcomingDates(prev => prev.filter(date => date.id !== selectedDateId));
      setShowConfirmationModal(false);
      setConfirmationCode('');
      setSelectedDateId(null);

      toast.success('Date confirmed! Check out new matches.');
    } catch (error) {
      console.error('Error confirming date:', error);
      toast.error('Failed to confirm date');
    }
  };

  const handleNext = () => {
    const currentArray = currentView === 'matches' ? newMatches : upcomingDates;
    if (currentIndex < currentArray.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowBio(false);
      setShowAvailability(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowBio(false);
      setShowAvailability(false);
    }
  };

  const handlePass = () => {
    handleNext();
    toast.success('Profile passed');
  };

  const handleSendInvite = async (profileId) => {
    try {
      // Create a new match document
      const matchRef = await addDoc(collection(db, 'matches'), {
        users: [currentUser.uid, profileId],
        createdAt: serverTimestamp(),
        status: 'pending',
        initiatedBy: currentUser.uid
      });

      // Create a notification for the recipient
      await addDoc(collection(db, 'notifications'), {
        type: 'match_invite',
        toUserId: profileId,
        fromUserId: currentUser.uid,
        matchId: matchRef.id,
        status: 'unread',
        createdAt: serverTimestamp(),
        message: 'Someone wants to connect with you!'
      });

      toast.success('Invite sent successfully!');
      handleNext();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invite');
    }
  };

  const renderConfirmationModal = () => {
    if (!showConfirmationModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold mb-4">Confirm Date</h3>
          <p className="text-gray-600 mb-4">
            Enter the confirmation code you received from your date to verify the date happened.
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
                setSelectedDateId(null);
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

  const renderCurrentItem = () => {
    if (!currentItem) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">No {currentView} available</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Profile Image */}
        <div className="relative aspect-square">
          <img
            src={currentItem.otherUser.photo}
            alt={currentItem.otherUser.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-semibold">
                {currentItem.otherUser.name}, {currentItem.otherUser.age}
              </h2>
              <p className="text-gray-500">{currentItem.otherUser.location}</p>
            </div>
          </div>

          {/* Bio and Interests (for profiles and matches) */}
          {(currentItem.type === 'profile' || currentItem.type === 'match') && (
            <div className="mt-4 space-y-4">
              {currentItem.otherUser.bio && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900">About</h3>
                  <p className="mt-1 text-gray-600">{currentItem.otherUser.bio}</p>
                </div>
              )}

              {currentItem.otherUser.interests?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Interests</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentItem.otherUser.interests.map(interest => (
                      <span
                        key={interest}
                        className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentItem.otherUser.activities?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Activities</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentItem.otherUser.activities.map(activity => (
                      <span
                        key={activity}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date Details (for upcoming dates) */}
          {currentItem.type === 'date' && (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Date Details</h3>
                <p className="mt-1 text-gray-600">
                  {new Date(currentItem.scheduledFor).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-gray-600">{currentItem.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 sm:p-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {currentItem.type === 'profile' && (
              <button
                onClick={() => handleSendInvite(currentItem.otherUser.id)}
                className="w-full sm:flex-1 bg-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              >
                Send Invite
              </button>
            )}

            {currentItem.type === 'match' && (
              <>
                <button
                  onClick={() => handlePlanDate(currentItem.id)}
                  className="w-full sm:flex-1 bg-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                >
                  Plan Date
                </button>
                <button
                  onClick={() => navigate(`/chat/${currentItem.chatId}`)}
                  className="w-full sm:flex-1 border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Chat
                </button>
              </>
            )}

            {currentItem.type === 'date' && (
              <>
                <button
                  onClick={() => handleConfirmDate(currentItem.id)}
                  className="w-full sm:flex-1 bg-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                >
                  Confirm Date
                </button>
                <button
                  onClick={() => navigate(`/chat/${currentItem.chatId}`)}
                  className="w-full sm:flex-1 border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Chat
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your matches...</p>
        </div>
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
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (newMatches.length === 0 && upcomingDates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-xl font-medium text-gray-900">No Matches Yet</h3>
          <p className="mt-2 text-sm text-gray-500">Start exploring to find your perfect match!</p>
          <button
            onClick={() => navigate('/explore')}
            className="mt-6 w-full px-6 py-3 bg-rose-500 text-white rounded-lg shadow-sm hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            Explore Potential Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex justify-around">
            <button
              onClick={() => setCurrentView('profiles')}
              className={`px-4 py-2 font-medium ${
                currentView === 'profiles'
                  ? 'text-rose-500 border-b-2 border-rose-500'
                  : 'text-gray-500'
              }`}
            >
              All Profiles
            </button>
            <button
              onClick={() => setCurrentView('matches')}
              className={`px-4 py-2 font-medium ${
                currentView === 'matches'
                  ? 'text-rose-500 border-b-2 border-rose-500'
                  : 'text-gray-500'
              }`}
            >
              Matches
            </button>
            <button
              onClick={() => setCurrentView('upcoming')}
              className={`px-4 py-2 font-medium ${
                currentView === 'upcoming'
                  ? 'text-rose-500 border-b-2 border-rose-500'
                  : 'text-gray-500'
              }`}
            >
              Upcoming
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pt-20">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 rounded-full mb-4">
          <div 
            className="h-full bg-rose-500 rounded-full transition-all duration-300"
            style={{ 
              width: `${((currentIndex + 1) / (
                currentView === 'matches' 
                  ? newMatches.length 
                  : currentView === 'upcoming'
                  ? upcomingDates.length
                  : allProfiles.length
              )) * 100}%` 
            }}
          />
        </div>

        <AnimatePresence mode="wait">
          {currentItem && (
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
            >
              {renderCurrentItem()}

              {/* Bio and Interests (only for matches) */}
              <AnimatePresence>
                {showBio && currentItem.type === 'match' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-6 border-t border-gray-100"
                  >
                    {currentItem.otherUser.bio && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">About</h3>
                        <p className="text-gray-600">{currentItem.otherUser.bio}</p>
                      </div>
                    )}
                    
                    {currentItem.otherUser.interests?.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {currentItem.otherUser.interests.map(interest => (
                            <span
                              key={interest}
                              className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-sm"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentItem.otherUser.activities?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Activities</h3>
                        <div className="flex flex-wrap gap-2">
                          {currentItem.otherUser.activities.map(activity => (
                            <span
                              key={activity}
                              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                            >
                              {activity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Availability (only for matches) */}
              <AnimatePresence>
                {showAvailability && currentItem.type === 'match' && currentItem.overlappingSlots && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-6 border-t border-gray-100"
                  >
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Matching Availability</h3>
                    
                    {currentItem.overlappingSlots.length > 0 ? (
                      <div className="space-y-4">
                        {Object.entries(
                          currentItem.overlappingSlots.reduce((acc, { day, slot }) => {
                            if (!acc[day]) acc[day] = [];
                            acc[day].push(slot);
                            return acc;
                          }, {})
                        ).map(([day, slots]) => (
                          <div key={day} className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900">{day}</h4>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {slots.map(slot => (
                                <span
                                  key={slot}
                                  className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm"
                                >
                                  {slot}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No overlapping availability found.</p>
                        <p className="text-sm text-gray-400 mt-1">You can still plan a date by suggesting a custom time.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="p-4 sm:p-6 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  {currentItem.type === 'match' ? (
                    <>
                      <button
                        onClick={() => handlePlanDate(currentItem.id)}
                        className="w-full sm:flex-1 bg-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                      >
                        Plan Date
                      </button>
                      <button
                        onClick={() => setShowBio(!showBio)}
                        className="w-full sm:flex-1 border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        {showBio ? 'Hide Profile' : 'View Profile'}
                      </button>
                      <button
                        onClick={() => setShowAvailability(!showAvailability)}
                        className="w-full sm:flex-1 border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        {showAvailability ? 'Hide Availability' : 'View Availability'}
                      </button>
                      <button
                        onClick={handlePass}
                        className="w-full sm:flex-1 border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Pass
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleConfirmDate(currentItem.id)}
                        className="w-full sm:flex-1 bg-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                      >
                        Confirm Date Happened
                      </button>
                      <button
                        onClick={() => navigate(`/chat/${currentItem.chatId}`)}
                        className="w-full sm:flex-1 border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Chat
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            className="p-2 text-gray-500 hover:text-gray-700"
            disabled={currentIndex === 0}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="p-2 text-gray-500 hover:text-gray-700"
            disabled={
              currentIndex === (
                currentView === 'matches'
                  ? newMatches.length - 1
                  : currentView === 'upcoming'
                  ? upcomingDates.length - 1
                  : allProfiles.length - 1
              )
            }
          >
            Next
          </button>
        </div>
      </div>

      {renderConfirmationModal()}
    </div>
  );
} 