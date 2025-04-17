import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { seedDatabase } from '../utils/seedDatabase';

export default function DevTools() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser } = useAuth();

  const handleSeedDatabase = async () => {
    if (!currentUser) {
      setError('Please sign in first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Starting database seed with user:', currentUser.uid);
      await seedDatabase(currentUser.uid);
      setSuccess('Database seeded successfully! Refresh the page to see your matches.');
    } catch (error) {
      console.error('Error seeding database:', error);
      setError(
        `Failed to seed database: ${error.message}. ` +
        'Please check if you have write permissions and the database is properly configured.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col space-y-2">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md text-sm max-w-md">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-md text-sm max-w-md">
            <p className="font-medium">Success!</p>
            <p>{success}</p>
          </div>
        )}
        <button
          onClick={handleSeedDatabase}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Seeding Database...
            </>
          ) : (
            'Seed Database'
          )}
        </button>
      </div>
    </div>
  );
} 