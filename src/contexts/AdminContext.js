import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Analytics Dashboard Data
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeEvents: 0,
    partnerEvents: 0,
    recentActivity: [],
    quickStats: {
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0,
      averageEventAttendance: 0,
      averageEventRating: 0
    }
  });

  // Users Management Data
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Reports Data
  const [reports, setReports] = useState({
    userGrowth: [],
    eventMetrics: [],
    revenueData: [],
    categoryBreakdown: [],
    partnerPerformance: []
  });

  // Settings Data
  const [settings, setSettings] = useState({
    generalSettings: {
      siteName: 'Knock',
      supportEmail: 'support@knock.com',
      maxEventsPerUser: 10,
      maxAttendeesPerEvent: 100
    },
    notificationSettings: {
      enableEmailNotifications: true,
      enablePushNotifications: true,
      adminAlertThreshold: 50
    },
    securitySettings: {
      requireEmailVerification: true,
      twoFactorAuth: false,
      passwordMinLength: 8
    },
    featureFlags: {
      enablePartnerProgram: true,
      enableWaitlist: true,
      enableReviews: true
    }
  });

  // Function declarations
  const handlePartnerStatusChange = (userId) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? { 
              ...user, 
              isPartner: !user.isPartner,
              ...((!user.isPartner) ? {
                eventsHosted: 0,
                rating: 0,
                specialties: []
              } : {})
            }
          : user
      )
    );
  };

  const getPartners = () => {
    return users.filter(user => user.isPartner);
  };

  const updateSettings = (newSettings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  };

  // Event helper functions
  const getHostEvents = (hostName) => {
    return events.filter(event => event.host === hostName);
  };

  const getUpcomingEvents = () => {
    return events.filter(event => 
      new Date(event.date) > new Date() && event.status !== 'cancelled'
    );
  };

  const getPastEvents = () => {
    return events.filter(event => 
      new Date(event.date) < new Date() || event.status === 'cancelled'
    );
  };

  const getEventsByCategory = (category) => {
    return events.filter(event => event.category === category);
  };

  const getEventsByStatus = (status) => {
    return events.filter(event => event.status === status);
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Setting admin to true');
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const isUserAdmin = userDoc.data().role === 'admin' || userDoc.data().isAdmin === true;
            console.log('User admin status:', isUserAdmin);
            setIsAdmin(isUserAdmin);
          } else {
            console.log('User document not found');
            setIsAdmin(false);
          }
        } else {
          console.log('No current user');
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError(err.message);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [currentUser]);

  useEffect(() => {
    if (isAdmin) {
      // Analytics Mock Data
      const mockAnalytics = {
        totalUsers: 1234,
        activeEvents: 56,
        partnerEvents: 12,
        recentActivity: [
          {
            type: 'user',
            description: 'New user registration: Sarah Chen',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            details: { userId: 1, userType: 'partner' }
          },
          {
            type: 'event',
            description: 'Event reached capacity: Photography Workshop',
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
            details: { eventId: 1, host: 'Sarah Chen' }
          },
          {
            type: 'partner',
            description: 'Partner status granted: City Art Studio',
            timestamp: new Date(Date.now() - 1000 * 60 * 45),
            details: { partnerId: 6, category: 'Art' }
          },
          {
            type: 'event',
            description: 'New event created: Sunset Yoga by the Beach',
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            details: { eventId: 4, category: 'Fitness' }
          },
          {
            type: 'user',
            description: 'Partner application received: Michael Brown',
            timestamp: new Date(Date.now() - 1000 * 60 * 90),
            details: { userId: 2, category: 'Fitness' }
          }
        ],
        quickStats: {
          dailyActiveUsers: 245,
          weeklyActiveUsers: 876,
          monthlyActiveUsers: 2345,
          averageEventAttendance: 15.3,
          averageEventRating: 4.7
        }
      };

      // Reports Mock Data
      const mockReports = {
        userGrowth: [
          { month: 'Jan', users: 980 },
          { month: 'Feb', users: 1123 },
          { month: 'Mar', users: 1234 }
        ],
        eventMetrics: [
          { category: 'Photography', count: 25, avgAttendees: 18 },
          { category: 'Cooking', count: 15, avgAttendees: 12 },
          { category: 'Fitness', count: 20, avgAttendees: 15 },
          { category: 'Music', count: 10, avgAttendees: 8 },
          { category: 'Art', count: 18, avgAttendees: 20 }
        ],
        revenueData: [
          { month: 'Jan', revenue: 12500 },
          { month: 'Feb', revenue: 15600 },
          { month: 'Mar', revenue: 18900 }
        ],
        categoryBreakdown: [
          { name: 'Photography', percentage: 25 },
          { name: 'Cooking', percentage: 15 },
          { name: 'Fitness', percentage: 20 },
          { name: 'Music', percentage: 10 },
          { name: 'Art', percentage: 30 }
        ],
        partnerPerformance: [
          { 
            name: 'Sarah Chen',
            eventsHosted: 23,
            totalAttendees: 437,
            avgRating: 4.9,
            revenue: 15675
          },
          {
            name: 'Emma Rodriguez',
            eventsHosted: 15,
            totalAttendees: 180,
            avgRating: 4.7,
            revenue: 9750
          },
          {
            name: 'David Kim',
            eventsHosted: 8,
            totalAttendees: 64,
            avgRating: 4.8,
            revenue: 2880
          }
        ]
      };

      setAnalytics(mockAnalytics);
      setReports(mockReports);
    }
  }, [isAdmin]);

  useEffect(() => {
    try {
      const mockUsers = [
        {
          id: 1,
          name: 'Sarah Chen',
          email: 'sarah.chen@example.com',
          status: 'active',
          role: 'partner',
          joinDate: '2024-01-20',
          eventsHosted: 23,
          rating: 4.9,
          specialties: ['Photography', 'Digital Art'],
          location: 'San Francisco, CA',
          bio: 'Professional photographer and digital artist'
        },
        {
          id: 2,
          name: 'Michael Brown',
          email: 'michael.b@example.com',
          status: 'pending',
          role: 'user',
          joinDate: '2024-01-18',
          eventsHosted: 0,
          rating: 0,
          specialties: ['Fitness', 'Nutrition'],
          location: 'Los Angeles, CA',
          bio: 'Certified personal trainer and nutrition coach'
        },
        {
          id: 3,
          name: 'Emma Rodriguez',
          email: 'emma.r@example.com',
          status: 'active',
          role: 'partner',
          joinDate: '2024-01-15',
          eventsHosted: 15,
          rating: 4.7,
          specialties: ['Cooking', 'Baking'],
          location: 'Chicago, IL',
          bio: 'Pastry chef and culinary instructor'
        },
        {
          id: 4,
          name: 'David Kim',
          email: 'david.kim@example.com',
          status: 'active',
          role: 'partner',
          joinDate: '2024-01-12',
          eventsHosted: 8,
          rating: 4.8,
          specialties: ['Music', 'Guitar'],
          location: 'Seattle, WA',
          bio: 'Professional musician and music teacher'
        },
        {
          id: 5,
          name: 'Lisa Thompson',
          email: 'lisa.t@example.com',
          status: 'inactive',
          role: 'user',
          joinDate: '2024-01-10',
          eventsHosted: 3,
          rating: 4.5,
          specialties: ['Yoga', 'Meditation'],
          location: 'New York, NY',
          bio: 'Yoga instructor and wellness coach'
        }
      ];

      setUsers(mockUsers);
      setLoading(false);
    } catch (err) {
      setError('Failed to load admin data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const mockEvents = [
        {
          id: 1,
          title: 'Urban Photography Workshop',
          host: 'Sarah Chen',
          date: '2024-02-01T14:00',
          status: 'upcoming',
          attendees: 18,
          capacity: 20,
          location: 'San Francisco',
          price: 75,
          category: 'Photography',
          description: 'Learn urban photography techniques in the heart of SF',
          tags: ['beginner-friendly', 'outdoor', 'hands-on'],
          requirements: ['DSLR camera', 'Comfortable walking shoes'],
          includedItems: ['Photography guide book', 'Light refreshments'],
          reviews: [
            { user: 'John D.', rating: 5, comment: 'Excellent workshop! Sarah is a great teacher.' },
            { user: 'Maria L.', rating: 4, comment: 'Very informative and fun experience.' }
          ]
        },
        {
          id: 2,
          title: 'Artisan Bread Making',
          host: 'Emma Rodriguez',
          date: '2024-02-03T10:00',
          status: 'at-risk',
          attendees: 4,
          capacity: 12,
          location: 'Chicago',
          price: 65,
          category: 'Cooking',
          description: 'Master the art of baking artisan bread',
          tags: ['beginner-friendly', 'indoor', 'hands-on'],
          requirements: ['Apron', 'Container for bread'],
          includedItems: ['Ingredients', 'Recipe booklet'],
          reviews: []
        },
        {
          id: 3,
          title: 'Guitar for Beginners',
          host: 'David Kim',
          date: '2024-02-05T18:00',
          status: 'confirmed',
          attendees: 8,
          capacity: 8,
          location: 'Seattle',
          price: 45,
          category: 'Music',
          description: 'Start your musical journey with guitar basics',
          tags: ['beginner-friendly', 'indoor', 'hands-on'],
          requirements: ['Acoustic guitar', 'Notebook'],
          includedItems: ['Guitar picks', 'Sheet music'],
          reviews: [
            { user: 'Alex P.', rating: 5, comment: 'David is an amazing instructor!' }
          ]
        },
        {
          id: 4,
          title: 'Sunset Yoga by the Beach',
          host: 'Lisa Thompson',
          date: '2024-02-07T17:30',
          status: 'upcoming',
          attendees: 12,
          capacity: 15,
          location: 'Santa Monica',
          price: 25,
          category: 'Fitness',
          description: 'Relaxing yoga session with ocean views',
          tags: ['all-levels', 'outdoor', 'wellness'],
          requirements: ['Yoga mat', 'Water bottle'],
          includedItems: ['Beach towel', 'Post-yoga snack'],
          reviews: [
            { user: 'Sarah M.', rating: 5, comment: 'Perfect way to end the day!' },
            { user: 'Tom R.', rating: 4, comment: 'Beautiful location and great instruction.' }
          ]
        },
        {
          id: 5,
          title: 'Digital Art Masterclass',
          host: 'Sarah Chen',
          date: '2024-02-10T13:00',
          status: 'upcoming',
          attendees: 15,
          capacity: 25,
          location: 'Online',
          price: 55,
          category: 'Art',
          description: 'Create stunning digital artwork using Procreate',
          tags: ['intermediate', 'online', 'digital'],
          requirements: ['iPad with Procreate', 'Apple Pencil'],
          includedItems: ['Digital brush pack', 'Project files'],
          reviews: []
        },
        {
          id: 6,
          title: 'Advanced Photography Techniques',
          host: 'Sarah Chen',
          date: '2024-02-15T15:00',
          status: 'upcoming',
          attendees: 10,
          capacity: 15,
          location: 'San Francisco',
          price: 95,
          category: 'Photography',
          description: 'Advanced lighting and composition techniques',
          tags: ['advanced', 'outdoor', 'hands-on'],
          requirements: ['DSLR camera', 'External flash', 'Tripod'],
          includedItems: ['Lighting guide', 'Practice materials'],
          reviews: []
        },
        {
          id: 7,
          title: 'Sourdough Bread Workshop',
          host: 'Emma Rodriguez',
          date: '2024-02-17T09:00',
          status: 'upcoming',
          attendees: 6,
          capacity: 8,
          location: 'Chicago',
          price: 85,
          category: 'Cooking',
          description: 'Learn to make authentic sourdough bread',
          tags: ['intermediate', 'indoor', 'hands-on'],
          requirements: ['Apron', 'Large bowl', 'Container for starter'],
          includedItems: ['Sourdough starter', 'Recipe book'],
          reviews: []
        },
        {
          id: 8,
          title: 'Jazz Guitar Improvisation',
          host: 'David Kim',
          date: '2024-02-20T19:00',
          status: 'upcoming',
          attendees: 5,
          capacity: 10,
          location: 'Seattle',
          price: 65,
          category: 'Music',
          description: 'Master jazz guitar improvisation techniques',
          tags: ['advanced', 'indoor', 'hands-on'],
          requirements: ['Electric guitar', 'Amp', 'Audio interface'],
          includedItems: ['Jazz standards book', 'Backing tracks'],
          reviews: []
        }
      ];

      setEvents(mockEvents);
      setLoading(false);
    } catch (err) {
      setError('Failed to load admin data');
      setLoading(false);
    }
  }, []);

  // Create value object outside useEffect
  const value = {
    isAdmin,
    loading,
    error,
    analytics,
    users,
    events,
    reports,
    settings,
    setUsers,
    setEvents,
    handlePartnerStatusChange,
    getPartners,
    updateSettings,
    getHostEvents,
    getUpcomingEvents,
    getPastEvents,
    getEventsByCategory,
    getEventsByStatus
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext; 