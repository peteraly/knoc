// Sample events data with categories and people needed information
// This file provides sample data for testing the dashboard as if it were live

import { addDays, setHours, setMinutes } from 'date-fns';

const sampleLocations = {
  downtown: [
    { address: "50 California St, San Francisco, CA 94111", coordinates: { lat: 37.7936, lng: -122.3973 } },
    { address: "1 Market St, San Francisco, CA 94105", coordinates: { lat: 37.7938, lng: -122.3947 } },
    { address: "555 California St, San Francisco, CA 94104", coordinates: { lat: 37.7920, lng: -122.4036 } }
  ],
  mission: [
    { address: "3321 24th St, San Francisco, CA 94110", coordinates: { lat: 37.7524, lng: -122.4178 } },
    { address: "2128 Mission St, San Francisco, CA 94110", coordinates: { lat: 37.7631, lng: -122.4196 } },
    { address: "3489 20th St, San Francisco, CA 94110", coordinates: { lat: 37.7585, lng: -122.4205 } }
  ],
  haight: [
    { address: "1748 Haight St, San Francisco, CA 94117", coordinates: { lat: 37.7695, lng: -122.4502 } },
    { address: "557 Ashbury St, San Francisco, CA 94117", coordinates: { lat: 37.7717, lng: -122.4468 } },
    { address: "1390 Haight St, San Francisco, CA 94117", coordinates: { lat: 37.7702, lng: -122.4455 } }
  ],
  castro: [
    { address: "429 Castro St, San Francisco, CA 94114", coordinates: { lat: 37.7617, lng: -122.4349 } },
    { address: "2362 Market St, San Francisco, CA 94114", coordinates: { lat: 37.7634, lng: -122.4331 } },
    { address: "4127 18th St, San Francisco, CA 94114", coordinates: { lat: 37.7608, lng: -122.4360 } }
  ],
  soma: [
    { address: "747 Howard St, San Francisco, CA 94103", coordinates: { lat: 37.7847, lng: -122.4007 } },
    { address: "1015 Folsom St, San Francisco, CA 94103", coordinates: { lat: 37.7778, lng: -122.4057 } },
    { address: "375 9th St, San Francisco, CA 94103", coordinates: { lat: 37.7726, lng: -122.4109 } }
  ],
  marina: [
    { address: "2001 Chestnut St, San Francisco, CA 94123", coordinates: { lat: 37.8008, lng: -122.4368 } },
    { address: "3318 Steiner St, San Francisco, CA 94123", coordinates: { lat: 37.7998, lng: -122.4379 } },
    { address: "2125 Lombard St, San Francisco, CA 94123", coordinates: { lat: 37.8000, lng: -122.4355 } }
  ],
  richmond: [
    { address: "309 Clement St, San Francisco, CA 94118", coordinates: { lat: 37.7832, lng: -122.4627 } },
    { address: "5812 Geary Blvd, San Francisco, CA 94121", coordinates: { lat: 37.7805, lng: -122.4831 } },
    { address: "4401 Balboa St, San Francisco, CA 94121", coordinates: { lat: 37.7755, lng: -122.5067 } }
  ],
  sunset: [
    { address: "1396 9th Ave, San Francisco, CA 94122", coordinates: { lat: 37.7632, lng: -122.4660 } },
    { address: "2234 Irving St, San Francisco, CA 94122", coordinates: { lat: 37.7638, lng: -122.4826 } },
    { address: "3655 Lawton St, San Francisco, CA 94122", coordinates: { lat: 37.7575, lng: -122.4989 } }
  ],
  'nob-hill': [
    { address: "1075 California St, San Francisco, CA 94108", coordinates: { lat: 37.7908, lng: -122.4134 } },
    { address: "905 Powell St, San Francisco, CA 94108", coordinates: { lat: 37.7912, lng: -122.4101 } },
    { address: "1111 Sacramento St, San Francisco, CA 94108", coordinates: { lat: 37.7923, lng: -122.4145 } }
  ],
  'north-beach': [
    { address: "600 Columbus Ave, San Francisco, CA 94133", coordinates: { lat: 37.8005, lng: -122.4119 } },
    { address: "1570 Stockton St, San Francisco, CA 94133", coordinates: { lat: 37.8001, lng: -122.4089 } },
    { address: "1512 Grant Ave, San Francisco, CA 94133", coordinates: { lat: 37.7997, lng: -122.4073 } }
  ]
};

const eventCategories = [
  {
    id: 'dining',
    name: 'Dining',
    emoji: '🍽️',
    subcategories: [
      { id: 'restaurant', name: 'Restaurant', emoji: '🍴' },
      { id: 'cafe', name: 'Cafe', emoji: '☕' },
      { id: 'bar', name: 'Bar', emoji: '🍸' },
      { id: 'food-truck', name: 'Food Truck', emoji: '🚚' }
    ]
  },
  {
    id: 'fitness',
    name: 'Fitness',
    emoji: '💪',
    subcategories: [
      { id: 'yoga', name: 'Yoga', emoji: '🧘' },
      { id: 'running', name: 'Running', emoji: '🏃' },
      { id: 'cycling', name: 'Cycling', emoji: '🚴' },
      { id: 'hiking', name: 'Hiking', emoji: '🥾' }
    ]
  },
  {
    id: 'arts',
    name: 'Arts & Culture',
    emoji: '🎨',
    subcategories: [
      { id: 'museum', name: 'Museum', emoji: '🏛️' },
      { id: 'gallery', name: 'Gallery', emoji: '🖼️' },
      { id: 'theater', name: 'Theater', emoji: '🎭' },
      { id: 'music', name: 'Music', emoji: '🎵' }
    ]
  },
  {
    id: 'tech',
    name: 'Tech',
    emoji: '💻',
    subcategories: [
      { id: 'workshop', name: 'Workshop', emoji: '🔧' },
      { id: 'networking', name: 'Networking', emoji: '🤝' },
      { id: 'hackathon', name: 'Hackathon', emoji: '👨‍💻' },
      { id: 'conference', name: 'Conference', emoji: '🎤' }
    ]
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    emoji: '🌳',
    subcategories: [
      { id: 'picnic', name: 'Picnic', emoji: '🧺' },
      { id: 'beach', name: 'Beach', emoji: '🏖️' },
      { id: 'sports', name: 'Sports', emoji: '⚽' },
      { id: 'gardening', name: 'Gardening', emoji: '🌱' }
    ]
  }
];

const generateRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const generateRandomTime = () => {
  const hour = Math.floor(Math.random() * 14) + 8; // 8 AM to 10 PM
  const minute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45 minutes
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const generateSampleEvents = () => {
  const events = [];
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-12-31');

  // Add May 2025 events for each category
  const mayEvents = [
    // Dining Events (🍽️)
    {
      id: 'dining-may-1',
      title: 'Farm-to-Table Dinner Experience',
      category: 'dining',
      subcategory: 'restaurant',
      emoji: '🍽️',
      date: '2025-05-08',
      time: '7:00 PM',
      location: sampleLocations['nob-hill'][0].address,
      coordinates: sampleLocations['nob-hill'][0].coordinates,
      description: 'Join us for an intimate farm-to-table dining experience featuring seasonal ingredients from local farms.',
      minAttendees: 8,
      maxAttendees: 16,
      attendees: ['user-1', 'user-2'],
      price: 85,
      registrationDeadline: '2025-05-06',
      photos: []
    },
    {
      id: 'dining-may-2',
      title: 'Craft Cocktail Workshop',
      category: 'dining',
      subcategory: 'bar',
      emoji: '🍸',
      date: '2025-05-21',
      time: '7:30 PM',
      location: sampleLocations.haight[0].address,
      coordinates: sampleLocations.haight[0].coordinates,
      description: 'Learn the art of craft cocktails from expert mixologists. Create and taste unique drink combinations.',
      minAttendees: 6,
      maxAttendees: 12,
      attendees: [],
      price: 65,
      registrationDeadline: '2025-05-19',
      photos: []
    },
    {
      id: 'dining-may-3',
      title: 'Food Truck Festival',
      category: 'dining',
      subcategory: 'food-truck',
      emoji: '🚚',
      date: '2025-05-11',
      time: '11:00 AM',
      location: sampleLocations.marina[1].address,
      coordinates: sampleLocations.marina[1].coordinates,
      description: 'Experience the best food trucks in the city! From gourmet tacos to artisanal ice cream.',
      minAttendees: 50,
      maxAttendees: 200,
      attendees: ['user-10', 'user-11'],
      price: 10,
      registrationDeadline: '2025-05-09',
      photos: []
    },

    // Fitness Events (💪)
    {
      id: 'fitness-may-1',
      title: 'HIIT & Brunch',
      category: 'fitness',
      subcategory: 'running',
      emoji: '🏃',
      date: '2025-05-16',
      time: '9:00 AM',
      location: sampleLocations.marina[0].address,
      coordinates: sampleLocations.marina[0].coordinates,
      description: 'Start your weekend with an energizing HIIT workout followed by a healthy brunch.',
      minAttendees: 6,
      maxAttendees: 20,
      attendees: ['user-3'],
      price: 30,
      registrationDeadline: '2025-05-14',
      photos: []
    },
    {
      id: 'fitness-may-2',
      title: 'Sunset Yoga Flow',
      category: 'fitness',
      subcategory: 'yoga',
      emoji: '🧘‍♀️',
      date: '2025-05-28',
      time: '6:00 PM',
      location: sampleLocations.mission[0].address,
      coordinates: sampleLocations.mission[0].coordinates,
      description: 'Unwind with a relaxing yoga session as the sun sets over the city.',
      minAttendees: 5,
      maxAttendees: 20,
      attendees: [],
      price: 18,
      registrationDeadline: '2025-05-26',
      photos: []
    },
    {
      id: 'fitness-may-3',
      title: 'Trail Running Adventure',
      category: 'fitness',
      subcategory: 'running',
      emoji: '🏃',
      date: '2025-05-19',
      time: '7:30 AM',
      location: sampleLocations.richmond[0].address,
      coordinates: sampleLocations.richmond[0].coordinates,
      description: 'Join us for a morning trail run through beautiful trails. All skill levels welcome!',
      minAttendees: 8,
      maxAttendees: 20,
      attendees: ['user-12'],
      price: 15,
      registrationDeadline: '2025-05-17',
      photos: []
    },

    // Arts & Culture Events (🎨)
    {
      id: 'arts-may-1',
      title: 'Interactive Art Exhibition',
      category: 'arts',
      subcategory: 'gallery',
      emoji: '🎨',
      date: '2025-05-23',
      time: '6:30 PM',
      location: sampleLocations.soma[0].address,
      coordinates: sampleLocations.soma[0].coordinates,
      description: 'Experience art in a new way with this interactive exhibition featuring local artists.',
      minAttendees: 15,
      maxAttendees: 40,
      attendees: ['user-4', 'user-5', 'user-6'],
      price: 25,
      registrationDeadline: '2025-05-21',
      photos: []
    },
    {
      id: 'arts-may-2',
      title: 'Jazz Night & Paint Session',
      category: 'arts',
      subcategory: 'music',
      emoji: '🎷',
      date: '2025-05-25',
      time: '7:00 PM',
      location: sampleLocations['north-beach'][0].address,
      coordinates: sampleLocations['north-beach'][0].coordinates,
      description: 'Paint while enjoying live jazz music. No experience needed!',
      minAttendees: 10,
      maxAttendees: 25,
      attendees: [],
      price: 55,
      registrationDeadline: '2025-05-23',
      photos: []
    },
    {
      id: 'arts-may-3',
      title: 'Photography Walk',
      category: 'arts',
      subcategory: 'gallery',
      emoji: '📸',
      date: '2025-05-17',
      time: '4:00 PM',
      location: sampleLocations['north-beach'][1].address,
      coordinates: sampleLocations['north-beach'][1].coordinates,
      description: 'Capture the vibrant culture and architecture of the city with fellow photographers.',
      minAttendees: 5,
      maxAttendees: 15,
      attendees: [],
      price: 20,
      registrationDeadline: '2025-05-15',
      photos: []
    },

    // Tech Events (💻)
    {
      id: 'tech-may-1',
      title: 'AI & Machine Learning Workshop',
      category: 'tech',
      subcategory: 'workshop',
      emoji: '🤖',
      date: '2025-05-14',
      time: '2:00 PM',
      location: sampleLocations.downtown[0].address,
      coordinates: sampleLocations.downtown[0].coordinates,
      description: 'Deep dive into the latest AI and ML technologies with hands-on exercises.',
      minAttendees: 10,
      maxAttendees: 30,
      attendees: ['user-7', 'user-8'],
      price: 50,
      registrationDeadline: '2025-05-12',
      photos: []
    },
    {
      id: 'tech-may-2',
      title: 'Startup Networking Mixer',
      category: 'tech',
      subcategory: 'networking',
      emoji: '💻',
      date: '2025-05-15',
      time: '6:00 PM',
      location: sampleLocations.soma[1].address,
      coordinates: sampleLocations.soma[1].coordinates,
      description: 'Connect with fellow entrepreneurs and startup enthusiasts.',
      minAttendees: 20,
      maxAttendees: 100,
      attendees: [],
      price: 0,
      registrationDeadline: '2025-05-13',
      photos: []
    },
    {
      id: 'tech-may-3',
      title: 'Web3 Hackathon',
      category: 'tech',
      subcategory: 'hackathon',
      emoji: '👨‍💻',
      date: '2025-05-25',
      time: '9:00 AM',
      location: sampleLocations.soma[2].address,
      coordinates: sampleLocations.soma[2].coordinates,
      description: 'Build innovative blockchain projects in this one-day hackathon.',
      minAttendees: 20,
      maxAttendees: 50,
      attendees: [],
      price: 0,
      registrationDeadline: '2025-05-23',
      photos: []
    },

    // Outdoor Events (🌳)
    {
      id: 'outdoor-may-1',
      title: 'Beach Sports Day',
      category: 'outdoor',
      subcategory: 'sports',
      emoji: '⚽',
      date: '2025-05-30',
      time: '6:30 PM',
      location: sampleLocations.sunset[0].address,
      coordinates: sampleLocations.sunset[0].coordinates,
      description: 'Join us for a fun evening of beach sports including volleyball and frisbee!',
      minAttendees: 8,
      maxAttendees: 25,
      attendees: ['user-9'],
      price: 15,
      registrationDeadline: '2025-05-28',
      photos: []
    },
    {
      id: 'outdoor-may-2',
      title: 'Urban Garden Workshop',
      category: 'outdoor',
      subcategory: 'gardening',
      emoji: '🌱',
      date: '2025-05-18',
      time: '10:00 AM',
      location: sampleLocations.mission[1].address,
      coordinates: sampleLocations.mission[1].coordinates,
      description: 'Learn urban gardening techniques and start your own herb garden.',
      minAttendees: 8,
      maxAttendees: 15,
      attendees: [],
      price: 40,
      registrationDeadline: '2025-05-16',
      photos: []
    },
    {
      id: 'outdoor-may-3',
      title: 'Sunset Sailing Adventure',
      category: 'outdoor',
      subcategory: 'sports',
      emoji: '⛵',
      date: '2025-05-24',
      time: '4:00 PM',
      location: sampleLocations.marina[2].address,
      coordinates: sampleLocations.marina[2].coordinates,
      description: 'Experience the thrill of sailing on the San Francisco Bay.',
      minAttendees: 4,
      maxAttendees: 8,
      attendees: [],
      price: 75,
      registrationDeadline: '2025-05-22',
      photos: []
    }
  ];

  // Add all May events to the events array
  events.push(...mayEvents);

  // Create 10 events for April 2025 where current attendees < min attendees
  for (let i = 0; i < 10; i++) {
    const eventDate = new Date('2025-04-01');
    eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 30)); // Random day in April
    
    const neighborhood = Object.keys(sampleLocations)[Math.floor(Math.random() * Object.keys(sampleLocations).length)];
    const location = sampleLocations[neighborhood][Math.floor(Math.random() * sampleLocations[neighborhood].length)];
    const category = eventCategories[Math.floor(Math.random() * eventCategories.length)];
    const subcategory = category.subcategories[Math.floor(Math.random() * category.subcategories.length)];
    
    const minAttendees = Math.floor(Math.random() * 5) + 5; // 5 to 9
    const maxAttendees = minAttendees + Math.floor(Math.random() * 15) + 5; // min + 5 to 20
    const currentAttendees = Math.floor(Math.random() * (minAttendees - 1)); // Less than minAttendees
    
    // Include current user in some events
    const attendees = Array.from({ length: currentAttendees }, (_, i) => `user-${i + 1}`);
    if (Math.random() > 0.5) { // 50% chance to include current user
      attendees.push('current-user');
    }
    
    const event = {
      id: `april-event-${i + 1}`,
      title: `${subcategory.emoji} ${subcategory.name} ${category.name} in ${neighborhood.charAt(0).toUpperCase() + neighborhood.slice(1).replace('-', ' ')}`,
      description: `Join us for an exciting ${subcategory.name.toLowerCase()} ${category.name.toLowerCase()} event in the heart of ${neighborhood.replace('-', ' ')}! Connect with like-minded individuals and enjoy a memorable experience.`,
      date: eventDate.toISOString().split('T')[0],
      time: generateRandomTime(),
      location: location.address,
      coordinates: location.coordinates,
      neighborhood: neighborhood,
      category: category.id,
      subcategory: subcategory.id,
      emoji: subcategory.emoji,
      minAttendees,
      maxAttendees,
      currentAttendees: attendees.length,
      vipSpots: Math.floor(Math.random() * 5),
      groupMaxSize: Math.floor(Math.random() * 3) + 1,
      eventType: Math.random() > 0.8 ? 'vip' : 'standard',
      accessControl: {
        type: Math.random() > 0.7 ? 'private' : 'public',
        requiredBadges: [],
        minPoints: Math.floor(Math.random() * 100),
        inviteList: []
      },
      pricing: {
        standard: Math.floor(Math.random() * 50) * 5,
        vip: Math.floor(Math.random() * 100) * 5 + 100,
        earlyBird: Math.floor(Math.random() * 40) * 5,
        earlyBirdVip: Math.floor(Math.random() * 80) * 5 + 100,
        earlyBirdDeadline: addDays(eventDate, -14).toISOString()
      },
      perks: {
        standard: ['Welcome drink', 'Event swag', 'Professional photos'],
        vip: ['Priority seating', 'Exclusive networking', 'Premium refreshments', 'VIP gift bag']
      },
      requiredHosts: Math.floor(Math.random() * 2) + 1,
      hostingStyle: ['single', 'multi', 'collaborative'][Math.floor(Math.random() * 3)],
      registrationDeadline: addDays(eventDate, -2).toISOString(),
      cancellationDeadline: addDays(eventDate, -1).toISOString(),
      confirmationDeadline: addDays(eventDate, -3).toISOString(),
      status: 'active',
      attendees,
      waitlist: Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => `waitlist-user-${i + 1}`)
    };

    events.push(event);
  }

  // Create 10 events where the current user is attending and needs to invite more people
  for (let i = 0; i < 10; i++) {
    const eventDate = generateRandomDate(startDate, endDate);
    const neighborhood = Object.keys(sampleLocations)[Math.floor(Math.random() * Object.keys(sampleLocations).length)];
    const location = sampleLocations[neighborhood][Math.floor(Math.random() * sampleLocations[neighborhood].length)];
    const category = eventCategories[Math.floor(Math.random() * eventCategories.length)];
    const subcategory = category.subcategories[Math.floor(Math.random() * category.subcategories.length)];
    
    const minAttendees = Math.floor(Math.random() * 5) + 5; // 5 to 9
    const maxAttendees = minAttendees + Math.floor(Math.random() * 15) + 5; // min + 5 to 20
    const currentAttendees = Math.floor(Math.random() * (minAttendees - 1)); // Less than minAttendees
    
    // Always include current user in these events
    const attendees = Array.from({ length: currentAttendees }, (_, i) => `user-${i + 1}`);
    attendees.push('current-user');
    
    const event = {
      id: `user-event-${i + 1}`,
      title: `${subcategory.emoji} ${subcategory.name} ${category.name} in ${neighborhood.charAt(0).toUpperCase() + neighborhood.slice(1).replace('-', ' ')}`,
      description: `Join us for an exciting ${subcategory.name.toLowerCase()} ${category.name.toLowerCase()} event in the heart of ${neighborhood.replace('-', ' ')}! Connect with like-minded individuals and enjoy a memorable experience.`,
      date: eventDate.toISOString().split('T')[0],
      time: generateRandomTime(),
      location: location.address,
      coordinates: location.coordinates,
      neighborhood: neighborhood,
      category: category.id,
      subcategory: subcategory.id,
      emoji: subcategory.emoji,
      minAttendees,
      maxAttendees,
      currentAttendees: attendees.length,
      vipSpots: Math.floor(Math.random() * 5),
      groupMaxSize: Math.floor(Math.random() * 3) + 1,
      eventType: Math.random() > 0.8 ? 'vip' : 'standard',
      accessControl: {
        type: Math.random() > 0.7 ? 'private' : 'public',
        requiredBadges: [],
        minPoints: Math.floor(Math.random() * 100),
        inviteList: []
      },
      pricing: {
        standard: Math.floor(Math.random() * 50) * 5,
        vip: Math.floor(Math.random() * 100) * 5 + 100,
        earlyBird: Math.floor(Math.random() * 40) * 5,
        earlyBirdVip: Math.floor(Math.random() * 80) * 5 + 100,
        earlyBirdDeadline: addDays(eventDate, -14).toISOString()
      },
      perks: {
        standard: ['Welcome drink', 'Event swag', 'Professional photos'],
        vip: ['Priority seating', 'Exclusive networking', 'Premium refreshments', 'VIP gift bag']
      },
      requiredHosts: Math.floor(Math.random() * 2) + 1,
      hostingStyle: ['single', 'multi', 'collaborative'][Math.floor(Math.random() * 3)],
      registrationDeadline: addDays(eventDate, -2).toISOString(),
      cancellationDeadline: addDays(eventDate, -1).toISOString(),
      confirmationDeadline: addDays(eventDate, -3).toISOString(),
      status: 'active',
      attendees,
      waitlist: Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => `waitlist-user-${i + 1}`)
    };

    events.push(event);
  }

  // Create 5 May events where current user is attending and needs to invite people
  for (let i = 0; i < 5; i++) {
    const eventDate = new Date('2025-05-01');
    eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 31)); // Random day in May
    
    const neighborhood = Object.keys(sampleLocations)[Math.floor(Math.random() * Object.keys(sampleLocations).length)];
    const location = sampleLocations[neighborhood][Math.floor(Math.random() * sampleLocations[neighborhood].length)];
    const category = eventCategories[Math.floor(Math.random() * eventCategories.length)];
    const subcategory = category.subcategories[Math.floor(Math.random() * category.subcategories.length)];
    
    const minAttendees = Math.floor(Math.random() * 5) + 5; // 5 to 9
    const maxAttendees = minAttendees + Math.floor(Math.random() * 15) + 5; // min + 5 to 20
    const currentAttendees = Math.floor(Math.random() * (minAttendees - 1)); // Less than minAttendees
    
    // Always include current user in these events
    const attendees = Array.from({ length: currentAttendees }, (_, i) => `user-${i + 1}`);
    attendees.push('current-user');
    
    const event = {
      id: `may-invite-event-${i + 1}`,
      title: `${subcategory.emoji} ${subcategory.name} ${category.name} in ${neighborhood.charAt(0).toUpperCase() + neighborhood.slice(1).replace('-', ' ')}`,
      description: `Join us for an exciting ${subcategory.name.toLowerCase()} ${category.name.toLowerCase()} event in the heart of ${neighborhood.replace('-', ' ')}! Connect with like-minded individuals and enjoy a memorable experience.`,
      date: eventDate.toISOString().split('T')[0],
      time: generateRandomTime(),
      location: location.address,
      coordinates: location.coordinates,
      neighborhood: neighborhood,
      category: category.id,
      subcategory: subcategory.id,
      emoji: subcategory.emoji,
      minAttendees,
      maxAttendees,
      currentAttendees: attendees.length,
      vipSpots: Math.floor(Math.random() * 5),
      groupMaxSize: Math.floor(Math.random() * 3) + 1,
      eventType: Math.random() > 0.8 ? 'vip' : 'standard',
      accessControl: {
        type: Math.random() > 0.7 ? 'private' : 'public',
        requiredBadges: [],
        minPoints: Math.floor(Math.random() * 100),
        inviteList: []
      },
      pricing: {
        standard: Math.floor(Math.random() * 50) * 5,
        vip: Math.floor(Math.random() * 100) * 5 + 100,
        earlyBird: Math.floor(Math.random() * 40) * 5,
        earlyBirdVip: Math.floor(Math.random() * 80) * 5 + 100,
        earlyBirdDeadline: addDays(eventDate, -14).toISOString()
      },
      perks: {
        standard: ['Welcome drink', 'Event swag', 'Professional photos'],
        vip: ['Priority seating', 'Exclusive networking', 'Premium refreshments', 'VIP gift bag']
      },
      requiredHosts: Math.floor(Math.random() * 2) + 1,
      hostingStyle: ['single', 'multi', 'collaborative'][Math.floor(Math.random() * 3)],
      registrationDeadline: addDays(eventDate, -2).toISOString(),
      cancellationDeadline: addDays(eventDate, -1).toISOString(),
      confirmationDeadline: addDays(eventDate, -3).toISOString(),
      status: 'active',
      attendees,
      waitlist: Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => `waitlist-user-${i + 1}`)
    };

    events.push(event);
  }

  // Add more random events
  for (let i = 10; i < 100; i++) {
    const eventDate = generateRandomDate(startDate, endDate);
    const neighborhood = Object.keys(sampleLocations)[Math.floor(Math.random() * Object.keys(sampleLocations).length)];
    const location = sampleLocations[neighborhood][Math.floor(Math.random() * sampleLocations[neighborhood].length)];
    const category = eventCategories[Math.floor(Math.random() * eventCategories.length)];
    const subcategory = category.subcategories[Math.floor(Math.random() * category.subcategories.length)];
    
    const minAttendees = Math.floor(Math.random() * 5) + 3; // 3 to 7
    const maxAttendees = minAttendees + Math.floor(Math.random() * 15) + 5; // min + 5 to 20
    const currentAttendees = Math.floor(Math.random() * (maxAttendees - minAttendees)) + minAttendees;
    
    const event = {
      id: `event-${i + 1}`,
      title: `${subcategory.emoji} ${subcategory.name} ${category.name} in ${neighborhood.charAt(0).toUpperCase() + neighborhood.slice(1).replace('-', ' ')}`,
      description: `Join us for an exciting ${subcategory.name.toLowerCase()} ${category.name.toLowerCase()} event in the heart of ${neighborhood.replace('-', ' ')}! Connect with like-minded individuals and enjoy a memorable experience.`,
      date: eventDate.toISOString().split('T')[0],
      time: generateRandomTime(),
      location: location.address,
      coordinates: location.coordinates,
      neighborhood: neighborhood,
      category: category.id,
      subcategory: subcategory.id,
      emoji: subcategory.emoji,
      minAttendees,
      maxAttendees,
      currentAttendees,
      vipSpots: Math.floor(Math.random() * 5),
      groupMaxSize: Math.floor(Math.random() * 3) + 1,
      eventType: Math.random() > 0.8 ? 'vip' : 'standard',
      accessControl: {
        type: Math.random() > 0.7 ? 'private' : 'public',
        requiredBadges: [],
        minPoints: Math.floor(Math.random() * 100),
        inviteList: []
      },
      pricing: {
        standard: Math.floor(Math.random() * 50) * 5,
        vip: Math.floor(Math.random() * 100) * 5 + 100,
        earlyBird: Math.floor(Math.random() * 40) * 5,
        earlyBirdVip: Math.floor(Math.random() * 80) * 5 + 100,
        earlyBirdDeadline: addDays(eventDate, -14).toISOString()
      },
      perks: {
        standard: ['Welcome drink', 'Event swag', 'Professional photos'],
        vip: ['Priority seating', 'Exclusive networking', 'Premium refreshments', 'VIP gift bag']
      },
      requiredHosts: Math.floor(Math.random() * 2) + 1,
      hostingStyle: ['single', 'multi', 'collaborative'][Math.floor(Math.random() * 3)],
      registrationDeadline: addDays(eventDate, -2).toISOString(),
      cancellationDeadline: addDays(eventDate, -1).toISOString(),
      confirmationDeadline: addDays(eventDate, -3).toISOString(),
      status: 'active',
      attendees: Array.from({ length: currentAttendees }, (_, i) => `user-${i + 1}`),
      waitlist: Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => `waitlist-user-${i + 1}`)
    };

    events.push(event);
  }

  return events;
};

export const sampleEvents = generateSampleEvents();

// Helper function to get events for the current user (events they're attending)
export const getUserEvents = () => {
  return sampleEvents.filter(event => 
    event.attendees.includes('current-user')
  );
};

// Helper function to get discover events (events the user can join)
export const getDiscoverEvents = () => {
  return sampleEvents.filter(event => 
    !event.attendees.includes('current-user')
  );
};

// Helper function to get events by category
export const getEventsByCategory = (category) => {
  return sampleEvents.filter(event => 
    event.category === category
  );
};

// Helper function to get events by people needed
export const getEventsByPeopleNeeded = (peopleNeeded) => {
  return sampleEvents.filter(event => {
    const currentAttendees = event.attendees.length;
    const minAttendees = event.minAttendees;
    const peopleNeededCount = minAttendees - currentAttendees;
    
    if (peopleNeeded === '5+') {
      return peopleNeededCount >= 5;
    } else {
      return peopleNeededCount === parseInt(peopleNeeded);
    }
  });
};

// Drinks Events
export const drinksEvents = [
  {
    id: 'drinks-1',
    title: 'Wine Tasting Social',
    category: 'dining',
    subcategory: 'bar',
    emoji: '🍷',
    date: '2025-05-10',
    time: '6:00 PM',
    location: 'Urban Wine Bar, Downtown',
    description: 'Join us for an evening of wine tasting featuring local wineries. Perfect for networking and making new friends!',
    minAttendees: 8,
    maxAttendees: 20,
    attendees: [],
    price: 35,
    registrationDeadline: '2025-05-08',
    photos: []
  },
  {
    id: 'drinks-2',
    title: 'Craft Beer Workshop',
    category: 'dining',
    subcategory: 'bar',
    emoji: '🍺',
    date: '2025-05-17',
    time: '5:30 PM',
    location: 'Hopworks Brewery',
    description: 'Learn about craft beer brewing processes and taste different styles of beer with our expert brewmaster.',
    minAttendees: 6,
    maxAttendees: 15,
    attendees: [],
    price: 40,
    registrationDeadline: '2025-05-15',
    photos: []
  },

  // Sports Events
  {
    id: 'sports-1',
    title: 'Beach Volleyball Tournament',
    category: 'outdoor',
    subcategory: 'sports',
    emoji: '🏐',
    date: '2025-05-11',
    time: '10:00 AM',
    location: 'Sunset Beach',
    description: 'Join our casual beach volleyball tournament! All skill levels welcome. Teams will be formed on the spot.',
    minAttendees: 12,
    maxAttendees: 24,
    attendees: [],
    price: 15,
    registrationDeadline: '2025-05-09',
    photos: []
  },
  {
    id: 'sports-2',
    title: 'Morning Yoga in the Park',
    category: 'fitness',
    subcategory: 'yoga',
    emoji: '🧘',
    date: '2025-05-24',
    time: '8:00 AM',
    location: 'Central Park Garden',
    description: 'Start your weekend with an energizing yoga session in the park. All levels welcome!',
    minAttendees: 5,
    maxAttendees: 20,
    attendees: [],
    price: 12,
    registrationDeadline: '2025-05-23',
    photos: []
  },

  // Entertainment Events
  {
    id: 'entertainment-1',
    title: 'Comedy Night Showcase',
    category: 'arts',
    subcategory: 'theater',
    emoji: '🎭',
    date: '2025-05-15',
    time: '8:00 PM',
    location: 'Laugh Factory',
    description: 'An evening of stand-up comedy featuring both upcoming and established local comedians.',
    minAttendees: 20,
    maxAttendees: 100,
    attendees: [],
    price: 25,
    registrationDeadline: '2025-05-14',
    photos: []
  },
  {
    id: 'entertainment-2',
    title: 'Live Music & Art Night',
    category: 'arts',
    subcategory: 'music',
    emoji: '🎵',
    date: '2025-05-22',
    time: '7:30 PM',
    location: 'The Creative Space',
    description: 'Experience live music while local artists create artwork in real-time. Interactive and engaging!',
    minAttendees: 15,
    maxAttendees: 50,
    attendees: [],
    price: 30,
    registrationDeadline: '2025-05-20',
    photos: []
  },

  // Networking Events
  {
    id: 'networking-1',
    title: 'Tech Professionals Mixer',
    category: 'tech',
    subcategory: 'networking',
    emoji: '🤝',
    date: '2025-05-14',
    time: '6:30 PM',
    location: 'Innovation Hub',
    description: 'Network with professionals from various tech fields. Great opportunity for collaboration and career growth!',
    minAttendees: 15,
    maxAttendees: 60,
    attendees: [],
    price: 0,
    registrationDeadline: '2025-05-13',
    photos: []
  },
  {
    id: 'networking-2',
    title: 'Creative Industries Breakfast',
    category: 'tech',
    subcategory: 'networking',
    emoji: '🤝',
    date: '2025-05-21',
    time: '8:30 AM',
    location: 'Design District Café',
    description: 'Early morning networking for professionals in design, marketing, and creative fields.',
    minAttendees: 10,
    maxAttendees: 30,
    attendees: [],
    price: 25,
    registrationDeadline: '2025-05-19',
    photos: []
  },

  // Workshop Events
  {
    id: 'workshop-1',
    title: 'Digital Photography Basics',
    category: 'tech',
    subcategory: 'workshop',
    emoji: '📸',
    date: '2025-05-18',
    time: '2:00 PM',
    location: 'Photo Studio Downtown',
    description: 'Learn the fundamentals of digital photography in this hands-on workshop. Bring your own camera!',
    minAttendees: 5,
    maxAttendees: 12,
    attendees: [],
    price: 75,
    registrationDeadline: '2025-05-16',
    photos: []
  },
  {
    id: 'workshop-2',
    title: 'Sustainable Living Workshop',
    category: 'tech',
    subcategory: 'workshop',
    emoji: '🌱',
    date: '2025-05-25',
    time: '11:00 AM',
    location: 'Community Center',
    description: 'Learn practical tips and tricks for sustainable living, including composting, recycling, and energy conservation.',
    minAttendees: 8,
    maxAttendees: 25,
    attendees: [],
    price: 20,
    registrationDeadline: '2025-05-23',
    photos: []
  },

  // Classes Events
  {
    id: 'classes-1',
    title: 'Beginner Watercolor Painting',
    category: 'arts',
    subcategory: 'gallery',
    emoji: '🎨',
    date: '2025-05-12',
    time: '6:00 PM',
    location: 'Art Studio Central',
    description: 'Start your journey into watercolor painting! All materials provided. No experience necessary.',
    minAttendees: 4,
    maxAttendees: 12,
    attendees: [],
    price: 45,
    registrationDeadline: '2025-05-10',
    photos: []
  },
  {
    id: 'classes-2',
    title: 'Cooking Masterclass: Asian Fusion',
    category: 'dining',
    subcategory: 'restaurant',
    emoji: '👨‍🍳',
    date: '2025-05-19',
    time: '6:30 PM',
    location: 'Culinary Institute',
    description: 'Learn to cook delicious Asian fusion dishes with our experienced chef. Ingredients and equipment provided.',
    minAttendees: 6,
    maxAttendees: 16,
    attendees: [],
    price: 65,
    registrationDeadline: '2025-05-17',
    photos: []
  }
];

export default sampleEvents; 