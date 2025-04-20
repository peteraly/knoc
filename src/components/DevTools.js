import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { seedDatabase, clearTestData } from '../utils/seedDatabase';
import { SAMPLE_PROFILES, populateUserData, populateMatches } from '../utils/seedData';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export default function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userStats, setUserStats] = useState({});
  const navigate = useNavigate();
  const { currentUser, switchToTestUser } = useAuth();

  useEffect(() => {
    // Get current user ID from localStorage or auth context
    const storedUserId = localStorage.getItem('testUserId');
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    } else if (currentUser?.uid) {
      setCurrentUserId(currentUser.uid);
    }
  }, [currentUser]);

  useEffect(() => {
    // Fetch user stats when currentUserId changes
    if (currentUserId) {
      fetchUserStats(currentUserId);
    }
  }, [currentUserId]);

  const fetchUserStats = async (userId) => {
    try {
      // Fetch matches count
      const matchesQuery = query(
        collection(db, 'matches'),
        where('participants', 'array-contains', userId)
      );
      const matchesSnap = await getDocs(matchesQuery);
      
      // Fetch date requests count
      const dateRequestsQuery = query(
        collection(db, 'dateRequests'),
        where('participants', 'array-contains', userId)
      );
      const dateRequestsSnap = await getDocs(dateRequestsQuery);
      
      // Fetch chats count
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId)
      );
      const chatsSnap = await getDocs(chatsQuery);
      
      setUserStats({
        matches: matchesSnap.size,
        dateRequests: dateRequestsSnap.size,
        chats: chatsSnap.size
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleSeedData = async () => {
    setIsLoading(true);
    try {
      await seedDatabase();
      toast.success('Database seeded successfully!');
      navigate('/matches');
    } catch (error) {
      console.error('Error seeding database:', error);
      toast.error('Error seeding database. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = async () => {
    setIsLoading(true);
    try {
      await clearTestData();
      toast.success('Test data cleared successfully!');
      navigate('/matches');
    } catch (error) {
      console.error('Error clearing test data:', error);
      toast.error('Error clearing test data. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSetup = async () => {
    if (!currentUserId) {
      toast.error('No user selected');
      return;
    }
    
    setIsLoading(true);
    try {
      // Populate user data
      await populateUserData(currentUserId);
      
      // Populate matches for this user
      await populateMatches(currentUserId);
      
      toast.success('Quick setup completed!');
      fetchUserStats(currentUserId);
      navigate('/matches');
    } catch (error) {
      console.error('Error in quick setup:', error);
      toast.error('Error setting up test data. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSetupAll = async () => {
    setIsLoading(true);
    try {
      // Populate data for all sample users
      for (const profile of SAMPLE_PROFILES) {
        await populateUserData(profile.id);
        await populateMatches(profile.id);
      }
      
      toast.success('All profiles populated successfully!');
      
      // If we have a current user, refresh their stats
      if (currentUserId) {
        fetchUserStats(currentUserId);
      }
      
      navigate('/matches');
    } catch (error) {
      console.error('Error in quick setup all:', error);
      toast.error('Error setting up all profiles. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchUser = async (userId) => {
    setIsLoading(true);
    try {
      await switchToTestUser(userId);
      setCurrentUserId(userId);
      
      // Automatically seed data for this user
      await populateUserData(userId);
      await populateMatches(userId);
      
      toast.success(`Switched to ${SAMPLE_PROFILES.find(p => p.id === userId)?.basicInfo?.name || 'user'} with test data`);
      navigate('/matches');
    } catch (error) {
      console.error('Error switching user:', error);
      toast.error('Failed to switch user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDateRequest = async () => {
    if (!currentUserId) {
      toast.error('No user selected');
      return;
    }
    
    setIsLoading(true);
    try {
      // Get current user's matches
      const matchesQuery = query(
        collection(db, 'matches'),
        where('participants', 'array-contains', currentUserId)
      );
      const matchesSnap = await getDocs(matchesQuery);
      
      if (matchesSnap.empty) {
        toast.error('No matches found. Please create matches first.');
        return;
      }
      
      // Select a random match
      const randomMatch = matchesSnap.docs[Math.floor(Math.random() * matchesSnap.docs.length)];
      const matchData = randomMatch.data();
      const otherUserId = matchData.participants.find(id => id !== currentUserId);
      
      // Create a date request
      const dateRequestsRef = collection(db, 'dateRequests');
      const dateRequestData = {
        matchId: randomMatch.id,
        senderId: currentUserId,
        recipientId: otherUserId,
        participants: [currentUserId, otherUserId],
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(dateRequestsRef, dateRequestData);
      
      toast.success('Date request created successfully!');
      fetchUserStats(currentUserId);
      navigate('/matches');
    } catch (error) {
      console.error('Error creating date request:', error);
      toast.error('Error creating date request. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetUser = () => {
    localStorage.removeItem('testUserId');
    window.location.reload();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 z-50"
        aria-label="Open DevTools"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-xl border border-gray-200 w-80 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">DevTools</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-500"
          aria-label="Close DevTools"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {currentUserId && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm font-medium text-gray-700">Current User</p>
          <p className="text-sm text-gray-600 truncate">{currentUserId}</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-500">
            <div>
              <p className="font-medium">{userStats.matches || 0}</p>
              <p>Matches</p>
            </div>
            <div>
              <p className="font-medium">{userStats.dateRequests || 0}</p>
              <p>Dates</p>
            </div>
            <div>
              <p className="font-medium">{userStats.chats || 0}</p>
              <p>Chats</p>
            </div>
          </div>
          <div className="mt-2 flex space-x-2">
            <button
              onClick={handleQuickSetup}
              disabled={isLoading}
              className="flex-1 px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Quick Setup
            </button>
            <button
              onClick={handleResetUser}
              className="flex-1 px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Reset User
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Test Users</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {SAMPLE_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleSwitchUser(profile.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                  currentUserId === profile.id
                    ? 'bg-rose-100 text-rose-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {profile.basicInfo.name} ({profile.id})
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Database Actions</h4>
          <button
            onClick={handleQuickSetupAll}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Quick Setup All Users'}
          </button>
          <button
            onClick={handleCreateDateRequest}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Create Date Request'}
          </button>
          <button
            onClick={handleSeedData}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Seed All Data'}
          </button>
          <button
            onClick={handleClearData}
            disabled={isLoading}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Clear Test Data'}
          </button>
        </div>
      </div>
    </div>
  );
}