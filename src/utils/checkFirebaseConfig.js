import { auth } from './firebase';
import { fetchSignInMethodsForEmail } from 'firebase/auth';

/**
 * Utility function to check if LinkedIn authentication is enabled in the Firebase project
 * This can be called from the browser console to diagnose authentication issues
 */
export async function checkFirebaseConfig() {
  try {
    console.log('Checking Firebase configuration...');
    
    // Check if auth is initialized
    if (!auth) {
      console.error('Firebase Auth is not initialized');
      return false;
    }
    
    console.log('Firebase Auth is initialized');
    
    // Try to get the current user
    const currentUser = auth.currentUser;
    console.log('Current user:', currentUser ? 'Logged in' : 'Not logged in');
    
    // Check if LinkedIn provider is available
    const providers = auth._providers || [];
    const hasLinkedInProvider = providers.some(provider => 
      provider.providerId === 'linkedin.com' || 
      provider.providerId === 'oauth.linkedin.com'
    );
    
    console.log('LinkedIn provider available:', hasLinkedInProvider);
    
    // Try to fetch sign-in methods for a test email
    try {
      const methods = await fetchSignInMethodsForEmail(auth, 'test@example.com');
      console.log('Available sign-in methods:', methods);
    } catch (error) {
      console.log('Error fetching sign-in methods:', error.message);
      if (error.code === 'auth/configuration-not-found') {
        console.error('LinkedIn authentication is not properly configured in Firebase Console');
        console.log('Please enable LinkedIn authentication in the Firebase Console:');
        console.log('1. Go to Firebase Console > Authentication > Sign-in method');
        console.log('2. Enable LinkedIn authentication');
        console.log('3. Add your LinkedIn OAuth 2.0 credentials');
      }
    }
    
    return hasLinkedInProvider;
  } catch (error) {
    console.error('Error checking Firebase configuration:', error);
    return false;
  }
}

// Make it available in the browser console
if (typeof window !== 'undefined') {
  window.checkFirebaseConfig = checkFirebaseConfig;
} 