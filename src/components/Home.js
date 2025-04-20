import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { SAMPLE_PROFILES } from './Matches';

export default function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [confirmedDates, setConfirmedDates] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }

    // Listen for confirmed dates
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'dateRequests'),
        where('status', '==', 'confirmed'),
        where('participants', 'array-contains', currentUser.uid)
      ),
      (snapshot) => {
        const dates = [];
        snapshot.forEach((doc) => {
          const date = { id: doc.id, ...doc.data() };
          // Get the other participant's profile
          const otherParticipantId = date.participants.find(id => id !== currentUser.uid);
          const otherProfile = SAMPLE_PROFILES.find(p => p.id === otherParticipantId);
          dates.push({ ...date, otherProfile });
        });
        setConfirmedDates(dates);
        setLoading(false);

        // Find relevant events for the dates
        if (dates.length > 0) {
          const dateActivities = dates.map(date => date.dateDetails.activity.toLowerCase());
          const relevantEvents = events.filter(event => 
            dateActivities.some(activity => 
              event.title.toLowerCase().includes(activity) || 
              event.description.toLowerCase().includes(activity)
            )
          );
          setEvents(relevantEvents);
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser, navigate, events]);

  const renderConfirmedDate = (date) => {
    const formattedDate = format(new Date(date.dateDetails.day), 'EEEE, MMMM do');
    const otherPerson = date.otherProfile?.basicInfo.name || 'your match';

    return (
      <motion.div
        key={date.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6 mb-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Date with {otherPerson}
          </h3>
          <span className="text-sm text-gray-500">{formattedDate}</span>
        </div>
        <div className="space-y-2">
          <p className="text-gray-600">
            <span className="font-medium">Activity:</span> {date.dateDetails.activity}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Time:</span> {date.dateDetails.time}
          </p>
          {date.dateDetails.message && (
            <p className="text-gray-600">
              <span className="font-medium">Message:</span> {date.dateDetails.message}
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  const renderEvent = (event) => (
    <motion.div
      key={event.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm p-4 mb-3"
    >
      <h4 className="text-lg font-medium text-gray-800">{event.title}</h4>
      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
      {event.date && (
        <p className="text-xs text-gray-500 mt-2">
          {format(new Date(event.date), 'EEEE, MMMM do')}
        </p>
      )}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome Back!</h1>
      
      {confirmedDates.length > 0 ? (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Your Upcoming Dates
          </h2>
          <div className="space-y-6">
            {confirmedDates.map(renderConfirmedDate)}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg mb-12">
          <p className="text-gray-600">No confirmed dates yet.</p>
          <button
            onClick={() => navigate('/matches')}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            Find Matches
          </button>
        </div>
      )}

      {events.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Recommended Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map(renderEvent)}
          </div>
        </div>
      )}
    </div>
  );
} 