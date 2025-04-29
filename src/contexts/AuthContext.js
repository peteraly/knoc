import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  async function signIn(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(doc(db, 'users', result.user.uid), {
          basicInfo: {
            name: result.user.displayName || 'New User',
            email: result.user.email,
            photoURL: result.user.photoURL,
          },
          onboardingComplete: false,
          onboardingStep: 'start',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      return result;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  async function createTestUser() {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Test user creation attempted in non-development environment');
      return;
    }

    try {
      // Create or sign in test user
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, 'test@example.com', 'Test123!');
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          userCredential = await createUserWithEmailAndPassword(auth, 'test@example.com', 'Test123!');
        } else {
          throw error;
        }
      }

      // Create or update test user document
      const testUserRef = doc(db, 'users', userCredential.user.uid);
      const testUserDoc = await getDoc(testUserRef);

      if (!testUserDoc.exists()) {
        await setDoc(testUserRef, {
          basicInfo: {
            name: 'Test User',
            email: 'test@example.com',
            age: 25,
            gender: 'Other',
            location: 'San Francisco, CA',
            bio: 'Test user for development'
          },
          role: 'admin',
          activities: ['Coffee & Tea', 'Outdoor Walks', 'Museums & Galleries'],
          availability: {
            monday: ['morning', 'evening'],
            wednesday: ['afternoon', 'evening'],
            friday: ['morning', 'afternoon'],
            saturday: ['afternoon', 'evening']
          },
          preferences: {
            venue: 'public',
            activityLevel: 'casual',
            timePreference: 'daytime'
          },
          onboardingComplete: true,
          onboardingStep: 'complete',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // Update existing user to have admin role
        await setDoc(testUserRef, { role: 'admin' }, { merge: true });
      }

      return userCredential;
    } catch (error) {
      console.error('Error creating test user:', error);
      toast.error('Failed to create test user');
      throw error;
    }
  }

  function signOut() {
    return firebaseSignOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentUser({ ...user, ...userDoc.data() });
          } else {
            console.warn('User document not found for:', user.uid);
            setCurrentUser(user);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  const value = {
    currentUser,
    signIn,
    signOut,
    signInWithGoogle,
    createTestUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 