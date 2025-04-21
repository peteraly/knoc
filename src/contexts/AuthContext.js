import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../utils/firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import toast from 'react-hot-toast';

const AuthContext = createContext({
  currentUser: null,
  loading: true,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  createTestUser: async () => {}
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('Email/Password sign-in is not enabled. Please use Google sign-in instead.');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('Failed to sign in with Google. Please try again.');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
      throw error;
    }
  };

  const createTestUser = async () => {
    if (process.env.NODE_ENV === 'development') {
      try {
        const email = 'test@example.com';
        const password = 'Test123!';
        
        // Try to sign in with Google instead of email/password
        try {
          await signInWithGoogle();
          console.log('Signed in with Google successfully');
          return;
        } catch (googleError) {
          console.error('Google sign in failed:', googleError);
          
          // If Google sign-in fails, try email/password as fallback
          try {
            await signIn(email, password);
            console.log('Test user exists, signed in successfully');
          } catch (error) {
            // If user doesn't exist, create it
            if (error.code === 'auth/user-not-found') {
              await createUserWithEmailAndPassword(auth, email, password);
              console.log('Test user created successfully');
            } else if (error.code === 'auth/operation-not-allowed') {
              toast.error('Please enable Email/Password authentication in Firebase Console');
              throw error;
            } else {
              throw error;
            }
          }
        }
      } catch (error) {
        console.error('Error with test user:', error);
        throw error;
      }
    } else {
      throw new Error('Test user creation is only available in development');
    }
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signInWithGoogle,
    signOut,
    createTestUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 