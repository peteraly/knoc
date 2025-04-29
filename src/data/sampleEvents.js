// Sample events data with categories and people needed information
// This file provides sample data for testing the dashboard as if it were live

export const SAMPLE_EVENTS = [
  // Your Events (events the user is attending)
  {
    id: '101',
    title: 'Sourdough Baking Workshop',
    description: 'Learn the art of sourdough bread making from scratch',
    date: '2025-01-05',
    time: '10:00',
    location: '1398 University Ave, Berkeley, CA 94702',
    coordinates: [-122.2830, 37.8697],
    emoji: '🍞',
    category: 'food',
    status: 'confirmed',
    maxAttendees: 15,
    minAttendees: 5,
    attendees: ['current-user', 'user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10', 'user11'],
    hosts: ['host-1'],
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
    id: '102',
    title: 'Urban Photography Walk',
    description: 'Capture the essence of SF architecture',
    date: '2025-01-05',
    time: '14:00',
    location: '600 Montgomery St, San Francisco, CA 94111',
    coordinates: [-122.4033, 37.7955],
    emoji: '📸',
    category: 'art',
    status: 'confirmed',
    maxAttendees: 12,
    minAttendees: 4,
    attendees: ['current-user', 'user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8'],
    hosts: ['host-2'],
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
    id: '103',
    title: 'Jazz Night at Fox Theater',
    description: 'Evening of classic jazz and modern fusion',
    date: '2025-01-10',
    time: '19:30',
    location: '1807 Telegraph Ave, Oakland, CA 94612',
    coordinates: [-122.2710, 37.8080],
    emoji: '🎷',
    category: 'music',
    status: 'confirmed',
    maxAttendees: 30,
    minAttendees: 15,
    attendees: ['current-user', 'user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10', 'user11', 'user12', 'user13', 'user14', 'user15', 'user16', 'user17', 'user18', 'user19', 'user20', 'user21', 'user22', 'user23', 'user24', 'user25'],
    hosts: ['host-3'],
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
    id: '104',
    title: 'Tech Meetup: AI and Machine Learning',
    description: 'Discussion on the latest developments in AI and ML',
    date: '2025-01-15',
    time: '18:30',
    location: '375 Alabama St, San Francisco, CA 94110',
    coordinates: [-122.4127, 37.7641],
    emoji: '🤖',
    category: 'tech',
    status: 'upcoming',
    maxAttendees: 50,
    minAttendees: 10,
    attendees: ['current-user', 'user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9'],
    hosts: ['host-4'],
    registrationDeadline: '2025-01-14',
    cancellationDeadline: '2025-01-13',
    pricing: {
      standard: 0,
      earlyBird: 0
    },
    perks: {
      standard: ['Networking opportunity', 'Light refreshments'],
      vip: []
    }
  },
  {
    id: '105',
    title: 'Valentine\'s Chocolate Making',
    description: 'Create artisanal chocolates',
    date: '2025-02-13',
    time: '15:00',
    location: '900 North Point St, San Francisco, CA 94109',
    coordinates: [-122.4229, 37.8055],
    emoji: '🍫',
    category: 'food',
    status: 'upcoming',
    maxAttendees: 20,
    minAttendees: 8,
    attendees: ['current-user', 'user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7'],
    hosts: ['host-5'],
    registrationDeadline: '2025-02-12',
    cancellationDeadline: '2025-02-11',
    pricing: {
      standard: 75,
      earlyBird: 60
    },
    perks: {
      standard: ['Take home your creations', 'Recipe booklet'],
      vip: []
    }
  },
  
  // Discover Events (events the user can join)
  {
    id: '201',
    title: 'Sunset Yoga',
    description: 'Beachside yoga session',
    date: '2025-01-12',
    time: '17:00',
    location: '1000 Great Highway, San Francisco, CA 94121',
    coordinates: [-122.5092, 37.7697],
    emoji: '🧘‍♀️',
    category: 'sports',
    status: 'upcoming',
    maxAttendees: 25,
    minAttendees: 5,
    attendees: ['user1', 'user2', 'user3', 'user4'],
    hosts: ['host-6'],
    registrationDeadline: '2025-01-11',
    cancellationDeadline: '2025-01-10',
    pricing: {
      standard: 25,
      earlyBird: 20
    },
    perks: {
      standard: ['Yoga mat rental', 'Water provided'],
      vip: []
    }
  },
  {
    id: '202',
    title: 'Wine Tasting Evening',
    description: 'Napa Valley wine exploration',
    date: '2025-02-20',
    time: '18:00',
    location: '855 El Camino Real, Palo Alto, CA 94301',
    coordinates: [-122.1082, 37.4380],
    emoji: '🍷',
    category: 'food',
    status: 'upcoming',
    maxAttendees: 30,
    minAttendees: 10,
    attendees: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8'],
    hosts: ['host-7'],
    registrationDeadline: '2025-02-19',
    cancellationDeadline: '2025-02-18',
    pricing: {
      standard: 85,
      earlyBird: 70
    },
    perks: {
      standard: ['Wine tasting guide', 'Light appetizers'],
      vip: []
    }
  },
  {
    id: '203',
    title: 'Spring Garden Workshop',
    description: 'Learn sustainable gardening practices',
    date: '2025-03-01',
    time: '09:00',
    location: '1000 El Camino Real, San Bruno, CA 94066',
    coordinates: [-122.4430, 37.6305],
    emoji: '🌱',
    category: 'outdoor',
    status: 'upcoming',
    maxAttendees: 25,
    minAttendees: 8,
    attendees: ['user1', 'user2', 'user3', 'user4', 'user5'],
    hosts: ['host-8'],
    registrationDeadline: '2025-02-28',
    cancellationDeadline: '2025-02-27',
    pricing: {
      standard: 40,
      earlyBird: 30
    },
    perks: {
      standard: ['Seed packet', 'Gardening tools'],
      vip: []
    }
  },
  {
    id: '204',
    title: 'St. Patrick\'s Day Run',
    description: '5K fun run through Golden Gate Park',
    date: '2025-03-17',
    time: '08:00',
    location: '501 Stanyan St, San Francisco, CA 94117',
    coordinates: [-122.4759, 37.7726],
    emoji: '🍀',
    category: 'sports',
    status: 'upcoming',
    maxAttendees: 150,
    minAttendees: 30,
    attendees: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10', 'user11', 'user12', 'user13', 'user14', 'user15', 'user16', 'user17', 'user18', 'user19', 'user20', 'user21', 'user22', 'user23', 'user24', 'user25', 'user26', 'user27', 'user28'],
    hosts: ['host-9'],
    registrationDeadline: '2025-03-16',
    cancellationDeadline: '2025-03-15',
    pricing: {
      standard: 35,
      earlyBird: 25
    },
    perks: {
      standard: ['Race t-shirt', 'Finisher medal', 'Post-race refreshments'],
      vip: []
    }
  },
  {
    id: '205',
    title: 'Cherry Blossom Festival',
    description: 'Annual celebration in Japantown',
    date: '2025-04-05',
    time: '10:00',
    location: '1610 Geary Blvd, San Francisco, CA 94115',
    coordinates: [-122.4299, 37.7845],
    emoji: '🌸',
    category: 'social',
    status: 'upcoming',
    maxAttendees: 200,
    minAttendees: 50,
    attendees: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10', 'user11', 'user12', 'user13', 'user14', 'user15', 'user16', 'user17', 'user18', 'user19', 'user20', 'user21', 'user22', 'user23', 'user24', 'user25', 'user26', 'user27', 'user28', 'user29', 'user30', 'user31', 'user32', 'user33', 'user34', 'user35', 'user36', 'user37', 'user38', 'user39', 'user40', 'user41', 'user42', 'user43', 'user44', 'user45'],
    hosts: ['host-10'],
    registrationDeadline: '2025-04-04',
    cancellationDeadline: '2025-04-03',
    pricing: {
      standard: 20,
      earlyBird: 15
    },
    perks: {
      standard: ['Festival guide', 'Traditional snacks'],
      vip: []
    }
  },
  {
    id: '206',
    title: 'Earth Day Clean-up',
    description: 'Community beach cleaning',
    date: '2025-04-22',
    time: '09:00',
    location: 'Baker Beach, San Francisco, CA 94129',
    coordinates: [-122.4798, 37.7933],
    emoji: '🌍',
    category: 'outdoor',
    status: 'upcoming',
    maxAttendees: 150,
    minAttendees: 20,
    attendees: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10', 'user11', 'user12', 'user13', 'user14', 'user15', 'user16', 'user17', 'user18'],
    hosts: ['host-11'],
    registrationDeadline: '2025-04-21',
    cancellationDeadline: '2025-04-20',
    pricing: {
      standard: 0,
      earlyBird: 0
    },
    perks: {
      standard: ['Clean-up supplies', 'Refreshments'],
      vip: []
    }
  },
  {
    id: '207',
    title: 'Bay to Breakers',
    description: 'Annual city-wide running event',
    date: '2025-05-18',
    time: '07:00',
    location: '587 Howard St, San Francisco, CA 94105',
    coordinates: [-122.3975, 37.7873],
    emoji: '🏃',
    category: 'sports',
    status: 'upcoming',
    maxAttendees: 500,
    minAttendees: 100,
    attendees: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10', 'user11', 'user12', 'user13', 'user14', 'user15', 'user16', 'user17', 'user18', 'user19', 'user20', 'user21', 'user22', 'user23', 'user24', 'user25', 'user26', 'user27', 'user28', 'user29', 'user30', 'user31', 'user32', 'user33', 'user34', 'user35', 'user36', 'user37', 'user38', 'user39', 'user40', 'user41', 'user42', 'user43', 'user44', 'user45', 'user46', 'user47', 'user48', 'user49', 'user50', 'user51', 'user52', 'user53', 'user54', 'user55', 'user56', 'user57', 'user58', 'user59', 'user60', 'user61', 'user62', 'user63', 'user64', 'user65', 'user66', 'user67', 'user68', 'user69', 'user70', 'user71', 'user72', 'user73', 'user74', 'user75', 'user76', 'user77', 'user78', 'user79', 'user80', 'user81', 'user82', 'user83', 'user84', 'user85', 'user86', 'user87', 'user88', 'user89', 'user90', 'user91', 'user92', 'user93', 'user94', 'user95'],
    hosts: ['host-12'],
    registrationDeadline: '2025-05-17',
    cancellationDeadline: '2025-05-16',
    pricing: {
      standard: 65,
      earlyBird: 50
    },
    perks: {
      standard: ['Race bib', 'Finisher medal', 'Post-race party access'],
      vip: []
    }
  },
  {
    id: '208',
    title: 'Memorial Day BBQ',
    description: 'Community gathering and grilling',
    date: '2025-05-26',
    time: '12:00',
    location: '50 Hagiwara Tea Garden Dr, San Francisco, CA 94118',
    coordinates: [-122.4702, 37.7702],
    emoji: '🍖',
    category: 'food',
    status: 'upcoming',
    maxAttendees: 100,
    minAttendees: 20,
    attendees: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10', 'user11', 'user12', 'user13', 'user14', 'user15', 'user16', 'user17'],
    hosts: ['host-13'],
    registrationDeadline: '2025-05-25',
    cancellationDeadline: '2025-05-24',
    pricing: {
      standard: 25,
      earlyBird: 20
    },
    perks: {
      standard: ['BBQ supplies', 'Side dishes', 'Drinks'],
      vip: []
    }
  },
  {
    id: '209',
    title: 'Pride Parade',
    description: 'Annual LGBTQ+ celebration',
    date: '2025-06-29',
    time: '11:00',
    location: 'Market St & Castro St, San Francisco, CA 94114',
    coordinates: [-122.4350, 37.7620],
    emoji: '🌈',
    category: 'social',
    status: 'upcoming',
    maxAttendees: 1000,
    minAttendees: 200,
    attendees: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10', 'user11', 'user12', 'user13', 'user14', 'user15', 'user16', 'user17', 'user18', 'user19', 'user20', 'user21', 'user22', 'user23', 'user24', 'user25', 'user26', 'user27', 'user28', 'user29', 'user30', 'user31', 'user32', 'user33', 'user34', 'user35', 'user36', 'user37', 'user38', 'user39', 'user40', 'user41', 'user42', 'user43', 'user44', 'user45', 'user46', 'user47', 'user48', 'user49', 'user50', 'user51', 'user52', 'user53', 'user54', 'user55', 'user56', 'user57', 'user58', 'user59', 'user60', 'user61', 'user62', 'user63', 'user64', 'user65', 'user66', 'user67', 'user68', 'user69', 'user70', 'user71', 'user72', 'user73', 'user74', 'user75', 'user76', 'user77', 'user78', 'user79', 'user80', 'user81', 'user82', 'user83', 'user84', 'user85', 'user86', 'user87', 'user88', 'user89', 'user90', 'user91', 'user92', 'user93', 'user94', 'user95', 'user96', 'user97', 'user98', 'user99', 'user100', 'user101', 'user102', 'user103', 'user104', 'user105', 'user106', 'user107', 'user108', 'user109', 'user110', 'user111', 'user112', 'user113', 'user114', 'user115', 'user116', 'user117', 'user118', 'user119', 'user120', 'user121', 'user122', 'user123', 'user124', 'user125', 'user126', 'user127', 'user128', 'user129', 'user130', 'user131', 'user132', 'user133', 'user134', 'user135', 'user136', 'user137', 'user138', 'user139', 'user140', 'user141', 'user142', 'user143', 'user144', 'user145', 'user146', 'user147', 'user148', 'user149', 'user150', 'user151', 'user152', 'user153', 'user154', 'user155', 'user156', 'user157', 'user158', 'user159', 'user160', 'user161', 'user162', 'user163', 'user164', 'user165', 'user166', 'user167', 'user168', 'user169', 'user170', 'user171', 'user172', 'user173', 'user174', 'user175', 'user176', 'user177', 'user178', 'user179', 'user180', 'user181', 'user182', 'user183', 'user184', 'user185', 'user186', 'user187', 'user188', 'user189', 'user190', 'user191', 'user192', 'user193', 'user194', 'user195'],
    hosts: ['host-14'],
    registrationDeadline: '2025-06-28',
    cancellationDeadline: '2025-06-27',
    pricing: {
      standard: 0,
      earlyBird: 0
    },
    perks: {
      standard: ['Parade guide', 'Pride swag'],
      vip: []
    }
  },
  {
    id: '210',
    title: 'Summer Solstice Festival',
    description: 'Music and art celebration',
    date: '2025-06-21',
    time: '16:00',
    location: 'Golden Gate Park, San Francisco, CA 94122',
    coordinates: [-122.4862, 37.7694],
    emoji: '☀️',
    category: 'music',
    status: 'upcoming',
    maxAttendees: 300,
    minAttendees: 50,
    attendees: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10', 'user11', 'user12', 'user13', 'user14', 'user15', 'user16', 'user17', 'user18', 'user19', 'user20', 'user21', 'user22', 'user23', 'user24', 'user25', 'user26', 'user27', 'user28', 'user29', 'user30', 'user31', 'user32', 'user33', 'user34', 'user35', 'user36', 'user37', 'user38', 'user39', 'user40', 'user41', 'user42', 'user43', 'user44', 'user45'],
    hosts: ['host-15'],
    registrationDeadline: '2025-06-20',
    cancellationDeadline: '2025-06-19',
    pricing: {
      standard: 40,
      earlyBird: 30
    },
    perks: {
      standard: ['Festival guide', 'Food vouchers'],
      vip: []
    }
  },
  {
    id: '211',
    title: 'Fourth of July Fireworks',
    description: 'Independence Day celebration',
    date: '2025-07-04',
    time: '21:00',
    location: 'Pier 39, San Francisco, CA 94133',
    coordinates: [-122.4103, 37.8087],
    emoji: '🎆',
    category: 'social',
    status: 'upcoming',
    maxAttendees: 5000,
    minAttendees: 500,
    attendees: ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10', 'user11', 'user12', 'user13', 'user14', 'user15', 'user16', 'user17', 'user18', 'user19', 'user20', 'user21', 'user22', 'user23', 'user24', 'user25', 'user26', 'user27', 'user28', 'user29', 'user30', 'user31', 'user32', 'user33', 'user34', 'user35', 'user36', 'user37', 'user38', 'user39', 'user40', 'user41', 'user42', 'user43', 'user44', 'user45', 'user46', 'user47', 'user48', 'user49', 'user50', 'user51', 'user52', 'user53', 'user54', 'user55', 'user56', 'user57', 'user58', 'user59', 'user60', 'user61', 'user62', 'user63', 'user64', 'user65', 'user66', 'user67', 'user68', 'user69', 'user70', 'user71', 'user72', 'user73', 'user74', 'user75', 'user76', 'user77', 'user78', 'user79', 'user80', 'user81', 'user82', 'user83', 'user84', 'user85', 'user86', 'user87', 'user88', 'user89', 'user90', 'user91', 'user92', 'user93', 'user94', 'user95', 'user96', 'user97', 'user98', 'user99', 'user100', 'user101', 'user102', 'user103', 'user104', 'user105', 'user106', 'user107', 'user108', 'user109', 'user110', 'user111', 'user112', 'user113', 'user114', 'user115', 'user116', 'user117', 'user118', 'user119', 'user120', 'user121', 'user122', 'user123', 'user124', 'user125', 'user126', 'user127', 'user128', 'user129', 'user130', 'user131', 'user132', 'user133', 'user134', 'user135', 'user136', 'user137', 'user138', 'user139', 'user140', 'user141', 'user142', 'user143', 'user144', 'user145', 'user146', 'user147', 'user148', 'user149', 'user150', 'user151', 'user152', 'user153', 'user154', 'user155', 'user156', 'user157', 'user158', 'user159', 'user160', 'user161', 'user162', 'user163', 'user164', 'user165', 'user166', 'user167', 'user168', 'user169', 'user170', 'user171', 'user172', 'user173', 'user174', 'user175', 'user176', 'user177', 'user178', 'user179', 'user180', 'user181', 'user182', 'user183', 'user184', 'user185', 'user186', 'user187', 'user188', 'user189', 'user190', 'user191', 'user192', 'user193', 'user194', 'user195', 'user196', 'user197', 'user198', 'user199', 'user200', 'user201', 'user202', 'user203', 'user204', 'user205', 'user206', 'user207', 'user208', 'user209', 'user210', 'user211', 'user212', 'user213', 'user214', 'user215', 'user216', 'user217', 'user218', 'user219', 'user220', 'user221', 'user222', 'user223', 'user224', 'user225', 'user226', 'user227', 'user228', 'user229', 'user230', 'user231', 'user232', 'user233', 'user234', 'user235', 'user236', 'user237', 'user238', 'user239', 'user240', 'user241', 'user242', 'user243', 'user244', 'user245', 'user246', 'user247', 'user248', 'user249', 'user250', 'user251', 'user252', 'user253', 'user254', 'user255', 'user256', 'user257', 'user258', 'user259', 'user260', 'user261', 'user262', 'user263', 'user264', 'user265', 'user266', 'user267', 'user268', 'user269', 'user270', 'user271', 'user272', 'user273', 'user274', 'user275', 'user276', 'user277', 'user278', 'user279', 'user280', 'user281', 'user282', 'user283', 'user284', 'user285', 'user286', 'user287', 'user288', 'user289', 'user290', 'user291', 'user292', 'user293', 'user294', 'user295', 'user296', 'user297', 'user298', 'user299', 'user300', 'user301', 'user302', 'user303', 'user304', 'user305', 'user306', 'user307', 'user308', 'user309', 'user310', 'user311', 'user312', 'user313', 'user314', 'user315', 'user316', 'user317', 'user318', 'user319', 'user320', 'user321', 'user322', 'user323', 'user324', 'user325', 'user326', 'user327', 'user328', 'user329', 'user330', 'user331', 'user332', 'user333', 'user334', 'user335', 'user336', 'user337', 'user338', 'user339', 'user340', 'user341', 'user342', 'user343', 'user344', 'user345', 'user346', 'user347', 'user348', 'user349', 'user350', 'user351', 'user352', 'user353', 'user354', 'user355', 'user356', 'user357', 'user358', 'user359', 'user360', 'user361', 'user362', 'user363', 'user364', 'user365', 'user366', 'user367', 'user368', 'user369', 'user370', 'user371', 'user372', 'user373', 'user374', 'user375', 'user376', 'user377', 'user378', 'user379', 'user380', 'user381', 'user382', 'user383', 'user384', 'user385', 'user386', 'user387', 'user388', 'user389', 'user390', 'user391', 'user392', 'user393', 'user394', 'user395', 'user396', 'user397', 'user398', 'user399', 'user400', 'user401', 'user402', 'user403', 'user404', 'user405', 'user406', 'user407', 'user408', 'user409', 'user410', 'user411', 'user412', 'user413', 'user414', 'user415', 'user416', 'user417', 'user418', 'user419', 'user420', 'user421', 'user422', 'user423', 'user424', 'user425', 'user426', 'user427', 'user428', 'user429', 'user430', 'user431', 'user432', 'user433', 'user434', 'user435', 'user436', 'user437', 'user438', 'user439', 'user440', 'user441', 'user442', 'user443', 'user444', 'user445', 'user446', 'user447', 'user448', 'user449', 'user450', 'user451', 'user452', 'user453', 'user454', 'user455', 'user456', 'user457', 'user458', 'user459', 'user460', 'user461', 'user462', 'user463', 'user464', 'user465', 'user466', 'user467', 'user468', 'user469', 'user470', 'user471', 'user472', 'user473', 'user474', 'user475', 'user476', 'user477', 'user478', 'user479', 'user480', 'user481', 'user482', 'user483', 'user484', 'user485', 'user486', 'user487', 'user488', 'user489', 'user490', 'user491', 'user492', 'user493', 'user494', 'user495'],
    hosts: ['host-16'],
    registrationDeadline: '2025-07-03',
    cancellationDeadline: '2025-07-02',
    pricing: {
      standard: 30,
      earlyBird: 20
    },
    perks: {
      standard: ['Viewing area access', 'Patriotic swag'],
      vip: []
    }
  }
];

// Helper function to get events for the current user (events they're attending)
export const getUserEvents = () => {
  return SAMPLE_EVENTS.filter(event => 
    event.attendees.includes('current-user')
  );
};

// Helper function to get discover events (events the user can join)
export const getDiscoverEvents = () => {
  return SAMPLE_EVENTS.filter(event => 
    !event.attendees.includes('current-user')
  );
};

// Helper function to get events by category
export const getEventsByCategory = (category) => {
  return SAMPLE_EVENTS.filter(event => 
    event.category === category
  );
};

// Helper function to get events by people needed
export const getEventsByPeopleNeeded = (peopleNeeded) => {
  return SAMPLE_EVENTS.filter(event => {
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