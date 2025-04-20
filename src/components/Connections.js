import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function Connections() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState({
    pending: [],
    upcoming: [],
    past: []
  });

  useEffect(() => {
    const fetchConnections = async () => {
      if (!currentUser) return;

      try {
        // Fetch all date requests
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

        const pending = [];
        const upcoming = [];
        const past = [];

        // Process sent requests
        for (const docSnap of sentSnap.docs) {
          const request = docSnap.data();
          const recipientDoc = await getDoc(firestoreDoc(db, 'users', request.recipientId));
          const recipientData = recipientDoc.data();

          const connection = {
            id: docSnap.id,
            type: 'sent',
            ...request,
            otherUser: {
              id: request.recipientId,
              name: recipientData?.basicInfo?.name || 'Anonymous',
              photoURL: recipientData?.basicInfo?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientData?.basicInfo?.name || 'Anonymous')}`,
              location: recipientData?.basicInfo?.location
            }
          };

          if (request.status === 'pending') {
            pending.push(connection);
          } else if (request.status === 'accepted') {
            if (request.dateDetails?.date) {
              const dateTime = new Date(request.dateDetails.date);
              if (dateTime < new Date()) {
                past.push(connection);
              } else {
                upcoming.push(connection);
              }
            } else {
              upcoming.push(connection);
            }
          }
        }

        // Process received requests
        for (const docSnap of receivedSnap.docs) {
          const request = docSnap.data();
          const senderDoc = await getDoc(firestoreDoc(db, 'users', request.senderId));
          const senderData = senderDoc.data();

          const connection = {
            id: docSnap.id,
            type: 'received',
            ...request,
            otherUser: {
              id: request.senderId,
              name: senderData?.basicInfo?.name || 'Anonymous',
              photoURL: senderData?.basicInfo?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderData?.basicInfo?.name || 'Anonymous')}`,
              location: senderData?.basicInfo?.location
            }
          };

          if (request.status === 'pending') {
            pending.push(connection);
          } else if (request.status === 'accepted') {
            if (request.dateDetails?.date) {
              const dateTime = new Date(request.dateDetails.date);
              if (dateTime < new Date()) {
                past.push(connection);
              } else {
                upcoming.push(connection);
              }
            } else {
              upcoming.push(connection);
            }
          }
        }

        setConnections({
          pending,
          upcoming,
          past
        });
      } catch (error) {
        console.error('Error fetching connections:', error);
        toast.error('Failed to load connections');
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [currentUser]);

  const renderConnectionCard = (connection) => {
    const { otherUser, status, type, dateDetails } = connection;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <img
            src={otherUser.photoURL}
            alt={otherUser.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-lg">{otherUser.name}</h3>
            <p className="text-gray-500 text-sm">{otherUser.location}</p>
            {dateDetails?.date && (
              <div className="mt-1">
                <p className="text-sm text-rose-600">
                  {new Date(dateDetails.date).toLocaleDateString()} at {dateDetails.time}
                </p>
                <p className="text-sm text-gray-500">{dateDetails.venue}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {status === 'pending' && type === 'received' && (
            <button
              onClick={() => navigate(`/profile?tab=dates`)}
              className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
            >
              Respond
            </button>
          )}
          {status === 'accepted' && !dateDetails?.date && (
            <button
              onClick={() => navigate(`/date-planning/${connection.id}`)}
              className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
            >
              Plan Date
            </button>
          )}
          {(status === 'confirmed' || (status === 'accepted' && dateDetails?.date)) && (
            <button
              onClick={() => navigate(`/chat/${connection.chatId}`)}
              className="px-4 py-2 border border-rose-500 text-rose-500 rounded-lg hover:bg-rose-50"
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
      <h1 className="text-3xl font-bold mb-8">Your Connections</h1>

      <div className="space-y-8">
        {/* Pending Connections */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
          {connections.pending.length === 0 ? (
            <p className="text-gray-500">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {connections.pending.map(connection => renderConnectionCard(connection))}
            </div>
          )}
        </section>

        {/* Upcoming Dates */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Upcoming Dates</h2>
          {connections.upcoming.length === 0 ? (
            <p className="text-gray-500">No upcoming dates</p>
          ) : (
            <div className="space-y-4">
              {connections.upcoming.map(connection => renderConnectionCard(connection))}
            </div>
          )}
        </section>

        {/* Past Dates */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Past Dates</h2>
          {connections.past.length === 0 ? (
            <p className="text-gray-500">No past dates</p>
          ) : (
            <div className="space-y-4">
              {connections.past.map(connection => renderConnectionCard(connection))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
} 