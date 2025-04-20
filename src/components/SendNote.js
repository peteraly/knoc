import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export default function SendNote() {
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [noteText, setNoteText] = useState('');
  const { matchId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = location.state?.returnPath || '/matches';

  useEffect(() => {
    const fetchMatch = async () => {
      if (!currentUser) {
        navigate('/login', { state: { from: `/send-note/${matchId}` } });
        return;
      }

      try {
        const matchDoc = await getDoc(doc(db, 'users', matchId));
        if (!matchDoc.exists()) {
          toast.error('Match not found');
          navigate(returnPath);
          return;
        }

        const matchData = matchDoc.data();
        setMatch({
          id: matchDoc.id,
          name: matchData.basicInfo?.name || 'Anonymous',
          photoURL: matchData.basicInfo?.photoURL
        });
      } catch (error) {
        console.error('Error fetching match:', error);
        toast.error('Failed to load match data');
        navigate(returnPath);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [currentUser, matchId, navigate, returnPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) {
      toast.error('Please write a message');
      return;
    }

    if (currentUser.uid === matchId) {
      toast.error('You cannot send a note to yourself');
      return;
    }

    setLoading(true);
    try {
      const noteData = {
        senderId: currentUser.uid,
        recipientId: matchId,
        content: noteText.trim(),
        createdAt: new Date(),
        read: false
      };

      await addDoc(collection(db, 'notes'), noteData);
      toast.success('Note sent successfully!');
      navigate(returnPath);
    } catch (error) {
      console.error('Error sending note:', error);
      toast.error('Failed to send note');
      setLoading(false);
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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(returnPath)}
            className="text-gray-600 hover:text-gray-800 mr-4"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Write a Note to {match?.name}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write your message here..."
              className="w-full h-48 p-4 bg-rose-50 border-b border-rose-200 rounded-lg focus:outline-none focus:border-rose-500 font-handwriting text-lg"
              style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #f43f5e 31px, #f43f5e 32px)',
                lineHeight: '32px',
                padding: '8px 10px'
              }}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(returnPath)}
              className="px-6 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-rose-500 text-white rounded-lg ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-rose-600'
              }`}
            >
              {loading ? 'Sending...' : 'Send Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 