import { initializeApp } from 'firebase/app';
import { collection, addDoc, serverTimestamp, updateDoc, doc, enableIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
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
const app = initializeApp(firebaseConfig);

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

// Initialize Firestore with settings for offline persistence
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
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
    const dateRef = await addDoc(collection(db, 'dates'), {
      users: [fromUserId, toUserId],
      ...dateDetails,
      status: 'pending',
      createdAt: serverTimestamp(),
      confirmedAt: null
    });
    
    // Update the match with the latest date plan
    const matchQuery = collection(db, 'matches');
    const matchDoc = doc(matchQuery, dateDetails.matchId);
    await updateDoc(matchDoc, {
      latestDatePlan: {
        dateId: dateRef.id,
        status: 'pending',
        updatedAt: serverTimestamp()
      }
    });

    return dateRef.id;
  } catch (error) {
    console.error('Error planning date:', error);
    throw error;
  }
};

export { app, db, auth, messaging, googleProvider, linkedInProvider }; 