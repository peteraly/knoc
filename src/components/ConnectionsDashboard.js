import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, doc as firestoreDoc, updateDoc, serverTimestamp, getDoc, addDoc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function ConnectionsDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [dates, setDates] = useState({
    pending: [],
    upcoming: [],
    past: []
  });

  const fetchData = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Fetch connections
      const connectionsQuery = query(
        collection(db, 'connections'),
        where('participants', 'array-contains', currentUser.uid)
      );
      const connectionsSnap = await getDocs(connectionsQuery);
      const processedConnections = [];

      for (const doc of connectionsSnap.docs) {
        const connection = doc.data();
        const otherUserId = connection.participants.find(id => id !== currentUser.uid);
        const otherUserDoc = await getDoc(firestoreDoc(db, 'users', otherUserId));
        const otherUserData = otherUserDoc.data();

        processedConnections.push({
          id: doc.id,
          ...connection,
          otherUser: {
            id: otherUserId,
            name: otherUserData?.basicInfo?.name || 'User',
            photo: otherUserData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUserData?.basicInfo?.name || 'User')}`
          }
        });
      }

      setConnections(processedConnections);

      // Fetch dates
      const sentQuery = query(
        collection(db, 'dateRequests'),
        where('senderId', '==', currentUser.uid)
      );
      const receivedQuery = query(
        collection(db, 'dateRequests'),
        where('recipientId', '==', currentUser.uid)
      );

      const [sentSnap, receivedSnap] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
      ]);

      const processedDates = {
        pending: [],
        upcoming: [],
        past: []
      };

      const processDateDoc = async (doc, type) => {
        const date = doc.data();
        const otherUserId = type === 'sent' ? date.recipientId : date.senderId;
        const otherUserDoc = await getDoc(firestoreDoc(db, 'users', otherUserId));
        const otherUserData = otherUserDoc.data();

        return {
          id: doc.id,
          ...date,
          type,
          otherUser: {
            id: otherUserId,
            name: otherUserData?.basicInfo?.name || 'User',
            photo: otherUserData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUserData?.basicInfo?.name || 'User')}`
          }
        };
      };

      // Process sent and received date requests
      for (const doc of [...sentSnap.docs, ...receivedSnap.docs]) {
        const type = doc.data().senderId === currentUser.uid ? 'sent' : 'received';
        const processedDate = await processDateDoc(doc, type);
        
        if (processedDate.status === 'pending') {
          processedDates.pending.push(processedDate);
        } else if (processedDate.status === 'confirmed' || processedDate.status === 'accepted') {
          const dateTime = processedDate.dateDetails?.date ? new Date(processedDate.dateDetails.date) : null;
          if (!dateTime || dateTime > new Date()) {
            processedDates.upcoming.push(processedDate);
          } else {
            processedDates.past.push(processedDate);
          }
        }
      }

      // Sort dates
      const sortByDate = (a, b) => {
        if (!a.dateDetails?.date) return 1;
        if (!b.dateDetails?.date) return -1;
        return new Date(a.dateDetails.date) - new Date(b.dateDetails.date);
      };

      processedDates.upcoming.sort(sortByDate);
      processedDates.past.sort((a, b) => sortByDate(b, a));
      processedDates.pending.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());

      setDates(processedDates);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateResponse = async (dateId, status) => {
    try {
      const batch = writeBatch(db);
      
      // Get the date request document first
      const dateRequestRef = firestoreDoc(db, 'dateRequests', dateId);
      const dateRequestSnap = await getDoc(dateRequestRef);
      
      if (!dateRequestSnap.exists()) {
        throw new Error('Date request not found');
      }
      
      const dateRequestData = dateRequestSnap.data();
      
      // Update the date request status
      batch.update(dateRequestRef, {
        status,
        respondedAt: serverTimestamp()
      });

      if (status === 'accepted') {
        const date = dates.pending.find(d => d.id === dateId);
        if (date) {
          // Create chat document with required fields
          const chatRef = firestoreDoc(db, 'chats', dateId);
          const chatData = {
            participants: [currentUser.uid, date.otherUser.id],
            type: 'date_planning',
            dateRequestId: dateId,
            createdAt: serverTimestamp(),
            lastMessageAt: serverTimestamp()
          };
          
          // Only add matchId if it exists and is not undefined
          if (dateRequestData.matchId) {
            chatData.matchId = dateRequestData.matchId;
          }
          
          batch.set(chatRef, chatData);

          // Update the date request with the chat reference
          batch.update(dateRequestRef, {
            chatId: chatRef.id,
            updatedAt: serverTimestamp()
          });

          // Create notification for the other user
          const notificationRef = firestoreDoc(db, 'notifications', `${dateId}_accepted`);
          batch.set(notificationRef, {
            userId: date.otherUser.id,
            type: 'date_request_accepted',
            dateRequestId: dateId,
            read: false,
            createdAt: serverTimestamp()
          });

          await batch.commit();
          toast.success('Date request accepted! Let\'s plan the details.');
          navigate(`/date-planning/${dateId}`);
        }
      } else {
        await batch.commit();
        toast.success('Date request declined');
      }

      fetchData();
    } catch (error) {
      console.error('Error updating date request:', error);
      toast.error('Failed to update date request');
    }
  };

  const renderConnectionCard = (connection) => (
    <motion.div
      key={connection.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <img
            src={connection.otherUser.photo}
            alt={connection.otherUser.name}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium text-base sm:text-lg">{connection.otherUser.name}</h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Connected {new Date(connection.createdAt.toDate()).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/chat/${connection.chatId}`)}
          className="px-3 py-1.5 sm:px-4 sm:py-2 border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
        >
          Chat
        </button>
      </div>
    </motion.div>
  );

  const renderDateCard = (date) => {
    if (!date) return null;

    const isPending = date.status === 'pending';
    const isConfirmed = date.status === 'confirmed';
    const isAccepted = date.status === 'accepted';
    const hasDateDetails = date.dateDetails && Object.keys(date.dateDetails).length > 0;

    return (
      <motion.div
        key={date.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <img
              src={date.otherUser.photo}
              alt={date.otherUser.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-medium text-base sm:text-lg">{date.otherUser.name}</h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {date.type === 'sent' ? 'You sent a request' : 'Sent you a request'}
                {date.createdAt && ` · ${new Date(date.createdAt.toDate()).toLocaleDateString()}`}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm ${
            isPending
              ? 'bg-yellow-100 text-yellow-800'
              : isConfirmed
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {date.status.charAt(0).toUpperCase() + date.status.slice(1)}
          </span>
        </div>

        {hasDateDetails && date.dateDetails.date && (
          <div className="mt-3 sm:mt-4 space-y-2">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="truncate">
                {new Date(date.dateDetails.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
            {date.dateDetails.time && (
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="truncate">{date.dateDetails.time}</span>
              </div>
            )}
            {date.dateDetails.venue && (
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{date.dateDetails.venue}</span>
              </div>
            )}
          </div>
        )}

        {date.dateDetails?.note && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-rose-50 rounded-md text-xs sm:text-sm text-gray-700 italic">
            "{date.dateDetails.note}"
          </div>
        )}

        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:space-x-3">
          {isPending && date.type === 'received' && (
            <>
              <button
                onClick={() => handleDateResponse(date.id, 'accepted')}
                className="w-full sm:flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                Accept
              </button>
              <button
                onClick={() => handleDateResponse(date.id, 'declined')}
                className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Decline
              </button>
            </>
          )}
          {isAccepted && !hasDateDetails && (
            <button
              onClick={() => navigate(`/date-planning/${date.id}`)}
              className="w-full sm:flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              Plan Date
            </button>
          )}
          {(isConfirmed || (isAccepted && hasDateDetails)) && date.chatId && (
            <button
              onClick={() => navigate(`/chat/${date.chatId}`)}
              className="w-full sm:flex-1 px-4 py-2 border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              Chat
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const hasNoContent = connections.length === 0 && 
    dates.pending.length === 0 && 
    dates.upcoming.length === 0 && 
    dates.past.length === 0;

  if (hasNoContent) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-xl font-medium text-gray-900">
            Welcome to Your Dating Journey
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Start matching with people to build connections and plan dates!
          </p>
          <button
            onClick={() => navigate('/matches')}
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-rose-600 hover:bg-rose-700"
          >
            Find Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Your Dating Dashboard</h1>

      {/* Action Required Section */}
      {dates.pending.length > 0 && (
        <section className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <span className="relative flex items-center">
              Action Required
              <span className="ml-2 inline-flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 text-white text-xs items-center justify-center">
                  {dates.pending.length}
                </span>
              </span>
            </span>
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {dates.pending.map(date => renderDateCard(date))}
          </div>
        </section>
      )}

      {/* Upcoming Dates Section */}
      {dates.upcoming.length > 0 && (
        <section className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Upcoming Dates
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {dates.upcoming.map(date => renderDateCard(date))}
          </div>
        </section>
      )}

      {/* Active Connections Section */}
      {connections.length > 0 && (
        <section className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Active Connections
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {connections.map(connection => renderConnectionCard(connection))}
          </div>
        </section>
      )}

      {/* Past Dates Section */}
      {dates.past.length > 0 && (
        <section className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Dating History
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {dates.past.map(date => renderDateCard(date))}
          </div>
        </section>
      )}

      {/* Quick Actions - Floating Action Button */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <button
          onClick={() => navigate('/matches')}
          className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
          aria-label="Find Matches"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
} 