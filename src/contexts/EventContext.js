import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../utils/firebase';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';

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

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState([
    // January 2025
    {
      id: '1',
      title: 'Sourdough Baking Workshop',
      description: 'Learn the art of sourdough bread making from scratch',
      date: '2025-01-05',
      time: '10:00',
      location: '1398 University Ave, Berkeley, CA 94702',
      coordinates: [-122.2830, 37.8697],
      emoji: '🍞',
      status: 'confirmed',
      maxAttendees: 15,
      minAttendees: 5,
      attendees: ['current-user', 'dummy-user-2', 'dummy-user-3'],
      hosts: ['host-1'],
      category: 'food',
      subcategory: 'cooking',
      registrationDeadline: '2025-01-04',
      cancellationDeadline: '2025-01-03',
      pricing: {
        standard: 45,
        earlyBird: 35
      },
      perks: {
        standard: ['Take home your own sourdough starter', 'Recipe booklet'],
        vip: []
      }
    },
    {
      id: '2',
      title: 'Urban Photography Walk',
      description: 'Capture the essence of SF architecture',
      date: '2025-01-05',
      time: '14:00',
      location: '600 Montgomery St, San Francisco, CA 94111',
      coordinates: [-122.4033, 37.7955],
      emoji: '📸',
      status: 'confirmed',
      maxAttendees: 12,
      minAttendees: 4,
      attendees: ['current-user', 'dummy-user-5', 'dummy-user-6'],
      hosts: ['host-2'],
      category: 'arts',
      subcategory: 'art-class',
      registrationDeadline: '2025-01-04',
      cancellationDeadline: '2025-01-03',
      pricing: {
        standard: 30,
        earlyBird: 25
      },
      perks: {
        standard: ['Professional photography tips', 'Best spots guide'],
        vip: []
      }
    },
    {
      id: '3',
      title: 'Jazz Night at Fox Theater',
      description: 'Evening of classic jazz and modern fusion',
      date: '2025-01-10',
      time: '19:30',
      location: '1807 Telegraph Ave, Oakland, CA 94612',
      coordinates: [-122.2710, 37.8080],
      emoji: '🎷',
      status: 'confirmed',
      maxAttendees: 30,
      minAttendees: 15,
      attendees: ['current-user', 'dummy-user-8', 'dummy-user-9'],
      hosts: ['host-3'],
      category: 'arts',
      subcategory: 'concert',
      registrationDeadline: '2025-01-09',
      cancellationDeadline: '2025-01-08',
      pricing: {
        standard: 65,
        vip: 120,
        earlyBird: 50,
        earlyBirdVip: 95
      },
      perks: {
        standard: ['Welcome drink', 'Program booklet'],
        vip: ['Meet the artists', 'VIP lounge access', 'Complimentary drinks']
      }
    },
    {
      id: '4',
      title: 'Sunset Yoga',
      description: 'Beachside yoga session',
      date: '2025-01-12',
      time: '17:00',
      location: '1000 Great Highway, San Francisco, CA 94121',
      coordinates: [-122.5092, 37.7697],
      emoji: '🧘‍♀️',
      status: 'upcoming',
      category: 'sports',
      subcategory: 'yoga',
      attendees: Array(15).fill('dummy-user'),
    },
    {
      id: '5',
      title: 'Tech Meetup',
      description: 'AI and Machine Learning discussion',
      date: '2025-01-15',
      time: '18:30',
      location: '375 Alabama St, San Francisco, CA 94110',
      coordinates: [-122.4127, 37.7641],
      emoji: '🤖',
      status: 'upcoming',
      category: 'networking',
      subcategory: 'professional',
      attendees: Array(40).fill('dummy-user'),
    },
    // February 2025
    {
      id: '6',
      title: 'Valentine\'s Chocolate Making',
      description: 'Create artisanal chocolates',
      date: '2025-02-13',
      time: '15:00',
      location: '900 North Point St, San Francisco, CA 94109',
      coordinates: [-122.4229, 37.8055],
      emoji: '🍫',
      status: 'upcoming',
      category: 'food',
      subcategory: 'cooking',
      attendees: Array(20).fill('dummy-user'),
    },
    {
      id: '7',
      title: 'Lunar New Year Festival',
      description: 'Celebrate the Year of the Snake',
      date: '2025-02-15',
      time: '11:00',
      location: '731 Grant Ave, San Francisco, CA 94108',
      coordinates: [-122.4062, 37.7939],
      emoji: '🐍',
      status: 'upcoming',
      category: 'community',
      subcategory: 'festival',
      attendees: Array(100).fill('dummy-user'),
    },
    {
      id: '8',
      title: 'Wine Tasting Evening',
      description: 'Napa Valley wine exploration',
      date: '2025-02-20',
      time: '18:00',
      location: '855 El Camino Real, Palo Alto, CA 94301',
      coordinates: [-122.1082, 37.4380],
      emoji: '🍷',
      status: 'upcoming',
      category: 'drinks',
      subcategory: 'wine-tasting',
      attendees: Array(30).fill('dummy-user'),
    },
    // March 2025
    {
      id: '9',
      title: 'Spring Garden Workshop',
      description: 'Learn sustainable gardening practices',
      date: '2025-03-01',
      time: '09:00',
      location: '1000 El Camino Real, San Bruno, CA 94066',
      coordinates: [-122.4430, 37.6305],
      emoji: '🌱',
      status: 'upcoming',
      category: 'workshop',
      subcategory: 'craft',
      attendees: Array(25).fill('dummy-user'),
    },
    {
      id: '10',
      title: 'St. Patrick\'s Day Run',
      description: '5K fun run through Golden Gate Park',
      date: '2025-03-17',
      time: '08:00',
      location: '501 Stanyan St, San Francisco, CA 94117',
      coordinates: [-122.4759, 37.7726],
      emoji: '🍀',
      status: 'upcoming',
      category: 'sports',
      subcategory: 'team-sport',
      attendees: Array(150).fill('dummy-user'),
    },
    {
      id: '26',
      title: 'Spring Gardening Workshop',
      description: 'Learn about spring planting',
      date: '2025-03-05',
      time: '10:00',
      location: '1199 9th Ave, San Francisco, CA 94122',
      coordinates: [-122.4663, 37.7654],
      emoji: '🌱',
      status: 'upcoming',
      category: 'workshop',
      subcategory: 'craft',
      attendees: Array(30).fill('dummy-user'),
    },
    {
      id: '27',
      title: 'March Madness Watch Party',
      description: 'Basketball tournament viewing',
      date: '2025-03-15',
      time: '17:00',
      location: '170 Columbus Ave, San Francisco, CA 94133',
      coordinates: [-122.4059, 37.7969],
      emoji: '🏀',
      status: 'upcoming',
      category: 'entertainment',
      subcategory: 'game-night',
      attendees: Array(75).fill('dummy-user'),
    },
    {
      id: '28',
      title: 'St. Patrick\'s Day Parade',
      description: 'Annual Irish celebration',
      date: '2025-03-17',
      time: '11:00',
      location: 'Market St, San Francisco, CA 94102',
      coordinates: [-122.4194, 37.7793],
      emoji: '☘️',
      status: 'upcoming',
      category: 'community',
      subcategory: 'festival',
      attendees: Array(1000).fill('dummy-user'),
    },
    // April 2025
    {
      id: '11',
      title: 'Cherry Blossom Festival',
      description: 'Annual celebration in Japantown',
      date: '2025-04-05',
      time: '10:00',
      location: '1610 Geary Blvd, San Francisco, CA 94115',
      coordinates: [-122.4299, 37.7845],
      emoji: '🌸',
      status: 'upcoming',
      category: 'community',
      subcategory: 'festival',
      attendees: Array(200).fill('dummy-user'),
    },
    {
      id: '29',
      title: 'Cherry Blossom Festival',
      description: 'Japanese cultural celebration',
      date: '2025-04-05',
      time: '10:00',
      location: 'Japantown Peace Plaza, San Francisco, CA 94115',
      coordinates: [-122.4294, 37.7851],
      emoji: '🌸',
      status: 'upcoming',
      attendees: Array(800).fill('dummy-user'),
    },
    {
      id: '30',
      title: 'Earth Day Clean-up',
      description: 'Community beach cleaning',
      date: '2025-04-22',
      time: '09:00',
      location: 'Baker Beach, San Francisco, CA 94129',
      coordinates: [-122.4798, 37.7933],
      emoji: '🌍',
      status: 'upcoming',
      attendees: Array(150).fill('dummy-user'),
    },
    // May 2025
    {
      id: '13',
      title: 'Bay to Breakers',
      description: 'Annual city-wide running event',
      date: '2025-05-18',
      time: '07:00',
      location: '587 Howard St, San Francisco, CA 94105',
      coordinates: [-122.3975, 37.7873],
      emoji: '🏃',
      status: 'upcoming',
      attendees: Array(500).fill('dummy-user'),
    },
    {
      id: '31',
      title: 'Bay to Breakers',
      description: 'Annual city-wide race',
      date: '2025-05-18',
      time: '08:00',
      location: 'Howard St & Main St, San Francisco, CA 94105',
      coordinates: [-122.3927, 37.7896],
      emoji: '🏃',
      status: 'upcoming',
      attendees: Array(2000).fill('dummy-user'),
    },
    {
      id: '14',
      title: 'Memorial Day BBQ',
      description: 'Community gathering and grilling',
      date: '2025-05-26',
      time: '12:00',
      location: '50 Hagiwara Tea Garden Dr, San Francisco, CA 94118',
      coordinates: [-122.4702, 37.7702],
      emoji: '🍖',
      status: 'upcoming',
      attendees: Array(100).fill('dummy-user'),
    },
    {
      id: '32',
      title: 'Wine Tasting Evening',
      description: 'Napa Valley wines showcase',
      date: '2025-05-25',
      time: '18:00',
      location: 'Ferry Building, San Francisco, CA 94111',
      coordinates: [-122.3934, 37.7956],
      emoji: '🍷',
      status: 'upcoming',
      attendees: Array(100).fill('dummy-user'),
    },
    // June 2025
    {
      id: '15',
      title: 'Pride Parade',
      description: 'Annual LGBTQ+ celebration',
      date: '2025-06-29',
      time: '11:00',
      location: 'Market St & Castro St, San Francisco, CA 94114',
      coordinates: [-122.4350, 37.7620],
      emoji: '🌈',
      status: 'upcoming',
      attendees: Array(1000).fill('dummy-user'),
    },
    {
      id: '33',
      title: 'Pride Parade',
      description: 'LGBTQ+ celebration',
      date: '2025-06-29',
      time: '11:00',
      location: 'Market St & Castro St, San Francisco, CA 94114',
      coordinates: [-122.4350, 37.7620],
      emoji: '🌈',
      status: 'upcoming',
      attendees: Array(5000).fill('dummy-user'),
    },
    {
      id: '34',
      title: 'Summer Solstice Festival',
      description: 'Music and art celebration',
      date: '2025-06-21',
      time: '16:00',
      location: 'Golden Gate Park, San Francisco, CA 94122',
      coordinates: [-122.4862, 37.7694],
      emoji: '☀️',
      status: 'upcoming',
      attendees: Array(300).fill('dummy-user'),
    },
    // July 2025
    {
      id: '16',
      title: 'Fourth of July Fireworks',
      description: 'Independence Day celebration',
      date: '2025-07-04',
      time: '21:00',
      location: 'Pier 39, San Francisco, CA 94133',
      coordinates: [-122.4103, 37.8087],
      emoji: '🎆',
      status: 'upcoming',
      attendees: Array(5000).fill('dummy-user'),
    },
    // More regular events spread across months
    {
      id: '17',
      title: 'Weekly Meditation',
      description: 'Guided meditation session',
      date: '2025-01-07',
      time: '07:00',
      location: '3140 22nd St, San Francisco, CA 94110',
      coordinates: [-122.4147, 37.7555],
      emoji: '🧘',
      status: 'upcoming',
      category: 'sports',
      subcategory: 'yoga',
      attendees: Array(15).fill('dummy-user'),
    },
    {
      id: '18',
      title: 'Coding Workshop',
      description: 'Learn Python basics',
      date: '2025-01-08',
      time: '18:00',
      location: '375 Alabama St, San Francisco, CA 94110',
      coordinates: [-122.4127, 37.7641],
      emoji: '💻',
      status: 'upcoming',
      category: 'workshop',
      subcategory: 'tech',
      attendees: Array(20).fill('dummy-user'),
    },
    {
      id: '19',
      title: 'Farmers Market',
      description: 'Local produce and artisanal goods',
      date: '2025-01-11',
      time: '08:00',
      location: 'Ferry Building, San Francisco, CA 94111',
      coordinates: [-122.3934, 37.7956],
      emoji: '🥕',
      status: 'upcoming',
      category: 'food',
      subcategory: 'food-tour',
      attendees: Array(200).fill('dummy-user'),
    },
    {
      id: '20',
      title: 'Salsa Dance Class',
      description: 'Beginner-friendly dance lessons',
      date: '2025-01-14',
      time: '19:00',
      location: '768 Brannan St, San Francisco, CA 94103',
      coordinates: [-122.4033, 37.7724],
      emoji: '💃',
      status: 'upcoming',
      category: 'class',
      subcategory: 'dance',
      attendees: Array(30).fill('dummy-user'),
    },
    // Weekly events for multiple months
    {
      id: '21',
      title: 'Morning Yoga',
      description: 'Start your day with yoga',
      date: '2025-02-04',
      time: '07:00',
      location: '3140 22nd St, San Francisco, CA 94110',
      coordinates: [-122.4147, 37.7555],
      emoji: '🧘',
      status: 'upcoming',
      category: 'sports',
      subcategory: 'yoga',
      attendees: Array(15).fill('dummy-user'),
    },
    {
      id: '22',
      title: 'Poetry Reading',
      description: 'Local poets share their work',
      date: '2025-02-06',
      time: '19:00',
      location: '3316 24th St, San Francisco, CA 94110',
      coordinates: [-122.4155, 37.7524],
      emoji: '📚',
      status: 'upcoming',
      category: 'class',
      subcategory: 'language',
      attendees: Array(25).fill('dummy-user'),
    },
    {
      id: '23',
      title: 'Board Game Night',
      description: 'Strategic games and fun',
      date: '2025-02-08',
      time: '18:00',
      location: '1 Sausalito - San Francisco Ferry Bldg, San Francisco, CA 94111',
      coordinates: [-122.3932, 37.7955],
      emoji: '🎲',
      status: 'upcoming',
      category: 'entertainment',
      subcategory: 'game-night',
      attendees: Array(40).fill('dummy-user'),
    },
    {
      id: '24',
      title: 'Pottery Workshop',
      description: 'Learn wheel throwing basics',
      date: '2025-02-10',
      time: '14:00',
      location: '728 Post St, San Francisco, CA 94109',
      coordinates: [-122.4147, 37.7874],
      emoji: '🏺',
      status: 'upcoming',
      category: 'workshop',
      subcategory: 'craft',
      attendees: Array(12).fill('dummy-user'),
    },
    {
      id: '25',
      title: 'Cooking Class: Italian',
      description: 'Make authentic pasta from scratch',
      date: '2025-02-12',
      time: '17:00',
      location: '59 Grand Ave, South San Francisco, CA 94080',
      coordinates: [-122.4076, 37.6547],
      emoji: '🍝',
      status: 'upcoming',
      category: 'food',
      subcategory: 'cooking',
      attendees: Array(15).fill('dummy-user'),
    },
    // Continue adding events through July...
    {
      id: '95',
      title: 'Watercolor Painting',
      description: 'Learn watercolor techniques',
      date: '2025-07-15',
      time: '13:00',
      location: '50 Hagiwara Tea Garden Dr, San Francisco, CA 94118',
      coordinates: [-122.4702, 37.7702],
      emoji: '🎨',
      status: 'upcoming',
      category: 'workshop',
      subcategory: 'craft',
      attendees: Array(20).fill('dummy-user'),
    },
    {
      id: '96',
      title: 'Summer Food Festival',
      description: 'Celebrate local cuisine',
      date: '2025-07-18',
      time: '11:00',
      location: 'Fort Mason Center, San Francisco, CA 94123',
      coordinates: [-122.4279, 37.8074],
      emoji: '🍴',
      status: 'upcoming',
      category: 'food',
      subcategory: 'food-tour',
      attendees: Array(500).fill('dummy-user'),
    },
    {
      id: '97',
      title: 'Sunset Photography Workshop',
      description: 'Capture the golden hour',
      date: '2025-07-20',
      time: '18:00',
      location: 'Twin Peaks Summit, San Francisco, CA 94131',
      coordinates: [-122.4477, 37.7544],
      emoji: '📸',
      status: 'upcoming',
      category: 'arts',
      subcategory: 'art-class',
      attendees: Array(15).fill('dummy-user'),
    },
    {
      id: '98',
      title: 'Urban Sketching',
      description: 'Drawing the city landscape',
      date: '2025-07-22',
      time: '14:00',
      location: 'Palace of Fine Arts, San Francisco, CA 94123',
      coordinates: [-122.4484, 37.8029],
      emoji: '✏️',
      status: 'upcoming',
      category: 'arts',
      subcategory: 'art-class',
      attendees: Array(20).fill('dummy-user'),
    },
    {
      id: '99',
      title: 'Summer Concert Series',
      description: 'Live music in the park',
      date: '2025-07-25',
      time: '18:00',
      location: '100 John F Kennedy Dr, San Francisco, CA 94118',
      coordinates: [-122.4584, 37.7694],
      emoji: '🎸',
      status: 'upcoming',
      category: 'arts',
      subcategory: 'concert',
      attendees: Array(300).fill('dummy-user'),
    },
    {
      id: '100',
      title: 'Sunset Silent Disco',
      description: 'Dance party at Ocean Beach',
      date: '2025-07-31',
      time: '19:00',
      location: '1000 Great Highway, San Francisco, CA 94121',
      coordinates: [-122.5092, 37.7697],
      emoji: '🎧',
      status: 'upcoming',
      category: 'entertainment',
      subcategory: 'game-night',
      attendees: Array(150).fill('dummy-user'),
    },
    // July Events
    {
      id: '35',
      title: 'Fourth of July Fireworks',
      description: 'Independence Day celebration',
      date: '2025-07-04',
      time: '21:00',
      location: 'Pier 39, San Francisco, CA 94133',
      coordinates: [-122.4103, 37.8087],
      emoji: '🎆',
      status: 'upcoming',
      category: 'entertainment',
      subcategory: 'game-night',
      attendees: Array(3000).fill('dummy-user'),
    },
    {
      id: '36',
      title: 'Summer Jazz Festival',
      description: 'Live jazz performances',
      date: '2025-07-12',
      time: '14:00',
      location: 'Union Square, San Francisco, CA 94108',
      coordinates: [-122.4074, 37.7879],
      emoji: '🎷',
      status: 'upcoming',
      category: 'arts',
      subcategory: 'concert',
      attendees: Array(500).fill('dummy-user'),
    },
    // August Events
    {
      id: '37',
      title: 'Outside Lands Music Festival',
      description: 'Annual music and arts festival',
      date: '2025-08-08',
      time: '12:00',
      location: 'Golden Gate Park, San Francisco, CA 94122',
      coordinates: [-122.4862, 37.7694],
      emoji: '🎸',
      status: 'upcoming',
      category: 'arts',
      subcategory: 'concert',
      attendees: Array(10000).fill('dummy-user'),
    },
    {
      id: '38',
      title: 'SF Street Food Festival',
      description: 'Local food vendors showcase',
      date: '2025-08-16',
      time: '11:00',
      location: 'Mission District, San Francisco, CA 94110',
      coordinates: [-122.4194, 37.7601],
      emoji: '🌮',
      status: 'upcoming',
      category: 'food',
      subcategory: 'food-tour',
      attendees: Array(2000).fill('dummy-user'),
    },
    // September Events
    {
      id: '39',
      title: 'Labor Day Parade',
      description: 'Community celebration',
      date: '2025-09-01',
      time: '10:00',
      location: 'Fisherman\'s Wharf, San Francisco, CA 94133',
      coordinates: [-122.4169, 37.8080],
      emoji: '🚶',
      status: 'upcoming',
      category: 'community',
      subcategory: 'festival',
      attendees: Array(1500).fill('dummy-user'),
    },
    {
      id: '40',
      title: 'Autumn Moon Festival',
      description: 'Traditional Asian celebration',
      date: '2025-09-13',
      time: '16:00',
      location: 'Chinatown, San Francisco, CA 94108',
      coordinates: [-122.4064, 37.7941],
      emoji: '🌕',
      status: 'upcoming',
      category: 'community',
      subcategory: 'festival',
      attendees: Array(1200).fill('dummy-user'),
    },
    // October Events
    {
      id: '41',
      title: 'Halloween Parade',
      description: 'Costume parade and contest',
      date: '2025-10-31',
      time: '18:00',
      location: 'Castro District, San Francisco, CA 94114',
      coordinates: [-122.4350, 37.7620],
      emoji: '🎃',
      status: 'upcoming',
      category: 'community',
      subcategory: 'festival',
      attendees: Array(2500).fill('dummy-user'),
    },
    {
      id: '42',
      title: 'Fall Wine Festival',
      description: 'Wine tasting event',
      date: '2025-10-18',
      time: '15:00',
      location: 'Fort Mason Center, San Francisco, CA 94123',
      coordinates: [-122.4279, 37.8064],
      emoji: '🍷',
      status: 'upcoming',
      category: 'drinks',
      subcategory: 'wine-tasting',
      attendees: Array(800).fill('dummy-user'),
    },
    // November Events
    {
      id: '43',
      title: 'Veterans Day Ceremony',
      description: 'Honor ceremony',
      date: '2025-11-11',
      time: '11:00',
      location: 'Presidio, San Francisco, CA 94129',
      coordinates: [-122.4662, 37.7989],
      emoji: '🎖️',
      status: 'upcoming',
      category: 'community',
      subcategory: 'festival',
      attendees: Array(500).fill('dummy-user'),
    },
    {
      id: '44',
      title: 'Thanksgiving Turkey Trot',
      description: '5K charity run',
      date: '2025-11-27',
      time: '08:00',
      location: 'Golden Gate Park, San Francisco, CA 94122',
      coordinates: [-122.4862, 37.7694],
      emoji: '🦃',
      status: 'upcoming',
      category: 'sports',
      subcategory: 'team-sport',
      attendees: Array(1000).fill('dummy-user'),
    },
    // December Events
    {
      id: '45',
      title: 'Holiday Ice Skating',
      description: 'Winter wonderland',
      date: '2025-12-15',
      time: '12:00',
      location: 'Union Square, San Francisco, CA 94108',
      coordinates: [-122.4074, 37.7879],
      emoji: '⛸️',
      status: 'upcoming',
      category: 'sports',
      subcategory: 'team-sport',
      attendees: Array(300).fill('dummy-user'),
    },
    {
      id: '46',
      title: 'New Year\'s Eve Fireworks',
      description: 'Countdown celebration',
      date: '2025-12-31',
      time: '23:00',
      location: 'Embarcadero, San Francisco, CA 94111',
      coordinates: [-122.3968, 37.7955],
      emoji: '🎉',
      status: 'upcoming',
      category: 'entertainment',
      subcategory: 'game-night',
      attendees: Array(5000).fill('dummy-user'),
    },
  ]);
  
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

  const handleAddEvent = (eventData) => {
    const newEvent = {
      id: uuidv4(),
      title: eventData.title,
      description: eventData.description,
      date: eventData.date,
      time: eventData.time,
      location: eventData.location,
      coordinates: eventData.coordinates,
      category: eventData.category,
      subcategory: eventData.subcategory,
      emoji: eventData.emoji,
      maxAttendees: eventData.maxAttendees,
      vipSpots: eventData.vipSpots || 0,
      groupMaxSize: eventData.groupMaxSize,
      registrationDeadline: eventData.registrationDeadline,
      cancellationDeadline: eventData.cancellationDeadline,
      minAttendees: eventData.minAttendees,
      confirmationDeadline: eventData.confirmationDeadline,
      status: 'pending',
      attendees: [],
      waitlist: [],
      waitlistGroups: [],
      vipList: [],
      eventType: eventData.eventType || 'standard',
      vipRequirements: eventData.vipRequirements || null,
      partnerInfo: eventData.partnerInfo || null,
      accessControl: eventData.accessControl || {
        type: 'public',
        requiredBadges: [],
        minPoints: 0,
        inviteList: [],
      },
      pricing: eventData.pricing || {
        standard: 0,
        vip: 0,
        earlyBird: 0,
        earlyBirdVip: 0,
        earlyBirdDeadline: null,
      },
      perks: eventData.perks || {
        standard: [],
        vip: [],
      },
      hosts: [],
      requiredHosts: eventData.requiredHosts || 1,
      viabilityHistory: [],
      lastViabilityCheck: null
    };

    // Initial viability check
    const viabilityResult = calculateEventViability(newEvent);
    newEvent.status = viabilityResult.status;
    newEvent.viabilityHistory = [{
      timestamp: new Date().toISOString(),
      ...viabilityResult
    }];

    setEvents(prevEvents => [...prevEvents, newEvent]);
    return newEvent;
  };

  const handleEditEvent = (eventId, eventData) => {
    setEvents(prevEvents => 
      prevEvents.map(event => {
        if (event.id !== eventId) return event;

        const updatedEvent = {
          ...event,
          ...eventData,
          requiredHosts: eventData.requiredHosts || event.requiredHosts || 1
        };

        // Recalculate viability after changes
        const viabilityResult = calculateEventViability(updatedEvent);
        
        // If status changed, add to history and notify
        if (viabilityResult.status !== event.status) {
          updatedEvent.viabilityHistory = [
            ...(event.viabilityHistory || []),
            {
              timestamp: new Date().toISOString(),
              ...viabilityResult
            }
          ];

          // Notify relevant parties
          switch (viabilityResult.status) {
            case 'confirmed':
              notifyEventConfirmed(updatedEvent);
              break;
            case 'at-risk':
              notifyEventAtRisk(updatedEvent);
              break;
            case 'cancelled':
              notifyEventCancelled(updatedEvent);
              break;
            default:
              break;
          }
        }

        updatedEvent.status = viabilityResult.status;
        updatedEvent.lastViabilityCheck = new Date().toISOString();

        return updatedEvent;
      })
    );
  };

  const notifyEventUpdate = (oldEvent, newEvent) => {
    // Simulate notification to all attendees
    const changes = [];
    if (oldEvent.date !== newEvent.date) changes.push('date');
    if (oldEvent.time !== newEvent.time) changes.push('time');
    if (oldEvent.location !== newEvent.location) changes.push('location');
    
    toast.success(
      `Event updated! Notifying ${oldEvent.attendees.length} attendees about changes to: ${changes.join(', ')}`
    );
  };

  const notifyEventAtRisk = (event) => {
    // Simulate notification to all attendees
    toast.warning(
      `Event "${event.title}" is at risk of cancellation! Notifying ${event.attendees.length} attendees.`
    );
  };

  const notifyEventConfirmed = (event) => {
    // Simulate notification to all attendees
    toast.success(
      `Event "${event.title}" is now confirmed! Notifying ${event.attendees.length} attendees.`
    );
  };

  const notifyEventCancelled = (event) => {
    // Simulate notification to all attendees
    toast.error(
      `Event "${event.title}" has been cancelled due to insufficient attendees. Notifying ${event.attendees.length} attendees.`
    );
  };

  const handleDeleteEvent = (eventId) => {
    if (selectedEvent?.id === eventId) {
      setSelectedEvent(null);
    }
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
  };

  const handleToggleAttendance = (eventId, groupSize = 1) => {
    if (!currentUser) {
      toast.error('Please sign in to attend events');
      return;
    }

    setEvents(prevEvents => {
      const updatedEvents = prevEvents.map(event => {
        if (event.id !== eventId) return event;

        // Check if event registration is closed
        if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
          toast.error('Registration for this event has closed');
          return event;
        }

        const attendees = event.attendees || [];
        const waitlist = event.waitlist || [];
        const waitlistGroups = event.waitlistGroups || [];
        const isAttending = attendees.includes(currentUser.uid);
        const isWaitlisted = waitlist.includes(currentUser.uid);

        // Handle leaving the event
        if (isAttending) {
          // Check cancellation deadline
          if (event.cancellationDeadline && new Date(event.cancellationDeadline) < new Date()) {
            toast.error('Cancellation deadline has passed');
            return event;
          }

          const newAttendees = attendees.filter(id => id !== currentUser.uid);
          const wasConfirmed = event.status === 'confirmed';
          
          // Check if event is now at risk or cancelled
          let newStatus = event.status;
          if (wasConfirmed && newAttendees.length < event.minAttendees) {
            newStatus = 'at-risk';
            notifyEventAtRisk({
              ...event,
              attendees: newAttendees
            });
          }

          toast.success('Successfully cancelled attendance');
          return {
            ...event,
            attendees: newAttendees,
            status: newStatus
          };
        }
        
        // Handle leaving waitlist
        if (isWaitlisted) {
          toast.success('Successfully left waitlist');
          return {
            ...event,
            waitlist: waitlist.filter(id => id !== currentUser.uid),
            waitlistGroups: waitlistGroups.filter(g => !g.userIds?.includes(currentUser.uid))
          };
        }

        // Handle joining the event
        const spotsAvailable = event.maxAttendees - attendees.length;
        
        if (spotsAvailable >= groupSize) {
          let newStatus = event.status;
          if (event.status === 'pending' && attendees.length + groupSize >= event.minAttendees) {
            newStatus = 'confirmed';
            notifyEventConfirmed(event);
          }
          
          toast.success('Successfully joined event');
          return {
            ...event,
            attendees: [...attendees, currentUser.uid],
            status: newStatus
          };
        } else {
          // Add to waitlist
          if (groupSize > 1) {
            const groupId = uuidv4();
            toast.success(`Added group of ${groupSize} to waitlist`);
            return {
              ...event,
              waitlist: [...waitlist, currentUser.uid],
              waitlistGroups: [...waitlistGroups, {
                groupId,
                userIds: [currentUser.uid],
                size: groupSize
              }]
            };
          }
          
          toast.success('Added to waitlist');
          return {
            ...event,
            waitlist: [...waitlist, currentUser.uid]
          };
        }
      });

      return [...updatedEvents];
    });
  };

  const isUserAttending = (eventId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return false;

    const event = events.find(e => e.id === eventId);
    return event?.attendees?.includes(userId) || false;
  };

  const isUserWaitlisted = (eventId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return false;

    const event = events.find(e => e.id === eventId);
    return event?.waitlist?.includes(userId) || false;
  };

  const getEventAttendeeCount = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event?.attendees?.length || 0;
  };

  const getEventWaitlistCount = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event?.waitlist?.length || 0;
  };

  const getWaitlistPosition = (eventId) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return -1;

    const event = events.find(e => e.id === eventId);
    if (!event?.waitlist) return -1;

    return event.waitlist.indexOf(userId) + 1;
  };

  const updateEvent = (eventId, updates) => {
    setEvents(prevEvents => {
      const eventIndex = prevEvents.findIndex(e => e.id === eventId);
      if (eventIndex === -1) return prevEvents;

      const event = prevEvents[eventIndex];
      const updatedEvent = { ...event, ...updates };

      // Handle capacity increase
      if (updates.maxAttendees && updates.maxAttendees > event.maxAttendees) {
        const capacityIncrease = updates.maxAttendees - event.maxAttendees;
        const currentAttendees = event.attendees.length;
        const currentWaitlist = event.waitlist.length;

        // If registration is closed but capacity increased
        const isRegistrationClosed = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();
        
        if (isRegistrationClosed) {
          // If there are waitlisted users, promote them first
          if (currentWaitlist > 0) {
            const usersToPromote = Math.min(capacityIncrease, currentWaitlist);
            const promotedUsers = event.waitlist.slice(0, usersToPromote);
            
            // Update attendees and waitlist
            updatedEvent.attendees = [...event.attendees, ...promotedUsers];
            updatedEvent.waitlist = event.waitlist.slice(usersToPromote);
            
            // Notify promoted users (this would be implemented in a notification system)
            promotedUsers.forEach(userId => {
              console.log(`Notifying user ${userId} they have been promoted from waitlist`);
            });
          }
        }
      }

      // Handle registration deadline changes
      if (updates.registrationDeadline) {
        const newDeadline = new Date(updates.registrationDeadline);
        const oldDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
        
        // If registration is being reopened (deadline extended)
        if (oldDeadline && newDeadline > oldDeadline && newDeadline > new Date()) {
          // Notify waitlisted users that registration is open
          event.waitlist.forEach(userId => {
            console.log(`Notifying waitlisted user ${userId} that registration is open`);
          });
        }
      }

      const newEvents = [...prevEvents];
      newEvents[eventIndex] = updatedEvent;
      return newEvents;
    });
  };

  // Add notification function
  const addNotification = async (notification) => {
    // In a real application, this would save to a database
    console.log('Adding notification:', notification);
    
    // For now, we'll just log it
    return notification;
  };

  // Check event statuses periodically
  const checkEventStatuses = async () => {
    const now = new Date();
    const updatedEvents = [...events];
    let hasChanges = false;

    for (let i = 0; i < updatedEvents.length; i++) {
      const event = updatedEvents[i];
      const eventDate = new Date(event.date);
      const registrationDeadline = new Date(event.registrationDeadline);
      const confirmationDeadline = new Date(event.confirmationDeadline);
      
      // Skip already cancelled events
      if (event.status === 'cancelled') continue;
      
      // Check if event has passed
      if (eventDate < now) {
        if (event.status !== 'completed') {
          updatedEvents[i] = { ...event, status: 'completed' };
          hasChanges = true;
        }
        continue;
      }
      
      // Check if registration deadline has passed
      if (registrationDeadline < now && event.status === 'pending') {
        // Count current attendees
        const attendeeCount = Object.values(event.attendees || {})
          .filter(status => status === 'attending').length;
        
        // Check if minimum attendees requirement is met
        if (attendeeCount < event.minAttendees) {
          // Event didn't meet minimum capacity - cancel it
          console.log(`Event ${event.id} didn't meet minimum capacity requirement. Cancelling...`);
          await handleMinimumCapacityCancellation(event.id);
          hasChanges = true;
        } else {
          // Event meets minimum capacity - confirm it
          updatedEvents[i] = { ...event, status: 'confirmed' };
          hasChanges = true;
          
          // Notify attendees of confirmation
          const attendees = Object.entries(event.attendees || {})
            .filter(([_, status]) => status === 'attending')
            .map(([userId]) => userId);
          
          for (const userId of attendees) {
            const notification = {
              id: uuidv4(),
              userId,
              eventId: event.id,
              type: 'event_confirmed',
              title: `Event Confirmed: ${event.title}`,
              message: `Good news! The event "${event.title}" has been confirmed and will proceed as scheduled.`,
              createdAt: new Date().toISOString(),
              read: false
            };
            
            await addNotification(notification);
          }
        }
      }
      
      // Check if confirmation deadline has passed
      if (confirmationDeadline < now && event.status === 'pending') {
        // Count current attendees
        const attendeeCount = Object.values(event.attendees || {})
          .filter(status => status === 'attending').length;
        
        // Check if minimum attendees requirement is met
        if (attendeeCount < event.minAttendees) {
          // Event didn't meet minimum capacity - cancel it
          console.log(`Event ${event.id} didn't meet minimum capacity requirement by confirmation deadline. Cancelling...`);
          await handleMinimumCapacityCancellation(event.id);
          hasChanges = true;
        }
      }
      
      // Check if event is at risk
      if (event.status === 'pending' && registrationDeadline > now) {
        // Count current attendees
        const attendeeCount = Object.values(event.attendees || {})
          .filter(status => status === 'attending').length;
        
        // Calculate days until registration deadline
        const daysUntilDeadline = Math.ceil((registrationDeadline - now) / (1000 * 60 * 60 * 24));
        
        // If less than 3 days until deadline and less than 50% of minimum attendees
        if (daysUntilDeadline <= 3 && attendeeCount < (event.minAttendees * 0.5)) {
          if (event.status !== 'at-risk') {
            updatedEvents[i] = { ...event, status: 'at-risk' };
            hasChanges = true;
            
            // Notify host that event is at risk
            const notification = {
              id: uuidv4(),
              userId: event.hostId,
              eventId: event.id,
              type: 'event_at_risk',
              title: `Event At Risk: ${event.title}`,
              message: `Your event "${event.title}" is at risk of cancellation. It currently has ${attendeeCount} attendees, but requires a minimum of ${event.minAttendees}. Consider promoting the event or extending the registration deadline.`,
              createdAt: new Date().toISOString(),
              read: false
            };
            
            await addNotification(notification);
          }
        }
      }
    }

    if (hasChanges) {
      setEvents(updatedEvents);
    }
  };

  // Set up interval to check event statuses
  React.useEffect(() => {
    // Check immediately and then every hour
    checkEventStatuses();
    const interval = setInterval(checkEventStatuses, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [events]); // Add events as dependency to ensure we have the latest data

  // Event categories
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

  const getCategoryEmoji = (categoryId, subcategoryId = null) => {
    const category = eventCategories.find(cat => cat.id === categoryId);
    if (!category) return '📅';
    
    if (subcategoryId && category.subcategories) {
      const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
      return subcategory ? subcategory.emoji : category.emoji;
    }
    
    return category.emoji;
  };

  const getCategoryName = (categoryId, subcategoryId = null) => {
    const category = eventCategories.find(cat => cat.id === categoryId);
    if (!category) return 'Other';
    
    if (subcategoryId && category.subcategories) {
      const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
      return subcategory ? subcategory.name : category.name;
    }
    
    return category.name;
  };

  // Find similar events for transfer recommendations
  const findSimilarEvents = (eventId) => {
    const cancelledEvent = events.find(e => e.id === eventId);
    if (!cancelledEvent) return [];
    
    // Find events in the same category, happening within the next 30 days
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
      .slice(0, 3); // Return top 3 similar events
  };

  // Handle event cancellation due to not meeting minimum capacity
  const handleMinimumCapacityCancellation = async (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    // Update event status to cancelled
    const updatedEvent = {
      ...event,
      status: 'cancelled',
      cancellationReason: 'minimum_capacity_not_met'
    };
    
    // Update event in the database
    await updateEvent(eventId, updatedEvent);
    
    // Find similar events for transfer recommendations
    const similarEvents = findSimilarEvents(eventId);
    
    // Get all attendees for this event
    const attendees = Object.entries(event.attendees || {})
      .filter(([_, status]) => status === 'attending')
      .map(([userId]) => userId);
    
    // For each attendee, send notification with transfer or refund options
    for (const userId of attendees) {
      // Create notification for the user
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
      
      // Add notification to the database
      await addNotification(notification);
      
      // Process refund for the user
      await processRefund(userId, eventId);
    }
    
    // Update local state
    setEvents(events.map(e => e.id === eventId ? updatedEvent : e));
    
    return {
      success: true,
      message: 'Event cancelled and attendees notified',
      similarEvents
    };
  };

  // Process refund for an event cancellation
  const processRefund = async (userId, eventId) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    // In a real application, this would integrate with a payment processor
    // For now, we'll just log the refund
    console.log(`Processing refund for user ${userId} for event ${eventId}`);
    
    // Create a refund record
    const refund = {
      id: uuidv4(),
      userId,
      eventId,
      amount: event.price || 0,
      status: 'completed',
      processedAt: new Date().toISOString()
    };
    
    // In a real application, this would be saved to a database
    console.log('Refund record:', refund);
    
    return refund;
  };

  // Transfer user to a different event
  const transferUserToEvent = async (userId, fromEventId, toEventId) => {
    const fromEvent = events.find(e => e.id === fromEventId);
    const toEvent = events.find(e => e.id === toEventId);
    
    if (!fromEvent || !toEvent) {
      throw new Error('One or both events not found');
    }
    
    // Check if the target event has capacity
    const currentAttendees = Object.values(toEvent.attendees || {}).filter(status => status === 'attending').length;
    if (currentAttendees >= toEvent.maxAttendees) {
      throw new Error('Target event is at capacity');
    }
    
    // Remove user from the cancelled event
    const updatedFromEvent = {
      ...fromEvent,
      attendees: {
        ...fromEvent.attendees,
        [userId]: 'cancelled'
      }
    };
    
    // Add user to the new event
    const updatedToEvent = {
      ...toEvent,
      attendees: {
        ...toEvent.attendees,
        [userId]: 'attending'
      }
    };
    
    // Update both events in the database
    await updateEvent(fromEventId, updatedFromEvent);
    await updateEvent(toEventId, updatedToEvent);
    
    // Create notification for the user
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
    
    // Add notification to the database
    await addNotification(notification);
    
    // Update local state
    setEvents(events.map(e => {
      if (e.id === fromEventId) return updatedFromEvent;
      if (e.id === toEventId) return updatedToEvent;
      return e;
    }));
    
    return {
      success: true,
      message: 'User transferred successfully'
    };
  };

  // Get event status
  const getEventStatus = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event?.status || 'pending';
  };

  // Get event status text
  const getEventStatusText = (eventId) => {
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
  };

  // Get event status color
  const getEventStatusColor = (eventId) => {
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
  };

  const handleToggleHost = (eventId, userId, isHost) => {
    const user = auth.currentUser;
    if (!user) return;

    setEvents(prevEvents => 
      prevEvents.map(event => {
        if (event.id !== eventId) return event;

        let updatedEvent = { ...event };
        
        if (isHost) {
          // Add as host if not already
          if (!event.hosts?.includes(userId)) {
            updatedEvent.hosts = [...(event.hosts || []), userId];
          }
        } else {
          // Remove from hosts
          updatedEvent.hosts = event.hosts?.filter(id => id !== userId) || [];
        }

        // Recalculate viability
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
  };

  const checkEventViability = (eventId) => {
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
  };

  const handleInviteUser = async (eventId, userId) => {
    try {
      // Add invite to the event
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        invites: arrayUnion(userId)
      });

      // Create notification for invited user
      const notificationRef = collection(db, 'notifications');
      await addDoc(notificationRef, {
        type: 'event_invite',
        eventId,
        userId,
        senderId: auth.currentUser?.uid,
        senderName: auth.currentUser?.displayName,
        eventTitle: events.find(e => e.id === eventId)?.title,
        createdAt: serverTimestamp(),
        read: false
      });

      toast.success('Invitation sent successfully!');
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invitation');
    }
  };

  const selectEvent = (event) => {
    setSelectedEvent(event);
  };

  const value = {
    events,
    setEvents,
    selectedEvent,
    selectEvent,
    handleAddEvent,
    handleEditEvent,
    handleDeleteEvent,
    handleEventSelect,
    handleToggleAttendance,
    handleToggleHost,
    checkEventViability,
    isUserAttending,
    isUserWaitlisted,
    getEventAttendeeCount,
    getEventWaitlistCount,
    getWaitlistPosition,
    loading,
    currentUser,
    eventCategories,
    getCategoryEmoji,
    getCategoryName,
    findSimilarEvents,
    handleMinimumCapacityCancellation,
    processRefund,
    transferUserToEvent,
    addNotification,
    handleInviteUser,
  };

  return (
    <EventContext.Provider value={value}>
      {!loading && children}
    </EventContext.Provider>
  );
}; 