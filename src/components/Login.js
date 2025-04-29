import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import UserSwitcher from './UserSwitcher';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, createTestUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Create test user in development mode
  useEffect(() => {
    const initializeTestUser = async () => {
      if (process.env.NODE_ENV === 'development') {
        try {
          setLoading(true);
          await createTestUser();
          
          // Check if test user document exists in Firestore
          const testUserDoc = await getDoc(doc(db, 'users', 'test_user'));
          
          if (!testUserDoc.exists()) {
            // Create test user document with required fields
            await setDoc(doc(db, 'users', 'test_user'), {
              basicInfo: {
                name: 'Test User',
                age: 25,
                gender: 'Other',
                location: 'San Francisco, CA',
                bio: 'Test user for development'
              },
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
          }
          
          navigate('/');
        } catch (error) {
          console.error('Error setting up test user:', error);
          toast.error('Failed to set up test environment');
        } finally {
          setLoading(false);
        }
      }
    };

    initializeTestUser();
  }, [createTestUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/matches');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/matches');
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleTestUserSignIn = async () => {
    setLoading(true);
    try {
      await createTestUser();
      navigate('/matches');
      toast.success('Signed in as test admin user');
    } catch (error) {
      console.error('Test user sign in error:', error);
      toast.error('Failed to sign in as test user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
          </div>
        ) : (
          <>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  <img
                    className="h-5 w-5 mr-2"
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google logo"
                  />
                  {loading ? 'Signing in...' : 'Sign in with Google'}
                </button>

                {isDevelopment && (
                  <button
                    onClick={handleTestUserSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                  >
                    👨‍💻 Sign in as Test Admin
                  </button>
                )}
              </div>
            </div>
            
            <UserSwitcher />
          </>
        )}
      </div>
    </div>
  );
} 