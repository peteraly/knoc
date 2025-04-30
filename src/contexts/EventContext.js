import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../utils/firebase';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { sampleEvents, getDiscoverEvents, getUserEvents } from '../data/sampleEvents';

const EventContext = createContext();

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

export const useEvent = (eventId) => {
  const { events, loading, error } = useEvents();
  const event = events.find(e => e.id === eventId);

  return {
    event,
    loading,
    error
  };
};

const calculateEventViability = (event) => {
  const attendeeCount = event.attendees?.length || 0;
  const hostCount = event.hosts?.length || 0;

  // Pareto Frontier thresholds
  const thresholds = {
    optimal: {
      attendees: event.maxAttendees,
      hosts: event.requiredHosts || 1
    },
    viable: {
      attendees: event.minAttendees,
      hosts: 1
    },
    critical: {
      attendees: Math.ceil(event.minAttendees * 0.5),
      hosts: 1
    }
  };

  // Calculate efficiency scores (0-1)
  const attendeeScore = Math.min(attendeeCount / thresholds.optimal.attendees, 1);
  const hostScore = Math.min(hostCount / thresholds.optimal.hosts, 1);

  // Combined Pareto score (geometric mean for balanced consideration)
  const paretoScore = Math.sqrt(attendeeScore * hostScore);

  // Determine event status based on Pareto efficiency
  if (paretoScore >= 0.8) {
    return {
      status: 'confirmed',
      score: paretoScore,
      message: 'Event is optimally staffed and attended'
    };
  } else if (paretoScore >= 0.6) {
    return {
      status: 'upcoming',
      score: paretoScore,
      message: 'Event is viable but could be optimized'
    };
  } else if (attendeeCount >= thresholds.critical.attendees && hostCount >= thresholds.critical.hosts) {
    return {
      status: 'at-risk',
      score: paretoScore,
      message: 'Event needs more attendees or hosts to be viable'
    };
  } else {
    return {
      status: 'cancelled',
      score: paretoScore,
      message: 'Event does not meet minimum requirements'
    };
  }
};

// Define event categories
const eventCategories = [
  // Social & Casual
  { 
    id: 'dining', 
    name: 'Dining & Food', 
    emoji: '🍽️',
    subcategories: [
      { id: 'restaurant', name: 'Restaurant', emoji: '🍽️' },
      { id: 'cooking-class', name: 'Cooking Class', emoji: '👨‍🍳' },
      { id: 'food-tour', name: 'Food Tour', emoji: '🍜' },
      { id: 'potluck', name: 'Potluck', emoji: '🥘' }
    ]
  },
  { 
    id: 'drinks', 
    name: 'Drinks & Nightlife', 
    emoji: '🍷',
    subcategories: [
      { id: 'wine-tasting', name: 'Wine Tasting', emoji: '🍷' },
      { id: 'cocktail-making', name: 'Cocktail Making', emoji: '🍸' },
      { id: 'bar-hopping', name: 'Bar Hopping', emoji: '🍺' },
      { id: 'brewery-tour', name: 'Brewery Tour', emoji: '🍻' }
    ]
  },
  { 
    id: 'sports', 
    name: 'Sports & Recreation', 
    emoji: '⚽',
    subcategories: [
      { id: 'team-sport', name: 'Team Sport', emoji: '⚽' },
      { id: 'fitness-class', name: 'Fitness Class', emoji: '🏃' },
      { id: 'hiking', name: 'Hiking', emoji: '🥾' },
      { id: 'yoga', name: 'Yoga', emoji: '🧘' }
    ]
  },
  { 
    id: 'arts', 
    name: 'Arts & Culture', 
    emoji: '🎨',
    subcategories: [
      { id: 'museum', name: 'Museum Visit', emoji: '🏛️' },
      { id: 'art-class', name: 'Art Class', emoji: '🎨' },
      { id: 'concert', name: 'Concert', emoji: '🎵' },
      { id: 'theater', name: 'Theater', emoji: '🎭' }
    ]
  },
  { 
    id: 'entertainment', 
    name: 'Entertainment', 
    emoji: '🎮',
    subcategories: [
      { id: 'game-night', name: 'Game Night', emoji: '🎮' },
      { id: 'movie', name: 'Movie', emoji: '🎬' },
      { id: 'karaoke', name: 'Karaoke', emoji: '🎤' },
      { id: 'escape-room', name: 'Escape Room', emoji: '🔍' }
    ]
  },
  { 
    id: 'networking', 
    name: 'Networking', 
    emoji: '🤝',
    subcategories: [
      { id: 'professional', name: 'Professional', emoji: '💼' },
      { id: 'social', name: 'Social', emoji: '🤝' },
      { id: 'industry', name: 'Industry Specific', emoji: '🏢' },
      { id: 'speed-networking', name: 'Speed Networking', emoji: '⚡' }
    ]
  },
  
  // Learning & Development
  { 
    id: 'workshop', 
    name: 'Workshops', 
    emoji: '🔨',
    subcategories: [
      { id: 'craft', name: 'Craft', emoji: '🧶' },
      { id: 'tech', name: 'Technology', emoji: '💻' },
      { id: 'business', name: 'Business', emoji: '📊' },
      { id: 'creative', name: 'Creative', emoji: '🎨' }
    ]
  },
  { 
    id: 'class', 
    name: 'Classes', 
    emoji: '📚',
    subcategories: [
      { id: 'language', name: 'Language', emoji: '🗣️' },
      { id: 'dance', name: 'Dance', emoji: '💃' },
      { id: 'music', name: 'Music', emoji: '🎵' },
      { id: 'fitness', name: 'Fitness', emoji: '🏃' }
    ]
  },
  
  // Community & Causes
  { 
    id: 'volunteer', 
    name: 'Volunteer', 
    emoji: '🤲',
    subcategories: [
      { id: 'environment', name: 'Environment', emoji: '🌱' },
      { id: 'animals', name: 'Animals', emoji: '🐾' },
      { id: 'community', name: 'Community', emoji: '🏘️' },
      { id: 'education', name: 'Education', emoji: '📚' }
    ]
  },
  
  // Legacy categories (for backward compatibility)
  { 
    id: 'education', 
    name: 'Education', 
    emoji: '📚',
    subcategories: [
      { id: 'lecture', name: 'Lecture', emoji: '🎤' },
      { id: 'seminar', name: 'Seminar', emoji: '📊' },
      { id: 'tutorial', name: 'Tutorial', emoji: '💻' }
    ]
  },
  { 
    id: 'food', 
    name: 'Food', 
    emoji: '🍽️',
    subcategories: [
      { id: 'restaurant', name: 'Restaurant', emoji: '🍽️' },
      { id: 'cooking', name: 'Cooking', emoji: '👨‍🍳' },
      { id: 'tasting', name: 'Tasting', emoji: '🍷' }
    ]
  },
  { 
    id: 'community', 
    name: 'Community', 
    emoji: '🏘️',
    subcategories: [
      { id: 'meetup', name: 'Meetup', emoji: '🤝' },
      { id: 'festival', name: 'Festival', emoji: '🎪' },
      { id: 'cleanup', name: 'Cleanup', emoji: '🧹' }
    ]
  }
];

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState(sampleEvents);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [invites, setInvites] = useState({});

  const handleToggleAttendance = (eventId) => {
    setEvents(prevEvents => {
      return prevEvents.map(event => {
        if (event.id === eventId) {
          if (event.attendees.includes('current-user')) {
            // Remove user from attendees
            return {
              ...event,
              attendees: event.attendees.filter(id => id !== 'current-user')
            };
          } else {
            // Add user to attendees
            return {
              ...event,
              attendees: [...event.attendees, 'current-user']
            };
          }
        }
        return event;
      });
    });
  };

  const handleAddEvent = (newEvent) => {
    setEvents(prevEvents => [...prevEvents, { ...newEvent, id: `event-${prevEvents.length + 1}` }]);
  };

  const selectEvent = (eventId) => {
    const event = events.find(e => e.id === eventId);
    setSelectedEvent(event);
  };

  const isUserWaitlisted = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event?.waitlist?.includes('current-user') || false;
  };

  // Helper functions
  const updateEvent = async (eventId, updatedEvent) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, updatedEvent);
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  };

  const findSimilarEvents = (eventId) => {
    const cancelledEvent = events.find(e => e.id === eventId);
    if (!cancelledEvent) return [];
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    return events
      .filter(e => 
        e.id !== eventId && 
        e.status !== 'cancelled' && 
        e.category === cancelledEvent.category &&
        new Date(e.date) > new Date() &&
        new Date(e.date) < thirtyDaysFromNow
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
  };

  const addNotification = async (notification) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        ...notification,
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error adding notification:', error);
      return false;
    }
  };

  const processRefund = async (userId, eventId) => {
    try {
      // In a real app, this would integrate with a payment processor
      console.log(`Processing refund for user ${userId} for event ${eventId}`);
      return true;
    } catch (error) {
      console.error('Error processing refund:', error);
      return false;
    }
  };

  const getEventStatus = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event?.status || 'pending';
  };

  const handleEditEvent = async (eventId, updates) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, updates);
      
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId ? { ...event, ...updates } : event
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error editing event:', error);
      return false;
    }
  };

  const value = {
    events,
    setEvents,
    selectedEvent,
    selectEvent,
    handleToggleAttendance,
    handleAddEvent,
    isUserWaitlisted,
    getDiscoverEvents: () => getDiscoverEvents(),
    getUserEvents: () => getUserEvents(),
    currentUser,
    loading,
    invites,
    setInvites,
    getWaitlistPosition: (eventId) => {
      const event = events.find(e => e.id === eventId);
      if (!event?.waitlist) return -1;
      return event.waitlist.indexOf('current-user') + 1;
    },
    eventCategories,
    getCategoryEmoji: (categoryId, subcategoryId = null) => {
      const category = eventCategories.find(cat => cat.id === categoryId);
      if (!category) return '📅';
      
      if (subcategoryId && category.subcategories) {
        const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
        return subcategory ? subcategory.emoji : category.emoji;
      }
      
      return category.emoji;
    },
    getCategoryName: (categoryId, subcategoryId = null) => {
      const category = eventCategories.find(cat => cat.id === categoryId);
      if (!category) return 'Other';
      
      if (subcategoryId && category.subcategories) {
        const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
        return subcategory ? subcategory.name : category.name;
      }
      
      return category.name;
    },
    findSimilarEvents,
    handleMinimumCapacityCancellation: async (eventId) => {
      const event = events.find(e => e.id === eventId);
      if (!event) return;
      
      const updatedEvent = {
        ...event,
        status: 'cancelled',
        cancellationReason: 'minimum_capacity_not_met'
      };
      
      await updateEvent(eventId, updatedEvent);
      
      const similarEvents = findSimilarEvents(eventId);
      
      const attendees = Object.entries(event.attendees || {})
        .filter(([_, status]) => status === 'attending')
        .map(([userId]) => userId);
      
      for (const userId of attendees) {
        const notification = {
          id: uuidv4(),
          userId,
          eventId,
          type: 'event_cancelled',
          title: `Event Cancelled: ${event.title}`,
          message: `The event "${event.title}" has been cancelled because it didn't meet the minimum capacity requirement.`,
          similarEvents: similarEvents.map(e => ({
            id: e.id,
            title: e.title,
            date: e.date,
            time: e.time,
            location: e.location
          })),
          createdAt: new Date().toISOString(),
          read: false
        };
        
        await addNotification(notification);
        
        await processRefund(userId, eventId);
      }
      
      setEvents(events.map(e => e.id === eventId ? updatedEvent : e));
      
      return {
        success: true,
        message: 'Event cancelled and attendees notified',
        similarEvents
      };
    },
    processRefund,
    transferUserToEvent: async (userId, fromEventId, toEventId) => {
      const fromEvent = events.find(e => e.id === fromEventId);
      const toEvent = events.find(e => e.id === toEventId);
      
      if (!fromEvent || !toEvent) {
        throw new Error('One or both events not found');
      }
      
      const currentAttendees = Object.values(toEvent.attendees || {}).filter(status => status === 'attending').length;
      if (currentAttendees >= toEvent.maxAttendees) {
        throw new Error('Target event is at capacity');
      }
      
      const updatedFromEvent = {
        ...fromEvent,
        attendees: {
          ...fromEvent.attendees,
          [userId]: 'cancelled'
        }
      };
      
      const updatedToEvent = {
        ...toEvent,
        attendees: {
          ...toEvent.attendees,
          [userId]: 'attending'
        }
      };
      
      await updateEvent(fromEventId, updatedFromEvent);
      await updateEvent(toEventId, updatedToEvent);
      
      const notification = {
        id: uuidv4(),
        userId,
        eventId: toEventId,
        type: 'event_transfer',
        title: `Transferred to: ${toEvent.title}`,
        message: `You have been transferred from "${fromEvent.title}" to "${toEvent.title}".`,
        createdAt: new Date().toISOString(),
        read: false
      };
      
      await addNotification(notification);
      
      setEvents(events.map(e => {
        if (e.id === fromEventId) return updatedFromEvent;
        if (e.id === toEventId) return updatedToEvent;
        return e;
      }));
      
      return {
        success: true,
        message: 'User transferred successfully'
      };
    },
    getEventStatus,
    getEventStatusText: (eventId) => {
      const status = getEventStatus(eventId);
      const event = events.find(e => e.id === eventId);
      
      if (!event) return 'Unknown';
      
      switch (status) {
        case 'pending':
          return `Pending (${Object.values(event.attendees || {}).filter(status => status === 'attending').length}/${event.minAttendees} minimum)`;
        case 'confirmed':
          return 'Confirmed';
        case 'cancelled':
          return 'Cancelled';
        case 'at-risk':
          return `At Risk (${Object.values(event.attendees || {}).filter(status => status === 'attending').length}/${event.minAttendees} minimum)`;
        case 'completed':
          return 'Completed';
        default:
          return 'Unknown';
      }
    },
    getEventStatusColor: (eventId) => {
      const status = getEventStatus(eventId);
      
      switch (status) {
        case 'pending':
          return 'text-yellow-600';
        case 'confirmed':
          return 'text-green-600';
        case 'cancelled':
          return 'text-red-600';
        case 'at-risk':
          return 'text-orange-600';
        case 'completed':
          return 'text-gray-600';
        default:
          return 'text-gray-600';
      }
    },
    handleToggleHost: (eventId, userId, isHost) => {
      const user = auth.currentUser;
      if (!user) return;

      setEvents(prevEvents => 
        prevEvents.map(event => {
          if (event.id !== eventId) return event;

          let updatedEvent = { ...event };
          
          if (isHost) {
            if (!event.hosts?.includes(userId)) {
              updatedEvent.hosts = [...(event.hosts || []), userId];
            }
          } else {
            updatedEvent.hosts = event.hosts?.filter(id => id !== userId) || [];
          }

          const viabilityResult = calculateEventViability(updatedEvent);
          updatedEvent.status = viabilityResult.status;
          updatedEvent.viabilityHistory = [
            ...(event.viabilityHistory || []),
            {
              timestamp: new Date().toISOString(),
              ...viabilityResult
            }
          ];

          return updatedEvent;
        })
      );
    },
    checkEventViability: (eventId) => {
      const event = events.find(e => e.id === eventId);
      if (!event) return null;

      const viabilityResult = calculateEventViability(event);
      
      handleEditEvent(eventId, {
        status: viabilityResult.status,
        lastViabilityCheck: new Date().toISOString(),
        viabilityHistory: [
          ...(event.viabilityHistory || []),
          {
            timestamp: new Date().toISOString(),
            ...viabilityResult
          }
        ]
      });

      return viabilityResult;
    },
    handleInviteUser: async (eventId, userId) => {
      try {
        const senderId = auth.currentUser?.uid || 'current-user';
        
        console.log(`Sending invite from ${senderId} to ${userId} for event ${eventId}`);
        
        toast.success('Invite sent successfully!');
        return true;
      } catch (error) {
        console.error('Error sending invite:', error);
        toast.error('Failed to send invite');
        return false;
      }
    },
    canEditEvent: (event) => {
      if (!event) return false;
      const currentUserId = currentUser?.uid || 'demo-user';
      return event.creatorId === currentUserId || (event.hosts && event.hosts.includes(currentUserId));
    },
    addNotification,
  };

  return (
    <EventContext.Provider value={value}>
      {!loading && children}
    </EventContext.Provider>
  );
}; 