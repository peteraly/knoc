import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, doc as firestoreDoc, updateDoc, serverTimestamp, getDoc, addDoc, onSnapshot, orderBy, writeBatch } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export default function DateDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'upcoming');
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState({
    pending: [],
    upcoming: [],
    past: []
  });
  const [dateRequests, setDateRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [confirmationCode, setConfirmationCode] = useState('');

  const fetchDates = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      // Fetch sent and received date requests
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

        const processedDate = {
          id: doc.id,
          ...date,
          type,
          dateDetails: date.dateDetails || null,
          otherUser: {
            id: otherUserId,
            name: otherUserData?.basicInfo?.name || 'User',
            photo: otherUserData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUserData?.basicInfo?.name || 'User')}`
          }
        };

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

        return processedDate;
      };

      // Process sent requests
      for (const doc of sentSnap.docs) {
        const processedDate = await processDateDoc(doc, 'sent');
      }

      // Process received requests
      for (const doc of receivedSnap.docs) {
        const processedDate = await processDateDoc(doc, 'received');
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
      console.error('Error fetching dates:', error);
      toast.error('Failed to load dates');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Subscribe to notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('toUserId', '==', currentUser.uid),
      where('status', '==', 'unread'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
    });

    // Fetch dates immediately and start listening for changes
    fetchDates();

    return () => {
      unsubscribeNotifications();
    };
  }, [currentUser, fetchDates]);

  const handleDateRequestResponse = async (requestId, status) => {
    try {
      const batch = writeBatch(db);
      
      // Get the date request
      const requestRef = firestoreDoc(db, 'dateRequests', requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Date request not found');
      }

      const requestData = requestSnap.data();
      
      // Update date request status
      batch.update(requestRef, {
        status,
        updatedAt: serverTimestamp(),
        ...(status === 'accepted' && {
          acceptedAt: serverTimestamp()
        })
      });

      if (status === 'accepted') {
        // Create chat document
        const chatRef = firestoreDoc(db, 'chats', requestId);
        batch.set(chatRef, {
          dateRequestId: requestId,
          matchId: requestData.matchId,
          participants: [requestData.senderId, requestData.recipientId],
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp()
        });

        // Update match with chat reference
        const matchRef = firestoreDoc(db, 'matches', requestData.matchId);
        batch.update(matchRef, {
          chatId: chatRef.id,
          lastInteractionAt: serverTimestamp()
        });

        // Create notification for sender
        const notificationRef = firestoreDoc(db, 'notifications', requestId);
        batch.set(notificationRef, {
          userId: requestData.senderId,
          type: 'date_request_accepted',
          dateRequestId: requestId,
          matchId: requestData.matchId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      await batch.commit();
      
      // Update local state
      setDateRequests(prev => 
        prev.map(request => 
          request.id === requestId 
            ? { ...request, status }
            : request
        )
      );

      toast.success(`Date request ${status}`);
    } catch (error) {
      console.error('Error handling date request:', error);
      toast.error('Failed to update date request');
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await updateDoc(firestoreDoc(db, 'notifications', notificationId), {
        status: 'read',
        readAt: serverTimestamp()
      });
      // Update local state to remove the notification
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleAcceptDate = async (dateId) => {
    try {
      await updateDoc(firestoreDoc(db, 'dates', dateId), {
        status: 'confirmed',
        confirmedAt: serverTimestamp()
      });
      toast.success('Date request accepted!');
      // Refresh the dates
      fetchDates();
    } catch (error) {
      console.error('Error accepting date:', error);
      toast.error('Failed to accept date request');
    }
  };

  const handleDeclineDate = async (dateId) => {
    try {
      await updateDoc(firestoreDoc(db, 'dates', dateId), {
        status: 'declined',
        declinedAt: serverTimestamp()
      });
      toast.success('Date request declined');
      // Refresh the dates
      fetchDates();
    } catch (error) {
      console.error('Error declining date:', error);
      toast.error('Failed to decline date request');
    }
  };

  const handleConfirmDate = async (dateId, expectedCode) => {
    if (!confirmationCode) {
      toast.error('Please enter the confirmation code');
      return;
    }

    if (confirmationCode !== expectedCode) {
      toast.error('Invalid confirmation code');
      return;
    }

    try {
      await updateDoc(firestoreDoc(db, 'dates', dateId), {
        status: 'completed',
        completedAt: serverTimestamp()
      });

      // Update local state
      setDates(prev => ({
        ...prev,
        upcoming: prev.upcoming.filter(date => date.id !== dateId),
        past: [...prev.past, {
          id: dateId,
          status: 'completed',
          completedAt: new Date()
        }]
      }));

      toast.success('Date confirmed!');
      setConfirmationCode('');
    } catch (error) {
      console.error('Error confirming date:', error);
      toast.error('Failed to confirm date');
    }
  };

  const renderEmptyState = (type) => (
    <div className="text-center py-12">
      <div className="mx-auto h-24 w-24 text-gray-400">
        {type === 'pending' ? (
          <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : type === 'upcoming' ? (
          <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        {type === 'pending' ? 'No pending requests' : 
         type === 'upcoming' ? 'No upcoming dates' : 
         'No past dates'}
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        {type === 'pending' ? 'When you receive date requests, they\'ll appear here' :
         type === 'upcoming' ? 'Your confirmed dates will show up here' :
         'Your dating history will be shown here'}
      </p>
    </div>
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
        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={date.otherUser.photo}
              alt={date.otherUser.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-medium text-lg">{date.otherUser.name}</h3>
              <p className="text-sm text-gray-500">
                {date.type === 'sent' ? 'You sent a request' : 'Sent you a request'}
                {date.createdAt && ` · ${new Date(date.createdAt.toDate()).toLocaleDateString()}`}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm ${
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
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(date.dateDetails.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </div>
            {date.dateDetails.time && (
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {date.dateDetails.time}
              </div>
            )}
            {date.dateDetails.venue && (
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {date.dateDetails.venue}
              </div>
            )}
          </div>
        )}

        {date.dateDetails?.note && (
          <div className="mt-4 p-3 bg-rose-50 rounded-md text-sm text-gray-700 italic">
            "{date.dateDetails.note}"
          </div>
        )}

        <div className="mt-4 flex space-x-3">
          {isPending && date.type === 'received' && (
            <>
              <button
                onClick={() => handleDateRequestResponse(date.id, 'accepted')}
                className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => handleDateRequestResponse(date.id, 'declined')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Decline
              </button>
            </>
          )}
          {isAccepted && !hasDateDetails && (
            <button
              onClick={() => navigate(`/date-planning/${date.id}`)}
              className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              Plan Date
            </button>
          )}
          {(isConfirmed || (isAccepted && hasDateDetails)) && date.chatId && (
            <button
              onClick={() => navigate(`/chat/${date.chatId}`)}
              className="flex-1 px-4 py-2 border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Dates</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'upcoming'
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming {dates.upcoming.length > 0 && `(${dates.upcoming.length})`}
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'pending'
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending {dates.pending.length > 0 && `(${dates.pending.length})`}
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'past'
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Past {dates.past.length > 0 && `(${dates.past.length})`}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {dates[activeTab].length === 0 ? (
          renderEmptyState(activeTab)
        ) : (
          dates[activeTab].map(date => renderDateCard(date))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mt-6">
          <h2 className="text-lg font-semibold mb-3">New Notifications</h2>
          <div className="space-y-3">
            {notifications.map(notification => (
              <div key={notification.id} className="bg-white p-3 rounded shadow-sm">
                <p>{notification.message}</p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(notification.createdAt?.toDate(), { addSuffix: true })}
                </p>
                <button
                  onClick={() => markNotificationRead(notification.id)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark as read
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Date Requests</h2>
        <div className="space-y-4">
          {dateRequests.map(request => (
            <div key={request.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    Date Request {request.status === 'pending' && <span className="text-yellow-600">(Pending)</span>}
                    {request.status === 'confirmed' && <span className="text-green-600">(Confirmed)</span>}
                    {request.status === 'declined' && <span className="text-red-600">(Declined)</span>}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDistanceToNow(request.createdAt?.toDate(), { addSuffix: true })}
                  </p>
                  <p className="mt-2">
                    Proposed time: {new Date(request.proposedDateTime).toLocaleString()}
                  </p>
                  {request.location && (
                    <p className="mt-1">Location: {request.location}</p>
                  )}
                </div>
                {request.status === 'pending' && request.users[1] === currentUser.uid && (
                  <div className="space-x-2">
                    <button
                      onClick={() => handleAcceptDate(request.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineDate(request.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {dateRequests.length === 0 && (
            <p className="text-gray-500">No date requests at the moment.</p>
          )}
        </div>
      </div>
    </div>
  );
} 