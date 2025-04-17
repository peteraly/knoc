import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [dateStep, setDateStep] = useState(0);
  const { currentUser } = useAuth();

  // Enhanced date suggestions with more categories and options
  const dateSuggestions = {
    coffee: ['Local Coffee House', 'Artisan Cafe', 'Book & Brew', 'Garden Terrace Cafe', 'Vintage Tea Room'],
    outdoor: ['Botanical Gardens', 'Riverside Walk', 'City Park', 'Sunset Beach', 'Mountain Trail', 'Local Farmers Market'],
    cultural: ['Art Gallery', 'History Museum', 'Cultural Center', 'Theater Performance', 'Live Music Venue', 'Poetry Reading'],
    activity: ['Pottery Workshop', 'Cooking Class', 'Paint & Sip', 'Dance Lesson', 'Wine Tasting', 'Flower Arranging'],
    dining: ['Farm-to-Table Restaurant', 'Rooftop Lounge', 'Hidden Gem Bistro', 'Waterfront Dining', 'Cozy Italian Place'],
    adventure: ['Rock Climbing Gym', 'Kayaking', 'Bike Tour', 'Escape Room', 'Mini Golf']
  };

  // Date planning steps
  const planningSteps = [
    { title: 'Choose Category', description: 'What kind of experience would you like to share?' },
    { title: 'Select Venue', description: 'Pick a special place for your date' },
    { title: 'Pick Time', description: 'Choose a day and time that works for both' },
    { title: 'Add Personal Touch', description: 'Write a note to make it special' }
  ];

  useEffect(() => {
    async function fetchMatches() {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching matches for user:', currentUser.uid);
        const matchesQuery = query(
          collection(db, 'matches'),
          where('users', 'array-contains', currentUser.uid)
        );

        const matchSnapshot = await getDocs(matchesQuery);
        console.log('Found matches:', matchSnapshot.size);
        const matchesData = [];

        for (const matchDoc of matchSnapshot.docs) {
          const matchData = matchDoc.data();
          const otherUserId = matchData.users.find(id => id !== currentUser.uid);
          
          const userDocRef = doc(db, 'users', otherUserId);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            console.log('Found matched user:', userData.name);
            matchesData.push({
              id: matchDoc.id,
              ...matchData,
              matchedUser: {
                id: otherUserId,
                name: userData.name,
                photoURL: userData.photoURL,
                title: userData.title,
                company: userData.company,
                interests: userData.interests || [],
                comfortPreferences: userData.comfortPreferences || {
                  venue: 'public',
                  activity: 'casual',
                  time: 'daytime'
                }
              }
            });
          }
        }

        setMatches(matchesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching matches:', error);
        setError('Unable to load your matches at the moment.');
        setLoading(false);
      }
    }

    fetchMatches();
  }, [currentUser]);

  const handleDateSuggestion = (match) => {
    setSelectedMatch(match);
    setDateStep(0);
  };

  const handleSendNote = (match) => {
    setSelectedMatch(match);
    setShowNoteModal(true);
  };

  const submitNote = async () => {
    // TODO: Implement note sending logic
    setShowNoteModal(false);
    setNoteText('');
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="min-h-screen bg-rose-50 py-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400"></div>
            <motion.p 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="text-rose-600 italic"
            >
              Finding your perfect match...
            </motion.p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-rose-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-rose-100">
            <div className="flex items-center text-rose-600">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-rose-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-serif text-gray-900">Your Journey Begins</h3>
            <p className="text-rose-600 italic">
              We're carefully curating your perfect match...
            </p>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              While you wait, why not take a moment to update your comfort preferences or browse our suggested date locations?
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-rose-50 py-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-serif text-gray-900">Your Curated Matches</h1>
          <p className="mt-2 text-sm text-rose-600 italic">
            Each connection is unique, take your time to explore
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {matches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-rose-100 transform transition hover:shadow-md hover:-translate-y-1"
              >
                <div className="px-6 py-5">
                  <div className="flex items-center mb-4">
                    <img
                      className="h-16 w-16 rounded-full border-2 border-rose-100"
                      src={match.matchedUser.photoURL || 'https://via.placeholder.com/100'}
                      alt={match.matchedUser.name}
                    />
                    <div className="ml-4">
                      <h3 className="text-xl font-serif text-gray-900">
                        {match.matchedUser.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {match.matchedUser.title} at {match.matchedUser.company}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {match.matchedUser.interests?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Shared Interests</h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {match.matchedUser.interests.map((interest, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Comfort Preferences</h4>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Venue: {match.matchedUser.comfortPreferences.venue}</p>
                        <p>Activity: {match.matchedUser.comfortPreferences.activity}</p>
                        <p>Time: {match.matchedUser.comfortPreferences.time}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 space-y-3">
                  <button
                    type="button"
                    onClick={() => handleDateSuggestion(match)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-rose-200 text-sm font-medium rounded-md text-rose-700 bg-white hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                  >
                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Plan a Date
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendNote(match)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                  >
                    <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Send a Note
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Date Planning Modal */}
        <AnimatePresence>
          {selectedMatch && !showNoteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-lg max-w-md w-full p-6 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-serif text-gray-900">Plan Your Date</h3>
                  <div className="flex space-x-2">
                    {planningSteps.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-2 w-2 rounded-full ${
                          idx === dateStep ? 'bg-rose-600' : 'bg-rose-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-600">{planningSteps[dateStep].description}</p>

                <div className="space-y-4">
                  {dateStep === 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(dateSuggestions).map(([type]) => (
                        <button
                          key={type}
                          onClick={() => setDateStep(1)}
                          className="p-4 text-left rounded-lg border border-rose-200 hover:bg-rose-50"
                        >
                          <h4 className="font-medium capitalize">{type}</h4>
                        </button>
                      ))}
                    </div>
                  )}

                  {dateStep === 1 && (
                    <div className="space-y-3">
                      {dateSuggestions[Object.keys(dateSuggestions)[0]].map((place, idx) => (
                        <button
                          key={idx}
                          onClick={() => setDateStep(2)}
                          className="w-full p-4 text-left rounded-lg border border-rose-200 hover:bg-rose-50"
                        >
                          {place}
                        </button>
                      ))}
                    </div>
                  )}

                  {dateStep === 2 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-7 gap-2">
                        {[...Array(7)].map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setDateStep(3)}
                            className="p-4 rounded-lg border border-rose-200 hover:bg-rose-50"
                          >
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'][idx]}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['Morning', 'Afternoon', 'Evening'].map((time) => (
                          <button
                            key={time}
                            onClick={() => setDateStep(3)}
                            className="p-4 rounded-lg border border-rose-200 hover:bg-rose-50"
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {dateStep === 3 && (
                    <div className="space-y-4">
                      <textarea
                        className="w-full h-32 p-4 border border-rose-200 rounded-lg focus:ring-rose-500 focus:border-rose-500"
                        placeholder="Add a personal note..."
                      />
                      <button
                        onClick={() => {
                          setSelectedMatch(null);
                          setDateStep(0);
                        }}
                        className="w-full py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                      >
                        Send Date Invitation
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => dateStep > 0 && setDateStep(dateStep - 1)}
                    className={`text-sm text-rose-600 ${
                      dateStep === 0 ? 'invisible' : ''
                    }`}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="text-sm text-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Handwritten Note Modal */}
        <AnimatePresence>
          {showNoteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-lg max-w-md w-full p-6 space-y-4"
              >
                <h3 className="text-xl font-serif text-gray-900">Write a Note</h3>
                <div className="relative">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full h-48 p-4 bg-rose-50 border-b border-rose-200 font-handwriting text-lg focus:outline-none focus:border-rose-500"
                    placeholder="Dear..."
                    style={{
                      backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #f43f5e 31px, #f43f5e 32px)',
                      lineHeight: '32px',
                      padding: '8px 10px'
                    }}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowNoteModal(false);
                      setNoteText('');
                    }}
                    className="px-4 py-2 text-sm text-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitNote}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                  >
                    Send Note
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 