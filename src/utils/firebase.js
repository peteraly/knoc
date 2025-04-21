import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { 
  getFirestore,
  enableIndexedDbPersistence,
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Check for required environment variables
const requiredEnvVars = {
  REACT_APP_FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBkkFF0XhNZeWuDmOfEhsgdfX1VBG7WTas",
  REACT_APP_FIREBASE_AUTH_DOMAIN: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "divercity-dev.firebaseapp.com",
  REACT_APP_FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID || "divercity-dev",
  REACT_APP_FIREBASE_STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "divercity-dev.appspot.com",
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "816874969444",
  REACT_APP_FIREBASE_APP_ID: process.env.REACT_APP_FIREBASE_APP_ID || "1:816874969444:web:5fd53c4dc6f2b78c645dc9"
};

// In development, we'll use default values
if (process.env.NODE_ENV === 'development') {
  console.log('Using development Firebase configuration');
} else {
  // Check for missing environment variables in production
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
    throw new Error('Missing required Firebase configuration. Check console for details.');
  }
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBkkFF0XhNZeWuDmOfEhsgdfX1VBG7WTas",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "divercity-dev.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "divercity-dev",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "divercity-dev.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "816874969444",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:816874969444:web:5fd53c4dc6f2b78c645dc9"
};

console.log('Initializing Firebase with config:', {
  ...firebaseConfig,
  apiKey: '********************' // Hide API key in logs
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Auth
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline'
});

const linkedInProvider = new OAuthProvider('linkedin.com');
linkedInProvider.addScope('openid');
linkedInProvider.addScope('profile');
linkedInProvider.addScope('email');
linkedInProvider.setCustomParameters({
  prompt: 'select_account'
});

// Enable offline persistence with error handling
enableIndexedDbPersistence(db)
  .then(() => {
    console.log('Offline persistence enabled successfully');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    } else {
      console.error('Error enabling offline persistence:', err);
    }
  });

// Initialize Messaging with error handling
let messaging = null;
try {
  messaging = getMessaging(app);
  console.log('Firebase Cloud Messaging initialized successfully');
} catch (error) {
  console.warn('Error initializing Firebase Cloud Messaging:', error);
  console.warn('Push notifications may not be available');
}

// Function to request notification permission and get FCM token
export async function requestNotificationPermission() {
  if (!messaging) {
    console.warn('Messaging is not initialized');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BB-t_gjKwY85BklIhBnvXjtyYNtmBZPFkCs5EhGu1dH1-YtT5wFPWISjP-5La4BqSlUnmo2OIWDlTNbkK8O04-E'
      });
      return token;
    }
    throw new Error('Notification permission denied');
  } catch (error) {
    console.error('Error getting FCM token:', error);
    throw error;
  }
}

// Function to listen for incoming messages
export function setupMessageListener(callback) {
  if (!messaging) {
    console.warn('Messaging is not initialized');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    if (callback) {
      callback(payload);
    }
  });
}

export const sendNote = async (fromUserId, toUserId, noteText) => {
  try {
    const noteRef = await addDoc(collection(db, 'notes'), {
      fromUserId,
      toUserId,
      text: noteText,
      status: 'sent',
      createdAt: serverTimestamp(),
      readAt: null
    });
    return noteRef.id;
  } catch (error) {
    console.error('Error sending note:', error);
    throw error;
  }
};

export const planDate = async (fromUserId, toUserId, dateDetails) => {
  try {
    if (!dateDetails.matchId) {
      throw new Error('Invalid date request: missing match ID');
    }

    // First create the date request
    const dateRef = await addDoc(collection(db, 'dateRequests'), {
      senderId: fromUserId,
      recipientId: toUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
      dateDetails,
      updatedAt: serverTimestamp(),
      matchId: dateDetails.matchId // Ensure matchId is set at the root level
    });
    
    // Create or update the match document
    const matchesRef = collection(db, 'matches');
    const matchDoc = doc(matchesRef, dateDetails.matchId);
    
    // Check if match document exists
    const matchSnapshot = await getDoc(matchDoc);
    
    const matchData = {
      latestDatePlan: {
        dateId: dateRef.id,
        status: 'pending',
        updatedAt: serverTimestamp()
      }
    };

    if (!matchSnapshot.exists()) {
      // Create new match document
      await setDoc(matchDoc, {
        users: [fromUserId, toUserId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        ...matchData
      });
    } else {
      // Update existing match document
      await updateDoc(matchDoc, matchData);
    }

    // Create a notification for the recipient
    await addDoc(collection(db, 'notifications'), {
      type: 'date_request',
      toUserId,
      fromUserId,
      dateId: dateRef.id,
      matchId: dateDetails.matchId,
      status: 'unread',
      createdAt: serverTimestamp(),
      message: 'You have a new date request!'
    });

    return dateRef.id;
  } catch (error) {
    console.error('Error planning date:', error);
    throw error;
  }
};

// Export all the Firebase services and functions we need
export { 
  auth, 
  messaging, 
  googleProvider, 
  linkedInProvider, 
  db,
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  setDoc,
  getDoc,
  getToken,
  onMessage
}; 