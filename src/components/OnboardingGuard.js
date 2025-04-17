import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { toast } from 'react-hot-toast';

const OnboardingGuard = ({ children }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!currentUser) {
        console.log('No current user found');
        setLoading(false);
        return;
      }

      try {
        console.log('Checking onboarding status for user:', currentUser.uid);
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.log('No user document found, creating initial document');
          // Create initial user document
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || '',
            createdAt: new Date(),
            onboardingComplete: false,
            onboardingStep: 'onboarding'
          });
          navigate('/onboarding');
          return;
        }

        const userData = userDoc.data();
        console.log('User data:', userData);
        
        // Check each step of the onboarding process
        if (!userData.basicInfo) {
          console.log('Basic info missing');
          navigate('/onboarding');
          return;
        }
        
        if (!userData.facePreferences) {
          console.log('Face preferences missing');
          navigate('/face-selection');
          return;
        }
        
        if (!userData.availability || Object.keys(userData.availability).length === 0) {
          console.log('Availability missing or empty');
          navigate('/availability');
          return;
        }

        // If all checks pass, allow access to the protected route
        console.log('All onboarding steps completed');
        setLoading(false);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        if (error.code === 'failed-precondition' || error.message.includes('offline')) {
          setIsOffline(true);
          toast.error('You are currently offline. Some features may be limited.');
        } else {
          toast.error('Error checking onboarding status');
        }
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">You're Offline</h2>
          <p className="text-gray-600">Please check your internet connection and try again.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default OnboardingGuard; 