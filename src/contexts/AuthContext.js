import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { googleProvider, linkedInProvider } from '../utils/firebase';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  getAuth
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();

  // Memoize sign-in functions to prevent unnecessary re-renders
  const signInWithGoogle = useCallback(async () => {
    try {
      if (!auth) {
        throw new Error('Authentication not initialized');
      }

      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful');
      
      // If this is a new user, redirect to onboarding
      if (result.additionalUserInfo?.isNewUser) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
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
      
      // If this is a new user, redirect to onboarding
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
      console.log('Sign out successful');
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, [auth, navigate]);

  useEffect(() => {
    if (!auth) {
      console.error('Authentication not initialized');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const value = {
    currentUser,
    signInWithGoogle,
    signInWithLinkedIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 