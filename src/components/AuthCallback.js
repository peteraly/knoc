import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/firebase';
import { getRedirectResult } from 'firebase/auth';

export default function AuthCallback() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setLoading(true);
        console.log('Handling auth callback...');
        
        // Get the redirect result
        const result = await getRedirectResult(auth);
        console.log('Redirect result:', result);
        
        if (result && result.user) {
          // Successfully signed in
          console.log('Successfully signed in:', result.user.email);
          navigate('/');
        } else {
          console.error('No auth result found');
          setError('Authentication failed. Please try signing in again.');
        }
      } catch (error) {
        console.error('Error during authentication callback:', error);
        setError('Authentication failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {error ? 'Authentication Error' : 'Completing Sign In...'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error || 'Please wait while we complete your sign in.'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Back to Sign In
            </button>
          </div>
        )}
        
        {!error && loading && (
          <div className="flex justify-center">
            <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
} 