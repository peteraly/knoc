import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, doc as firestoreDoc, getDoc, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { findMatches } from '../utils/matcher';
import { toast } from 'react-hot-toast';

export default function Explore() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchPotentialMatches = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        
        // Get current user's profile
        const userDoc = await getDoc(firestoreDoc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
          navigate('/onboarding');
          return;
        }
        const userData = userDoc.data();

        // Get all potential matches
        const usersQuery = query(
          collection(db, 'users'),
          where('basicInfo.gender', '!=', userData.basicInfo.gender) // Basic filter example
        );
        const usersSnap = await getDocs(usersQuery);
        
        const users = usersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Use matcher utility to find compatible matches
        const matches = findMatches({ id: currentUser.uid, ...userData }, users);
        setPotentialMatches(matches);
      } catch (error) {
        console.error('Error fetching matches:', error);
        toast.error('Failed to load potential matches');
      } finally {
        setLoading(false);
      }
    };

    fetchPotentialMatches();
  }, [currentUser, navigate]);

  const handleLike = async () => {
    const currentMatch = potentialMatches[currentIndex];
    try {
      await addDoc(collection(db, 'matches'), {
        users: [currentUser.uid, currentMatch.user.id],
        score: currentMatch.matchScore * 100,
        createdAt: new Date(),
        status: 'pending'
      });
      handleNext();
      toast.success('Match request sent!');
    } catch (error) {
      console.error('Error creating match:', error);
      toast.error('Failed to send match request');
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < potentialMatches.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (potentialMatches.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-xl font-medium text-gray-900">No Matches Found</h3>
          <p className="mt-2 text-sm text-gray-500">We're working on finding your perfect match!</p>
          <button
            onClick={() => navigate('/profile')}
            className="mt-6 px-6 py-3 bg-rose-500 text-white rounded-lg shadow-sm hover:bg-rose-600"
          >
            Update Preferences
          </button>
        </div>
      </div>
    );
  }

  const currentMatch = potentialMatches[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200">
        <div
          className="h-full bg-rose-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / potentialMatches.length) * 100}%` }}
        />
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMatch.user.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Profile Photo */}
            <div className="relative aspect-[4/5] bg-gray-200">
              <img
                src={currentMatch.user.photoURL || '/default-avatar.png'}
                alt={currentMatch.user.basicInfo?.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                <h2 className="text-2xl font-semibold text-white">
                  {currentMatch.user.basicInfo?.name}, {currentMatch.user.basicInfo?.age}
                </h2>
                <p className="text-white/90">{currentMatch.user.basicInfo?.location}</p>
                <div className="mt-2 flex items-center">
                  <div className="bg-white/20 px-3 py-1 rounded-full">
                    <span className="text-white text-sm">
                      {Math.round(currentMatch.matchScore * 100)}% Match
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6 border-t border-gray-100"
                >
                  {/* Activities */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Activities They Enjoy</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentMatch.user.activities?.map(activity => (
                        <span
                          key={activity}
                          className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-sm"
                        >
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Venue Preference</h3>
                      <p className="text-gray-600">{currentMatch.user.preferences?.venue === 'public' ? 'Public Places Only' : 'Any Location'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Activity Level</h3>
                      <p className="text-gray-600">{currentMatch.user.preferences?.activityLevel === 'casual' ? 'Casual & Relaxed' : 'Active & Adventurous'}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="p-4 space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  className="flex-1 border border-gray-200 px-6 py-3 rounded-lg font-medium hover:bg-gray-50"
                >
                  Skip
                </button>
                <button
                  onClick={handleLike}
                  className="flex-1 bg-rose-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-rose-600"
                >
                  Like
                </button>
              </div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full px-6 py-3 border border-gray-200 rounded-lg font-medium hover:bg-gray-50"
              >
                {showDetails ? 'Hide Details' : 'View Details'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Match Count */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {currentIndex + 1} of {potentialMatches.length} potential matches
        </div>
      </div>
    </div>
  );
} 