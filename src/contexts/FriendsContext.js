import React, { createContext, useContext, useState } from 'react';

const FriendsContext = createContext();

// Sample friends data
const sampleFriends = [
  {
    id: 'friend-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    avatar: null,
    status: 'accepted',
    events: [
      {
        id: 'event-1',
        title: '🎨 Art Workshop in Mission District',
        date: '2025-05-15',
        time: '2:00 PM',
        location: 'Mission Art Center',
        description: 'Join us for a creative afternoon of painting and socializing!',
        minAttendees: 5,
        maxAttendees: 15,
        currentAttendees: 3,
        attendees: ['friend-1', 'user-2', 'user-3'],
        emoji: '🎨'
      }
    ],
    nextEvent: {
      title: '🎨 Art Workshop',
      date: '2025-05-15'
    }
  },
  {
    id: 'friend-2',
    name: 'Mike Johnson',
    email: 'mike.j@example.com',
    avatar: null,
    status: 'accepted',
    events: [
      {
        id: 'event-2',
        title: '⚽ Soccer Game in Golden Gate Park',
        date: '2025-05-20',
        time: '10:00 AM',
        location: 'Golden Gate Park',
        description: 'Casual soccer game for all skill levels. Come join the fun!',
        minAttendees: 10,
        maxAttendees: 20,
        currentAttendees: 7,
        attendees: ['friend-2', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'user-9'],
        emoji: '⚽'
      }
    ],
    nextEvent: {
      title: '⚽ Soccer Game',
      date: '2025-05-20'
    }
  }
];

export const useFriends = () => {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
};

export const FriendsProvider = ({ children }) => {
  const [friends, setFriends] = useState(sampleFriends);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);

  const addFriend = async (email) => {
    // In a real app, this would make an API call to send a friend request
    const newFriend = {
      id: `friend-${Date.now()}`,
      email,
      name: email.split('@')[0], // Temporary name from email
      status: 'pending',
      events: [],
      nextEvent: null
    };
    setFriends([...friends, newFriend]);
  };

  const acceptFriendRequest = (requestId) => {
    // Update friend request status
    setFriendRequests(requests => 
      requests.map(req => 
        req.id === requestId ? { ...req, status: 'accepted' } : req
      )
    );
  };

  const viewFriendEvents = (friend) => {
    setSelectedFriend(friend);
  };

  const getFriendEvents = (friendId) => {
    const friend = friends.find(f => f.id === friendId);
    return friend ? friend.events : [];
  };

  const value = {
    friends,
    selectedFriend,
    friendRequests,
    addFriend,
    acceptFriendRequest,
    viewFriendEvents,
    getFriendEvents
  };

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
}; 