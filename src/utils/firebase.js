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

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAUsT7PNxOaKBjqm8Qg9iQF-o2hfaRW41w",
  authDomain: "knock-eb7b5.firebaseapp.com",
  projectId: "knock-eb7b5",
  storageBucket: "knock-eb7b5.firebasestorage.app",
  messagingSenderId: "663565453210",
  appId: "1:663565453210:web:0e4141092a94d4abef5c23",
  measurementId: "G-1GLJ4CQDLE"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  if (!/already exists/.test(error.message)) {
    console.error('Firebase initialization error:', error.stack);
  }
  app = initializeApp(firebaseConfig, 'default');
}

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
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

// Initialize Firestore with persistence
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser doesn\'t support persistence.');
    }
  });

// Initialize Messaging
const messaging = getMessaging(app);

console.log('Firebase services initialized successfully');

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