import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function DateInvitations() {
  const { currentUser } = useAuth();
  const [sentInvites, setSentInvites] = useState([]);
  const [receivedInvites, setReceivedInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, [currentUser]);

  const fetchInvitations = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Fetch sent invitations
      const sentQuery = query(
        collection(db, 'dateInvitations'),
        where('senderId', '==', currentUser.uid)
      );
      
      // Fetch received invitations
      const receivedQuery = query(
        collection(db, 'dateInvitations'),
        where('recipientId', '==', currentUser.uid)
      );

      const [sentSnap, receivedSnap] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
      ]);

      const processedSent = [];
      const processedReceived = [];

      // Process sent invitations
      for (const doc of sentSnap.docs) {
        const invite = doc.data();
        const recipientDoc = await getDocs(doc(db, 'users', invite.recipientId));
        const recipientData = recipientDoc.data();
        
        processedSent.push({
          id: doc.id,
          ...invite,
          recipient: {
            name: recipientData?.basicInfo?.name || 'User',
            photo: recipientData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(recipientData?.basicInfo?.name || 'User')}&background=f9a8d4&color=ffffff`
          },
          timeAgo: formatTimeAgo(invite.createdAt?.toDate())
        });
      }

      // Process received invitations
      for (const doc of receivedSnap.docs) {
        const invite = doc.data();
        const senderDoc = await getDocs(doc(db, 'users', invite.senderId));
        const senderData = senderDoc.data();
        
        processedReceived.push({
          id: doc.id,
          ...invite,
          sender: {
            name: senderData?.basicInfo?.name || 'User',
            photo: senderData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderData?.basicInfo?.name || 'User')}&background=f9a8d4&color=ffffff`
          },
          timeAgo: formatTimeAgo(invite.createdAt?.toDate())
        });
      }

      setSentInvites(processedSent);
      setReceivedInvites(processedReceived);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const handleInviteResponse = async (inviteId, status) => {
    try {
      await updateDoc(doc(db, 'dateInvitations', inviteId), {
        status,
        respondedAt: new Date()
      });

      toast.success(status === 'accepted' ? 'Date confirmed!' : 'Invitation declined');
      fetchInvitations();
    } catch (error) {
      console.error('Error updating invitation:', error);
      toast.error('Failed to update invitation');
    }
  };

  const renderInvitationCard = (invite, type = 'received') => {
    const person = type === 'received' ? invite.sender : invite.recipient;
    const isPending = invite.status === 'pending';
    const isAccepted = invite.status === 'accepted';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-4 border border-rose-100"
      >
        <div className="flex items-center space-x-4">
          <img
            src={person.photo}
            alt={person.name}
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{person.name}</h3>
            <p className="text-sm text-gray-500">{invite.timeAgo}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(invite.proposedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {invite.proposedTime}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {invite.venue}
          </div>
        </div>

        {invite.note && (
          <div className="mt-4 p-3 bg-rose-50 rounded-md text-sm text-gray-700 italic">
            "{invite.note}"
          </div>
        )}

        {type === 'received' && isPending && (
          <div className="mt-4 flex space-x-3">
            <button
              onClick={() => handleInviteResponse(invite.id, 'accepted')}
              className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700"
            >
              Accept
            </button>
            <button
              onClick={() => handleInviteResponse(invite.id, 'declined')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Decline
            </button>
          </div>
        )}

        {isAccepted && (
          <div className="mt-4 flex justify-between items-center">
            <span className="text-green-600 flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirmed
            </span>
            <Link
              to={`/chat/${invite.chatId}`}
              className="text-rose-600 hover:text-rose-700"
            >
              Open Chat
            </Link>
          </div>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-serif text-gray-900 mb-6">Date Invitations</h1>
        
        {receivedInvites.length === 0 && sentInvites.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invitations yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start connecting with people and plan your first date!
            </p>
            <div className="mt-6">
              <Link
                to="/matches"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                Find Matches
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {receivedInvites.length > 0 && (
              <section>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Received Invitations</h2>
                <div className="space-y-4">
                  {receivedInvites.map(invite => renderInvitationCard(invite, 'received'))}
                </div>
              </section>
            )}

            {sentInvites.length > 0 && (
              <section>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Sent Invitations</h2>
                <div className="space-y-4">
                  {sentInvites.map(invite => renderInvitationCard(invite, 'sent'))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 