import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { initiateSpotifyLogin } from '../utils/spotify';
import toast from 'react-hot-toast';
import { auth } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const GENDER_OPTIONS = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' }
];

export default function Profile({ activeTab = 'profile' }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    location: '',
    bio: '',
    gender: '',
    interestedIn: [],
    spotifyProfile: null
  });
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    location: '',
    bio: '',
    activities: [],
    spotifyLink: '',
    preferences: {
      ageRange: {
        min: 18,
        max: 35
      },
      maxDistance: 25,
      interests: []
    }
  });

  const [dateRequests, setDateRequests] = useState({ sent: [], received: [] });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const spotifyStatus = params.get('spotify');
    
    if (spotifyStatus === 'success') {
      toast.success('Successfully connected to Spotify!');
    } else if (spotifyStatus === 'error') {
      toast.error('Failed to connect to Spotify');
    }
  }, [location]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchProfile(user.uid);
      } else {
        setLoading(false);
        navigate('/signin');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfile({
          name: userData.basicInfo?.name || '',
          age: userData.basicInfo?.age || '',
          location: userData.basicInfo?.location || '',
          bio: userData.basicInfo?.bio || '',
          gender: userData.basicInfo?.gender || '',
          interestedIn: userData.preferences?.interestedIn || [],
          spotifyProfile: userData.spotifyProfile || null
        });
        setFormData({
          name: userData.basicInfo?.name || '',
          age: userData.basicInfo?.age || '',
          location: userData.basicInfo?.location || '',
          bio: userData.basicInfo?.bio || '',
          activities: userData.activities || [],
          spotifyLink: userData.spotifyLink || '',
          preferences: {
            ageRange: userData.preferences?.ageRange || { min: 18, max: 35 },
            maxDistance: userData.preferences?.maxDistance || 25,
            interests: userData.preferences?.interests || []
          }
        });
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!profile.name || !profile.age || !profile.gender || profile.interestedIn.length === 0) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate age is a number between 18 and 100
      const age = parseInt(profile.age);
      if (isNaN(age) || age < 18 || age > 100) {
        toast.error('Please enter a valid age between 18 and 100');
        return;
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        basicInfo: {
          name: profile.name,
          age: profile.age,
          location: profile.location,
          bio: profile.bio,
          gender: profile.gender
        },
        preferences: {
          interestedIn: profile.interestedIn
        }
      });

      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('preferences.')) {
      const prefField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAgeRangeChange = (e) => {
    const { name, value } = e.target;
    const field = name.split('.')[2]; // preferences.ageRange.min or max
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ageRange: {
          ...prev.preferences.ageRange,
          [field]: parseInt(value) || 18
        }
      }
    }));
  };

  const handleGenderChange = (gender) => {
    setProfile(prev => ({ ...prev, gender }));
  };

  const handleInterestToggle = (gender) => {
    setProfile(prev => ({
      ...prev,
      interestedIn: prev.interestedIn.includes(gender)
        ? prev.interestedIn.filter(g => g !== gender)
        : [...prev.interestedIn, gender]
    }));
  };

  const handleConnectSpotify = () => {
    initiateSpotifyLogin();
  };

  useEffect(() => {
    const fetchDateRequests = async () => {
      if (!currentUser) return;

      try {
        // Fetch sent requests
        const sentQuery = query(
          collection(db, 'dateRequests'),
          where('senderId', '==', currentUser.uid)
        );
        
        // Fetch received requests
        const receivedQuery = query(
          collection(db, 'dateRequests'),
          where('recipientId', '==', currentUser.uid)
        );

        const [sentSnap, receivedSnap] = await Promise.all([
          getDocs(sentQuery),
          getDocs(receivedQuery)
        ]);

        const sent = [];
        const received = [];

        // Process sent requests
        for (const docSnap of sentSnap.docs) {
          const request = docSnap.data();
          const recipientDoc = await getDoc(doc(db, 'users', request.recipientId));
          const recipientData = recipientDoc.data();
          sent.push({
            id: docSnap.id,
            ...request,
            recipient: {
              name: recipientData?.basicInfo?.name || 'Anonymous',
              photoURL: recipientData?.basicInfo?.photoURL
            }
          });
        }

        // Process received requests
        for (const docSnap of receivedSnap.docs) {
          const request = docSnap.data();
          const senderDoc = await getDoc(doc(db, 'users', request.senderId));
          const senderData = senderDoc.data();
          received.push({
            id: docSnap.id,
            ...request,
            sender: {
              name: senderData?.basicInfo?.name || 'Anonymous',
              photoURL: senderData?.basicInfo?.photoURL
            }
          });
        }

        setDateRequests({ sent, received });
      } catch (error) {
        console.error('Error fetching date requests:', error);
        toast.error('Failed to load date requests');
      } finally {
        setLoading(false);
      }
    };

    fetchDateRequests();
  }, [currentUser]);

  const handleDateResponse = async (requestId, status) => {
    try {
      await updateDoc(doc(db, 'dateRequests', requestId), {
        status,
        respondedAt: new Date()
      });

      // Update local state
      setDateRequests(prev => ({
        ...prev,
        received: prev.received.map(req => 
          req.id === requestId ? { ...req, status } : req
        )
      }));

      if (status === 'accepted') {
        // Create a chat thread for the date planning
        const request = dateRequests.received.find(req => req.id === requestId);
        const chatRef = await addDoc(collection(db, 'chats'), {
          participants: [currentUser.uid, request.senderId],
          type: 'date_planning',
          dateRequestId: requestId,
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp()
        });

        // Create a date planning invitation
        await addDoc(collection(db, 'dateInvitations'), {
          chatId: chatRef.id,
          dateRequestId: requestId,
          senderId: request.senderId,
          recipientId: currentUser.uid,
          status: 'pending',
          createdAt: serverTimestamp(),
          proposedDate: null,
          proposedTime: null,
          venue: null,
          note: null
        });

        toast.success('Date request accepted! Let\'s plan the details.');
        navigate(`/date-planning/${requestId}`);
      } else {
        toast.success('Date request declined');
      }
    } catch (error) {
      console.error('Error updating date request:', error);
      toast.error('Failed to update date request');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentTab === 'profile' ? 'Your Profile' : 'Your Preferences'}
            </h2>
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700"
            >
              {editing ? 'Save' : 'Edit'}
            </button>
          </div>

          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex">
              <button
                onClick={() => setCurrentTab('profile')}
                className={`${
                  currentTab === 'profile'
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Profile
              </button>
              <button
                onClick={() => setCurrentTab('preferences')}
                className={`${
                  currentTab === 'preferences'
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ml-8`}
              >
                Preferences
              </button>
            </nav>
          </div>

          <form onSubmit={handleSave}>
            {currentTab === 'profile' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editing}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={profile.age}
                    onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                    disabled={!editing}
                    min="18"
                    max="100"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={profile.location}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    disabled={!editing}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!editing}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <div className="mt-1 grid grid-cols-2 gap-4">
                    {GENDER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => editing && handleGenderChange(option.value)}
                        disabled={!editing}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          profile.gender === option.value
                            ? 'bg-rose-100 text-rose-700 border-2 border-rose-500'
                            : 'bg-gray-50 text-gray-700 border border-gray-300'
                        } ${editing ? 'hover:bg-rose-50' : 'cursor-default'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Interested in</label>
                  <div className="mt-1 grid grid-cols-2 gap-4">
                    {GENDER_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => editing && handleInterestToggle(option.value)}
                        disabled={!editing}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          profile.interestedIn.includes(option.value)
                            ? 'bg-rose-100 text-rose-700 border-2 border-rose-500'
                            : 'bg-gray-50 text-gray-700 border border-gray-300'
                        } ${editing ? 'hover:bg-rose-50' : 'cursor-default'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Spotify Profile</label>
                  <div className="mt-1 space-y-2">
                    {profile.spotifyProfile ? (
                      <div className="flex items-center space-x-2">
                        <img 
                          src={profile.spotifyProfile.images?.[0]?.url} 
                          alt="Spotify profile" 
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {profile.spotifyProfile.displayName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {profile.spotifyProfile.followers} followers
                          </p>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConnectSpotify}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        Connect Spotify
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age Range</label>
                  <div className="mt-1 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500">Minimum</label>
                      <input
                        type="number"
                        name="preferences.ageRange.min"
                        value={formData.preferences?.ageRange?.min || 18}
                        onChange={handleAgeRangeChange}
                        disabled={!editing}
                        min="18"
                        max={formData.preferences?.ageRange?.max || 35}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Maximum</label>
                      <input
                        type="number"
                        name="preferences.ageRange.max"
                        value={formData.preferences?.ageRange?.max || 35}
                        onChange={handleAgeRangeChange}
                        disabled={!editing}
                        min={formData.preferences?.ageRange?.min || 18}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maximum Distance (miles)
                  </label>
                  <input
                    type="number"
                    name="preferences.maxDistance"
                    value={formData.preferences?.maxDistance || 25}
                    onChange={handleChange}
                    disabled={!editing}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            )}

            {editing && (
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {currentTab === 'profile' ? (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Date Requests</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Pending Requests</h3>
              {dateRequests.received.filter(req => req.status === 'pending').length === 0 ? (
                <p className="text-gray-500">No pending requests.</p>
              ) : (
                <div className="space-y-4">
                  {dateRequests.received
                    .filter(req => req.status === 'pending')
                    .map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between border-b border-gray-100 pb-4"
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={request.sender.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.sender.name)}`}
                            alt={request.sender.name}
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <h4 className="font-medium">{request.sender.name}</h4>
                            <p className="text-sm text-gray-500">
                              Sent {new Date(request.createdAt.toDate()).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDateResponse(request.id, 'accepted')}
                            className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDateResponse(request.id, 'declined')}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Upcoming Dates</h3>
              {dateRequests.received.filter(req => req.status === 'accepted' || req.status === 'confirmed').length === 0 ? (
                <p className="text-gray-500">No upcoming dates.</p>
              ) : (
                <div className="space-y-4">
                  {dateRequests.received
                    .filter(req => req.status === 'accepted' || req.status === 'confirmed')
                    .map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between border-b border-gray-100 pb-4"
                      >
                        <div className="flex items-center space-x-4">
                          <img
                            src={request.sender.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.sender.name)}`}
                            alt={request.sender.name}
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <h4 className="font-medium">{request.sender.name}</h4>
                            {request.status === 'confirmed' && request.dateDetails ? (
                              <div className="text-sm">
                                <p className="text-rose-600">
                                  {new Date(request.dateDetails.date).toLocaleDateString()} at {request.dateDetails.time}
                                </p>
                                <p className="text-gray-500">{request.dateDetails.venue}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">
                                Accepted on {new Date(request.respondedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {request.status === 'accepted' ? (
                          <button
                            onClick={() => navigate(`/date-planning/${request.id}`)}
                            className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
                          >
                            Plan Date
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/chat/${request.chatId}`)}
                            className="px-4 py-2 border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50"
                          >
                            Chat
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Sent Requests</h3>
              <div className="space-y-4">
                {dateRequests.sent.length === 0 ? (
                  <p className="text-gray-500">You haven't sent any date requests yet.</p>
                ) : (
                  dateRequests.sent.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between border-b border-gray-100 pb-4"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={request.recipient.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.recipient.name)}`}
                          alt={request.recipient.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h4 className="font-medium">{request.recipient.name}</h4>
                          <p className="text-sm text-gray-500">
                            Sent {new Date(request.createdAt.toDate()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        request.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'declined'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Received Date Requests</h3>
            {dateRequests.received.length === 0 ? (
              <p className="text-gray-500">No date requests received yet.</p>
            ) : (
              <div className="space-y-4">
                {dateRequests.received.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-4"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={request.sender.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.sender.name)}`}
                        alt={request.sender.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h4 className="font-medium">{request.sender.name}</h4>
                        <p className="text-sm text-gray-500">
                          Sent {new Date(request.createdAt.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {request.status === 'pending' ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDateResponse(request.id, 'accepted')}
                          className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDateResponse(request.id, 'declined')}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        request.status === 'accepted' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4">Sent Date Requests</h3>
            {dateRequests.sent.length === 0 ? (
              <p className="text-gray-500">You haven't sent any date requests yet.</p>
            ) : (
              <div className="space-y-4">
                {dateRequests.sent.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-4"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={request.recipient.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.recipient.name)}`}
                        alt={request.recipient.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h4 className="font-medium">{request.recipient.name}</h4>
                        <p className="text-sm text-gray-500">
                          Sent {new Date(request.createdAt.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      request.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'declined'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}