import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../utils/firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function DevTools() {
  const { currentUser } = useAuth();
  const [dateRequests, setDateRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const testUsers = [
    { id: 'test_user_1', name: 'Sarah Johnson' },
    { id: 'test_user_2', name: 'Michael Chen' },
    { id: 'test_user_3', name: 'Alex Rivera' },
    { id: 'test_user_4', name: 'Emily Parker' },
    { id: 'test_user_5', name: 'James Wilson' }
  ];

  const fetchDateRequests = useCallback(async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      // Fetch received requests for the selected test user
      const receivedQuery = query(
        collection(db, 'dateRequests'),
        where('recipientId', '==', selectedUser.id)
      );
      
      const receivedSnap = await getDocs(receivedQuery);
      const requests = [];

      for (const doc of receivedSnap.docs) {
        const request = doc.data();
        
        requests.push({
          id: doc.id,
          ...request,
          sender: {
            name: request.senderName || 'Unknown User',
            photo: request.senderPhoto
          },
          createdAt: request.createdAt,
          status: request.status
        });
      }

      setDateRequests(requests);
    } catch (error) {
      console.error('Error fetching date requests:', error);
      toast.error('Failed to load date requests');
    } finally {
      setLoading(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    fetchDateRequests();
  }, [fetchDateRequests]);

  const handleDateResponse = async (requestId, status) => {
    try {
      await updateDoc(doc(db, 'dateRequests', requestId), {
        status,
        respondedAt: new Date()
      });

      toast.success(`Date request ${status}`);
      fetchDateRequests();
    } catch (error) {
      console.error('Error updating date request:', error);
      toast.error('Failed to update date request');
    }
  };

  const switchUser = (user) => {
    setSelectedUser(user);
    toast.success(`Switched to ${user.name}'s view`);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Dev Tools</h3>
          <button
            onClick={() => setSelectedUser(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            Reset
          </button>
        </div>

        {/* User Switcher */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Switch Test User
          </label>
          <div className="grid grid-cols-2 gap-2">
            {testUsers.map(user => (
              <button
                key={user.id}
                onClick={() => switchUser(user)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedUser?.id === user.id
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>

        {/* Date Requests */}
        {selectedUser && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Date Requests for {selectedUser.name}
            </h4>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-500"></div>
              </div>
            ) : dateRequests.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No date requests found
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {dateRequests.map(request => (
                  <div
                    key={request.id}
                    className="bg-gray-50 rounded-md p-3 text-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{request.sender.name}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(request.createdAt.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : request.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleDateResponse(request.id, 'accepted')}
                          className="flex-1 px-2 py-1 bg-rose-500 text-white rounded-md text-xs hover:bg-rose-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDateResponse(request.id, 'declined')}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-xs hover:bg-gray-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 