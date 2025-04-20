import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../utils/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export default function Chat() {
  const { chatId } = useParams();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (!chatDoc.exists()) {
          toast.error('Chat not found');
          return;
        }

        const chatData = chatDoc.data();
        const otherUserId = chatData.participants.find(id => id !== currentUser.uid);
        const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
        
        setOtherUser({
          id: otherUserId,
          name: otherUserDoc.data()?.basicInfo?.name || 'User',
          photo: otherUserDoc.data()?.photoURL
        });

        const messagesQuery = query(
          collection(db, 'chats', chatId, 'messages'),
          orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const newMessages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMessages(newMessages);
          setLoading(false);
          scrollToBottom();
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching chat:', error);
        toast.error('Failed to load chat');
        setLoading(false);
      }
    };

    fetchChatData();
  }, [chatId, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        {otherUser?.photo && (
          <img
            src={otherUser.photo}
            alt={otherUser.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <h2 className="ml-3 text-lg font-medium text-gray-900">
          {otherUser?.name}
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === currentUser.uid
                    ? 'bg-rose-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p className="text-xs mt-1 opacity-75">
                  {message.createdAt?.toDate().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 