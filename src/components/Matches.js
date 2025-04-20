import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Sample data for development
const SAMPLE_PROFILES = [
  {
    id: '1',
    basicInfo: {
      name: 'Sarah Chen',
      age: 28,
      gender: 'woman',
      location: 'San Francisco, CA'
    },
    bio: 'Software engineer by day, amateur chef by night. Love exploring new restaurants and hiking on weekends.',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    activities: ['coffee', 'hiking', 'dining']
  },
  {
    id: '2',
    basicInfo: {
      name: 'Michael Park',
      age: 31,
      gender: 'man',
      location: 'San Francisco, CA'
    },
    bio: 'Product designer who loves photography and rock climbing. Always up for trying new coffee shops.',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    activities: ['coffee', 'museums', 'fitness']
  },
  {
    id: '3',
    basicInfo: {
      name: 'Emma Rodriguez',
      age: 26,
      gender: 'woman',
      location: 'Oakland, CA'
    },
    bio: 'Art curator and yoga enthusiast. Looking for someone to explore galleries and try new restaurants with.',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    activities: ['museums', 'dining', 'fitness']
  }
];

export default function Matches() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentState, setCurrentState] = useState(null); // 'discovery', 'pending', 'confirmed'
  const [currentMatch, setCurrentMatch] = useState(null);
  const [currentDate, setCurrentDate] = useState(null);
  const [findingMatch, setFindingMatch] = useState(false);
  const [profileIndex, setProfileIndex] = useState(0);

  const findNextMatch = () => {
    // For development, cycle through sample profiles
    const nextIndex = (profileIndex + 1) % SAMPLE_PROFILES.length;
    const profile = SAMPLE_PROFILES[nextIndex];
    
    setProfileIndex(nextIndex);
    setCurrentMatch({
      id: profile.id,
      otherUser: {
        id: profile.id,
        name: profile.basicInfo.name,
        photo: profile.photoURL,
        age: profile.basicInfo.age,
        location: profile.basicInfo.location,
        bio: profile.bio
      }
    });
  };

  useEffect(() => {
    const checkUserState = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        
        // For development, start with discovery state and first sample profile
        setCurrentState('discovery');
        const firstProfile = SAMPLE_PROFILES[0];
        setCurrentMatch({
          id: firstProfile.id,
          otherUser: {
            id: firstProfile.id,
            name: firstProfile.basicInfo.name,
            photo: firstProfile.photoURL,
            age: firstProfile.basicInfo.age,
            location: firstProfile.basicInfo.location,
            bio: firstProfile.bio
          }
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking user state:', error);
        toast.error('Failed to load your current status');
        setLoading(false);
      }
    };

    checkUserState();
  }, [currentUser]);

  const renderDiscoveryState = () => {
    if (!currentMatch) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Finding Your Next Match</h2>
          <p className="text-gray-600 mb-8">We're looking for someone who shares your interests and availability.</p>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500 mx-auto"></div>
          <button
            onClick={findNextMatch}
            disabled={findingMatch}
            className="mt-8 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
          >
            {findingMatch ? 'Finding...' : 'Find Someone New'}
          </button>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <div className="flex items-start space-x-4">
          <img
            src={currentMatch.otherUser.photo}
            alt={currentMatch.otherUser.name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div>
            <h2 className="text-2xl font-semibold">{currentMatch.otherUser.name}</h2>
            <p className="text-gray-600">
              {currentMatch.otherUser.age} • {currentMatch.otherUser.location}
            </p>
            {currentMatch.otherUser.bio && (
              <p className="mt-2 text-gray-700">{currentMatch.otherUser.bio}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => navigate(`/date-planning/new?matchId=${currentMatch.id}`)}
            className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            Plan a Date
          </button>
          <button
            onClick={() => navigate(`/chat/${currentMatch.chatId}`)}
            className="px-6 py-3 border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
          >
            Chat
          </button>
          <button
            onClick={findNextMatch}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Skip
          </button>
        </div>
      </motion.div>
    );
  };

  const renderPendingState = () => {
    if (!currentDate) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Date Request Pending</h2>
        <div className="flex items-center space-x-4 mb-6">
          <img
            src={currentDate.otherUser.photo}
            alt={currentDate.otherUser.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="text-lg font-medium">{currentDate.otherUser.name}</h3>
            <p className="text-gray-600">Waiting for response</p>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={() => navigate(`/chat/${currentDate.chatId}`)}
            className="w-full px-6 py-3 border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
          >
            Chat While You Wait
          </button>
        </div>
      </motion.div>
    );
  };

  const renderConfirmedState = () => {
    if (!currentDate) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Your Upcoming Date</h2>
        <div className="flex items-center space-x-4 mb-6">
          <img
            src={currentDate.otherUser.photo}
            alt={currentDate.otherUser.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="text-lg font-medium">{currentDate.otherUser.name}</h3>
            <p className="text-gray-600">
              {new Date(currentDate.dateDetails.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })} at {currentDate.dateDetails.time}
            </p>
            <p className="text-gray-600">{currentDate.dateDetails.venue}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <button
            onClick={() => navigate('/dates')}
            className="w-full px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            Enter Confirmation Code
          </button>
          <button
            onClick={() => navigate(`/chat/${currentDate.chatId}`)}
            className="w-full px-6 py-3 border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
          >
            Chat
          </button>
        </div>
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
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center">
          {currentState === 'discovery' && 'Find Your Match'}
          {currentState === 'pending' && 'Date Request Pending'}
          {currentState === 'confirmed' && 'Your Upcoming Date'}
        </h1>
      </div>

      {currentState === 'discovery' && renderDiscoveryState()}
      {currentState === 'pending' && renderPendingState()}
      {currentState === 'confirmed' && renderConfirmedState()}
    </div>
  );
} 