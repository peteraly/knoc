import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import toast from 'react-hot-toast';

// Sample test users matching the profiles in Matches.js
const TEST_USERS = [
  {
    id: 'profile1',
    name: 'Sarah Johnson',
    email: 'sarah@test.com',
    password: 'testpass123'
  },
  {
    id: 'profile2',
    name: 'Michael Chen',
    email: 'michael@test.com',
    password: 'testpass123'
  },
  {
    id: 'profile3',
    name: 'Emma Davis',
    email: 'emma@test.com',
    password: 'testpass123'
  },
  {
    id: 'profile4',
    name: 'James Wilson',
    email: 'james@test.com',
    password: 'testpass123'
  },
  {
    id: 'profile5',
    name: 'Alex Kim',
    email: 'alex@test.com',
    password: 'testpass123'
  },
  {
    id: 'profile6',
    name: 'Jordan Taylor',
    email: 'jordan@test.com',
    password: 'testpass123'
  }
];

export default function UserSwitcher() {
  const { currentUser } = useAuth();

  const switchToUser = async (userId) => {
    try {
      // Check if user document exists
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          email: TEST_USERS.find(u => u.id === userId)?.email,
          basicInfo: {
            name: TEST_USERS.find(u => u.id === userId)?.name
          },
          createdAt: new Date()
        });
      }

      // Reload the page to simulate user switch
      window.location.reload();
      
    } catch (error) {
      console.error('Error switching user:', error);
      toast.error('Failed to switch user');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50">
      <div className="text-sm font-medium text-gray-700 mb-2">Test User Switcher</div>
      <div className="space-y-2">
        {TEST_USERS.map(user => (
          <button
            key={user.id}
            onClick={() => switchToUser(user.id)}
            className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
              currentUser?.uid === user.id
                ? 'bg-rose-500 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            {user.name}
          </button>
        ))}
      </div>
    </div>
  );
} 