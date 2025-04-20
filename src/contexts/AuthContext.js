import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { googleProvider, linkedInProvider } from '../utils/firebase';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  getAuth
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { SAMPLE_PROFILES } from '../utils/seedData';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTestUser, setIsTestUser] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const fetchUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const switchToTestUser = async (userId) => {
    setLoading(true);
    try {
      // Find the sample user profile
      const sampleUserData = SAMPLE_PROFILES.find(profile => profile.id === userId);
      
      if (!sampleUserData) {
        throw new Error('Test user not found');
      }

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        // Create user in Firestore with sample data
        await setDoc(doc(db, 'users', userId), {
          ...sampleUserData,
          uid: userId,
          onboardingComplete: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      const userData = {
        uid: userId,
        email: `${userId}@example.com`,
        displayName: sampleUserData.basicInfo.name,
        photoURL: sampleUserData.basicInfo.photoURL,
        ...sampleUserData,
        onboardingComplete: true
      };
      
      setCurrentUser(userData);
      setIsTestUser(true);
      localStorage.setItem('testUserId', userId);
      toast.success(`Switched to ${sampleUserData.basicInfo.name}'s profile`);
      
      navigate('/account');
    } catch (error) {
      console.error('Error switching test user:', error);
      toast.error('Failed to switch user profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedTestUserId = localStorage.getItem('testUserId');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        
        if (storedTestUserId) {
          // If there's a stored test user, prioritize loading their data
          const testUserData = await fetchUserData(storedTestUserId);
          if (testUserData) {
            setCurrentUser({
              uid: storedTestUserId,
              email: `${storedTestUserId}@example.com`,
              displayName: testUserData.basicInfo?.name,
              photoURL: testUserData.basicInfo?.photoURL,
              ...testUserData
            });
            setIsTestUser(true);
            setLoading(false);
            return;
          }
        }

        if (user) {
          const userData = await fetchUserData(user.uid);
          if (userData) {
            setCurrentUser({
              ...user,
              ...userData
            });
          } else {
            setCurrentUser(user);
          }
        } else {
          setCurrentUser(null);
          setIsTestUser(false);
          localStorage.removeItem('testUserId');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setCurrentUser(null);
        setIsTestUser(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const signInWithGoogle = useCallback(async () => {
    try {
      if (!auth) {
        throw new Error('Authentication not initialized');
      }

      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful');
      
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        navigate('/onboarding');
      } else {
        const userData = userDoc.data();
        if (!userData.basicProfile) {
          navigate('/onboarding');
        } else if (!userData.photos) {
          navigate('/photos');
        } else {
          navigate('/matches');
        }
      }
      
      return result;
    } catch (error) {
      console.error('Google sign in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled by user');
      }
      throw error;
    }
  }, [auth, navigate]);

  const signInWithLinkedIn = useCallback(async () => {
    try {
      if (!auth) {
        throw new Error('Authentication not initialized');
      }

      const result = await signInWithPopup(auth, linkedInProvider);
      console.log('LinkedIn sign-in successful');
      
      if (result.additionalUserInfo?.isNewUser) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
      return result;
    } catch (error) {
      console.error('LinkedIn sign in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled by user');
      }
      throw error;
    }
  }, [auth, navigate]);

  const signOut = useCallback(async () => {
    try {
      if (!auth) {
        throw new Error('Authentication not initialized');
      }

      await firebaseSignOut(auth);
      setCurrentUser(null);
      setIsTestUser(false);
      localStorage.removeItem('testUserId');
      console.log('Sign out successful');
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, [auth, navigate]);

  const value = {
    currentUser,
    signInWithGoogle,
    signInWithLinkedIn,
    signOut,
    loading,
    switchToTestUser,
    isTestUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 