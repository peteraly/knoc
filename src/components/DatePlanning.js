import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const DatePlanning = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState(null);
  const [dateDetails, setDateDetails] = useState({
    date: '',
    time: '',
    venue: '',
    note: ''
  });

  useEffect(() => {
    const fetchDateRequest = async () => {
      try {
        const requestDoc = await getDoc(doc(db, 'dateRequests', requestId));
        if (!requestDoc.exists()) {
          toast.error('Date request not found');
          navigate('/matches');
          return;
        }

        const requestData = requestDoc.data();
        if (requestData.status !== 'accepted') {
          toast.error('This date request is not accepted');
          navigate('/matches');
          return;
        }

        // Fetch chat
        const chatQuery = query(
          collection(db, 'chats'),
          where('dateRequestId', '==', requestId)
        );
        const chatSnapshot = await getDocs(chatQuery);
        if (!chatSnapshot.empty) {
          const chatDoc = chatSnapshot.docs[0];
          setChat({ id: chatDoc.id, ...chatDoc.data() });
        }
      } catch (error) {
        console.error('Error fetching date request:', error);
        toast.error('Failed to load date details');
      } finally {
        setLoading(false);
      }
    };

    fetchDateRequest();
  }, [requestId, navigate]);

  const handleSubmitDateDetails = async () => {
    try {
      if (!dateDetails.date || !dateDetails.time || !dateDetails.venue) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Update date request with details
      await updateDoc(doc(db, 'dateRequests', requestId), {
        dateDetails: {
          date: dateDetails.date,
          time: dateDetails.time,
          venue: dateDetails.venue,
          note: dateDetails.note
        },
        status: 'confirmed',
        updatedAt: serverTimestamp()
      });

      // Update date invitation
      const invitationQuery = query(
        collection(db, 'dateInvitations'),
        where('dateRequestId', '==', requestId)
      );
      const invitationSnapshot = await getDocs(invitationQuery);
      if (!invitationSnapshot.empty) {
        const invitationDoc = invitationSnapshot.docs[0];
        await updateDoc(doc(db, 'dateInvitations', invitationDoc.id), {
          proposedDate: dateDetails.date,
          proposedTime: dateDetails.time,
          venue: dateDetails.venue,
          note: dateDetails.note,
          status: 'confirmed'
        });
      }

      // Add message to chat
      if (chat) {
        await addDoc(collection(db, 'chats', chat.id, 'messages'), {
          text: `Date planned for ${dateDetails.date} at ${dateDetails.time} at ${dateDetails.venue}${dateDetails.note ? `\nNote: ${dateDetails.note}` : ''}`,
          senderId: currentUser.uid,
          timestamp: serverTimestamp()
        });
      }

      toast.success('Date details updated!');
      navigate('/matches');
    } catch (error) {
      console.error('Error updating date details:', error);
      toast.error('Failed to update date details');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Plan Your Date</h1>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={dateDetails.date}
              onChange={(e) => setDateDetails(prev => ({ ...prev, date: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <input
              type="time"
              value={dateDetails.time}
              onChange={(e) => setDateDetails(prev => ({ ...prev, time: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Venue</label>
            <input
              type="text"
              value={dateDetails.venue}
              onChange={(e) => setDateDetails(prev => ({ ...prev, venue: e.target.value }))}
              placeholder="Enter venue name or address"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
            <textarea
              value={dateDetails.note}
              onChange={(e) => setDateDetails(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Any special requests or preferences?"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={() => navigate('/matches')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitDateDetails}
            className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600"
          >
            Confirm Date
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DatePlanning; 