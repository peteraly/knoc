import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import SeedDatabaseButton from './SeedDatabaseButton';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    if (!currentUser) {
      navigate('/signin', { state: { from: '/matches' } });
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError('');

        // Get current user's data for filtering
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
          setError('Please complete your profile first');
          navigate('/onboarding');
          return;
        }

        const userData = userDoc.data();
        
        // Check if user has completed onboarding
        if (!userData.onboardingComplete) {
          setError('Please complete your profile first');
          navigate('/onboarding');
          return;
        }

        // First, fetch all date requests involving the current user
        const sentRequestsQuery = query(
          collection(db, 'dateRequests'),
          where('senderId', '==', currentUser.uid)
        );
        const receivedRequestsQuery = query(
          collection(db, 'dateRequests'),
          where('recipientId', '==', currentUser.uid)
        );

        const [sentSnap, receivedSnap] = await Promise.all([
          getDocs(sentRequestsQuery),
          getDocs(receivedRequestsQuery)
        ]);

        // Create a Set of user IDs that should be excluded
        const excludeUserIds = new Set();
        sentSnap.docs.forEach(doc => excludeUserIds.add(doc.data().recipientId));
        receivedSnap.docs.forEach(doc => excludeUserIds.add(doc.data().senderId));

        // Get user's gender and preferences
        const userGender = userData.basicInfo?.gender;
        const interestedIn = userData.preferences?.interestedIn || ['woman', 'man', 'non-binary', 'other'];
        
        // Fetch all users
        const usersQuery = query(collection(db, 'users'));
        const usersSnap = await getDocs(usersQuery);
        
        const filteredMatches = [];

        for (const doc of usersSnap.docs) {
          const matchData = doc.data();
          const matchId = doc.id;

          // Skip if user is in exclude list or is the current user
          if (excludeUserIds.has(matchId) || matchId === currentUser.uid) {
            continue;
          }

          // Skip if user hasn't completed onboarding
          if (!matchData.onboardingComplete) {
            continue;
          }

          const matchGender = matchData.basicInfo?.gender;
          const matchPreferences = matchData.preferences?.interestedIn || ['woman', 'man', 'non-binary', 'other'];

          // Skip if gender preferences don't match
          if (!interestedIn.includes(matchGender) || !matchPreferences.includes(userGender)) {
            continue;
          }

          // Check if match has basic required fields
          if (!matchData.basicInfo?.name || !matchData.basicInfo?.age || !matchData.basicInfo?.location) {
            continue;
          }

          filteredMatches.push({
            id: matchId,
            name: matchData.basicInfo.name,
            age: matchData.basicInfo.age,
            location: matchData.basicInfo.location,
            bio: matchData.basicInfo?.bio,
            photoURL: matchData.basicInfo?.photoURL,
            activities: matchData.activities || [],
            spotifyLink: matchData.spotifyLink
          });
        }

        setMatches(filteredMatches);
        setError('');
      } catch (error) {
        console.error('Error fetching matches:', error);
        setError('Failed to load matches. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [currentUser, navigate]);

  const handleSendNote = (matchId) => {
    if (!currentUser) {
      toast.error('Please log in to send notes');
      navigate('/login', { state: { from: `/send-note/${matchId}` } });
      return;
    }

    // Navigate to the note sending page
    navigate(`/send-note/${matchId}`, { 
      state: { 
        matchId,
        returnPath: '/matches'
      }
    });
  };

  const handlePlanDate = async (matchId) => {
    if (!currentUser) {
      navigate('/signin', { state: { from: '/matches' } });
      return;
    }

    try {
      // Get current user's data
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists()) {
        navigate('/onboarding');
        return;
      }

      const userData = userDoc.data();
      
      // Check if basic profile info is complete
      if (!userData?.basicInfo?.name || !userData?.basicInfo?.photoURL) {
        navigate('/profile');
        return;
      }

      // Get current user's availability status
      const hasAvailability = userData?.availability && Object.keys(userData.availability).length > 0;

      // Find the match
      const match = matches.find(m => m.id === matchId);
      if (!match) {
        toast.error("Match not found");
        return;
      }

      // If user hasn't set availability, redirect to availability page
      if (!hasAvailability) {
        navigate('/schedule');
        return;
      }

      // Check if recipient exists
      const recipientDoc = await getDoc(doc(db, 'users', matchId));
      if (!recipientDoc.exists()) {
        toast.error("Recipient not found");
        return;
      }

      // Create a date request
      const dateRequest = {
        senderId: currentUser.uid,
        recipientId: matchId,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        type: 'date_request',
        senderName: userData.basicInfo.name,
        senderPhoto: userData.basicInfo.photoURL,
        matchData: {
          name: match.name,
          photo: match.photoURL,
          location: match.location
        }
      };

      const dateRequestRef = await addDoc(collection(db, 'dateRequests'), dateRequest);
      
      // Update the recipient's user document with the latest date request
      await updateDoc(doc(db, 'users', matchId), {
        latestDateRequest: {
          requestId: dateRequestRef.id,
          status: 'pending',
          updatedAt: serverTimestamp()
        }
      });

      // Remove the match from the local state
      setMatches(prevMatches => prevMatches.filter(m => m.id !== matchId));

      toast.success("Date request sent! We'll notify you when they respond.");

    } catch (error) {
      console.error('Error in handlePlanDate:', error);
      toast.error('Failed to send date request. Please try again.');
    }
  };

  if (!currentUser) {
    return null; // Don't render anything if not authenticated
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error ? (
        <div className="text-center py-12">
          <p className="text-rose-600">{error}</p>
          {error.includes('profile') && (
            <button
              onClick={() => navigate('/onboarding')}
              className="mt-4 px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors duration-200"
            >
              Complete Profile
            </button>
          )}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Matches Found</h2>
          <p className="text-gray-600">Check back later for new potential matches!</p>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-8 text-gray-800">Your Matches</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <div className="relative h-48">
                  <img
                    src={match.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.name)}`}
                    alt={match.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(match.name)}`;
                    }}
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-gray-800">{match.name}</h2>
                  <p className="text-gray-600">{match.age} • {match.location}</p>
                  
                  {match.activities && match.activities.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500 mb-2">Interests:</p>
                      <div className="flex flex-wrap gap-2">
                        {match.activities.map((activity, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-rose-100 text-rose-700 rounded-full"
                          >
                            {activity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {match.spotifyLink && (
                    <a
                      href={match.spotifyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center text-green-600 hover:text-green-700"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      Listen on Spotify
                    </a>
                  )}

                  <div className="mt-4 flex gap-4">
                    <button
                      onClick={() => handlePlanDate(match.id)}
                      className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                    >
                      Plan Date
                    </button>
                    <button
                      onClick={() => handleSendNote(match.id)}
                      className="flex-1 px-4 py-2 border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      Send Note
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <SeedDatabaseButton />
    </div>
  );
} 