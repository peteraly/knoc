import { db } from './firebase';
import { collection, addDoc, setDoc, doc, serverTimestamp, getDoc, writeBatch, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { 
  SAMPLE_PROFILES, 
  SAMPLE_MATCHES, 
  SAMPLE_DATE_REQUESTS, 
  SAMPLE_CHATS,
  populateUserData,
  populateMatches
} from './seedData';

// Function to create a user profile
async function createUserProfile(profile) {
  try {
    const userData = {
      uid: profile.id,
      basicInfo: {
        ...profile.basicInfo,
        bio: profile.bio || '',
        gender: profile.basicInfo.gender.charAt(0).toUpperCase() + profile.basicInfo.gender.slice(1)
      },
      preferences: {
        interestedIn: ['Man', 'Woman'],
        ageRange: {
          min: Math.max(18, profile.basicInfo.age - 5),
          max: profile.basicInfo.age + 5
        },
        maxDistance: 25,
        activities: profile.activities || []
      },
      photos: [profile.basicInfo.photoURL],
      facePreferences: [1, 3, 5],
      availability: generateRandomAvailability(),
      onboardingComplete: true,
      onboardingStep: 'complete',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', profile.id), userData);
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

// Function to create a date request
async function createDateRequest(senderId, recipientId, status = 'pending') {
  try {
    console.log(`Creating date request from ${senderId} to ${recipientId} with status ${status}`);
    
    // Generate a random date between now and 30 days from now
    const randomDays = Math.floor(Math.random() * 30);
    const proposedDate = new Date(Date.now() + randomDays * 24 * 60 * 60 * 1000);
    
    // Random time slots
    const timeSlots = ['11:00 AM', '1:00 PM', '3:00 PM', '6:00 PM', '7:30 PM'];
    const randomTime = timeSlots[Math.floor(Math.random() * timeSlots.length)];
    
    // Random venues
    const venues = [
      'Blue Bottle Coffee',
      'Sightglass Coffee',
      'Dolores Park',
      'Ferry Building',
      'California Academy of Sciences',
      'de Young Museum',
      'Golden Gate Park',
      'The Exploratorium'
    ];
    const randomVenue = venues[Math.floor(Math.random() * venues.length)];
    
    // Random messages
    const messages = [
      'Would love to grab coffee and chat!',
      'How about we check out this cool museum?',
      'Want to explore the park together?',
      'I know a great coffee spot we could try!',
      'There\'s an interesting exhibit I\'d love to see with you.'
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    const dateRequestData = {
      senderId,
      recipientId,
      status,
      createdAt: serverTimestamp(),
      dateDetails: {
        date: proposedDate.toISOString(),
        time: randomTime,
        venue: randomVenue
      },
      message: randomMessage,
      updatedAt: serverTimestamp(),
      participants: [senderId, recipientId]
    };

    console.log('Creating date request with data:', dateRequestData);
    const dateRequestRef = await addDoc(collection(db, 'dateRequests'), dateRequestData);
    console.log('Date request created:', dateRequestRef.id);
    
    // If the status is accepted or confirmed, create a chat
    if (status === 'accepted' || status === 'confirmed') {
      const chatData = {
        participants: [senderId, recipientId],
        type: 'date_planning',
        dateRequestId: dateRequestRef.id,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        messages: [
          {
            senderId,
            text: randomMessage,
            timestamp: serverTimestamp()
          }
        ]
      };
      
      console.log('Creating chat for date request');
      await addDoc(collection(db, 'chats'), chatData);
    }
    
    return dateRequestRef.id;
  } catch (error) {
    console.error('Error creating date request:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

// Function to create a match between two users
async function createMatch(user1Id, user2Id, status = 'active') {
  try {
    // Calculate more sophisticated match score based on common interests and preferences
    const user1Doc = await getDoc(doc(db, 'users', user1Id));
    const user2Doc = await getDoc(doc(db, 'users', user2Id));
    const user1Data = user1Doc.data();
    const user2Data = user2Doc.data();

    if (!user1Data || !user2Data) {
      console.error('User data not found for match creation');
      return null;
    }

    // Calculate activity compatibility
    const commonActivities = user1Data.preferences.activities.filter(
      activity => user2Data.preferences.activities.includes(activity)
    );
    const activityScore = (commonActivities.length / Math.max(
      user1Data.preferences.activities.length,
      user2Data.preferences.activities.length
    )) * 70;

    // Base compatibility score
    const baseScore = 30;

    // Final match score
    const matchScore = Math.min(Math.round(baseScore + activityScore), 100);

    // Find overlapping time slots
    const overlappingSlots = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const timeSlots = ['morning', 'afternoon', 'evening'];
    
    days.forEach(day => {
      const user1Slots = user1Data.availability?.[day] || [];
      const user2Slots = user2Data.availability?.[day] || [];
      
      timeSlots.forEach(slot => {
        if (user1Slots.includes(slot) && user2Slots.includes(slot)) {
          overlappingSlots.push({ day, slot });
        }
      });
    });

    const matchData = {
      users: [user1Id, user2Id],
      userDetails: {
        [user1Id]: {
          name: user1Data.basicInfo.name,
          photo: user1Data.basicInfo.photoURL,
          age: user1Data.basicInfo.age,
          location: user1Data.basicInfo.location
        },
        [user2Id]: {
          name: user2Data.basicInfo.name,
          photo: user2Data.basicInfo.photoURL,
          age: user2Data.basicInfo.age,
          location: user2Data.basicInfo.location
        }
      },
      commonActivities,
      matchScore,
      overlappingSlots,
      timestamp: serverTimestamp(),
      status,
      lastInteraction: serverTimestamp()
    };

    const matchRef = await addDoc(collection(db, 'matches'), matchData);
    console.log('Match created:', matchRef.id);
    return { matchId: matchRef.id, user1: user1Id, user2: user2Id };
  } catch (error) {
    console.error('Error creating match:', error);
    throw error;
  }
}

// Function to create a chat between two users
async function createChat(user1Id, user2Id, matchId) {
  try {
    const chatData = {
      participants: [user1Id, user2Id],
      matchId,
      type: 'match',
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      messages: [
        {
          senderId: user1Id,
          text: 'Hey there! How are you?',
          timestamp: serverTimestamp()
        },
        {
          senderId: user2Id,
          text: 'I\'m good, thanks! How about you?',
          timestamp: serverTimestamp()
        },
        {
          senderId: user1Id,
          text: 'Doing well! I noticed we both like hiking. Any favorite trails?',
          timestamp: serverTimestamp()
        }
      ]
    };

    const chatRef = await addDoc(collection(db, 'chats'), chatData);
    return chatRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
}

const generateRandomAvailability = () => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const timeSlots = ['morning', 'afternoon', 'evening'];
  const availability = {};
  
  days.forEach(day => {
    // For each day, randomly select 1-3 time slots
    const daySlots = timeSlots.filter(() => Math.random() > 0.5);
    availability[day] = daySlots.length > 0 ? daySlots : [timeSlots[Math.floor(Math.random() * timeSlots.length)]];
  });
  
  return availability;
};

const generateRandomAge = (min = 21, max = 45) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const INTERESTS = [
  // Creative & Arts
  'painting', 'photography', 'writing', 'music', 'dance', 'theater', 'film',
  // Outdoor & Adventure
  'hiking', 'camping', 'rock climbing', 'surfing', 'skiing', 'cycling', 'running',
  // Food & Drink
  'cooking', 'baking', 'wine tasting', 'craft beer', 'coffee', 'food tours', 'restaurants',
  // Culture & Learning
  'languages', 'history', 'philosophy', 'science', 'books', 'museums', 'travel',
  // Tech & Gaming
  'programming', 'gaming', 'VR/AR', 'blockchain', 'AI', 'robotics', 'tech startups',
  // Wellness & Fitness
  'yoga', 'meditation', 'fitness', 'martial arts', 'nutrition', 'mental health', 'spirituality',
  // Social & Community
  'volunteering', 'activism', 'community service', 'mentoring', 'networking', 'public speaking',
  // Entertainment
  'concerts', 'festivals', 'board games', 'karaoke', 'comedy', 'podcasts', 'sports'
];

const LOCATIONS = [
  'San Francisco, CA', 'Oakland, CA', 'Berkeley, CA', 'San Jose, CA', 'Palo Alto, CA',
  'Mountain View, CA', 'Redwood City, CA', 'San Mateo, CA', 'Menlo Park, CA', 'Sunnyvale, CA'
];

const ACTIVITIES = [
  // Active & Outdoor
  'Morning hike and coffee', 'Beach yoga session', 'Rock climbing adventure', 'Bike ride exploration',
  // Food & Drink
  'Cooking class together', 'Wine tasting experience', 'Food truck crawl', 'Farmers market visit',
  // Cultural & Educational
  'Museum exhibition tour', 'Language exchange meetup', 'Art gallery opening', 'Historical walking tour',
  // Entertainment
  'Live music show', 'Comedy club night', 'Board game café', 'Outdoor movie screening',
  // Wellness & Creative
  'Meditation workshop', 'Pottery class', 'Dance lesson', 'Photography walk',
  // Social Impact
  'Community garden volunteering', 'Beach cleanup', 'Animal shelter visit', 'Food bank service',
  // Tech & Innovation
  'VR gaming experience', 'Tech meetup', 'Startup pitch event', 'Hackathon participation',
  // Casual & Fun
  'Picnic in the park', 'Sunset viewing spot', 'Arcade gaming', 'Karaoke night'
];

const generateBio = (name, interests, activities) => {
  const intros = [
    "Always up for",
    "Passionate about",
    "Can't live without",
    "You'll find me",
    "Dedicated to"
  ];
  
  const outros = [
    "Looking for someone who shares my enthusiasm for life and adventure.",
    "Hoping to meet someone who appreciates good conversation and spontaneous plans.",
    "Seeking genuine connections with people who love to explore and learn.",
    "Would love to meet someone who's equally passionate about making memories.",
    "Excited to connect with others who appreciate the simple joys in life."
  ];

  const intro = intros[Math.floor(Math.random() * intros.length)];
  const outro = outros[Math.floor(Math.random() * outros.length)];
  const activity = activities[Math.floor(Math.random() * activities.length)];

  return `${intro} ${interests.slice(0, 2).join(' and ')}. ${activity}. ${outro}`;
};

const generateRandomInterests = () => {
  const count = Math.floor(Math.random() * 5) + 3; // 3-7 interests
  const shuffled = [...INTERESTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const generateRandomActivities = () => {
  const count = Math.floor(Math.random() * 3) + 2; // 2-4 activities
  const shuffled = [...ACTIVITIES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    // Clear existing test data first
    await clearTestData();
    
    // Create user profiles
    console.log('Creating user profiles...');
    for (const profile of SAMPLE_PROFILES) {
      await createUserProfile(profile);
      console.log(`Created profile for ${profile.basicInfo.name}`);
    }
    
    // Create matches between users
    console.log('Creating matches...');
    const matchResults = [];
    
    // Create matches for each user with 2-4 other users
    for (let i = 0; i < SAMPLE_PROFILES.length; i++) {
      const userId = SAMPLE_PROFILES[i].id;
      const potentialMatches = SAMPLE_PROFILES.filter(p => p.id !== userId);
      
      // Randomly select 2-4 users to match with
      const matchCount = Math.floor(Math.random() * 3) + 2;
      const shuffledMatches = [...potentialMatches].sort(() => 0.5 - Math.random());
      const selectedMatches = shuffledMatches.slice(0, matchCount);
      
      for (const match of selectedMatches) {
        // Check if this match pair already exists
        const matchExists = matchResults.some(
          m => (m.user1 === userId && m.user2 === match.id) || 
               (m.user1 === match.id && m.user2 === userId)
        );
        
        if (!matchExists) {
          const result = await createMatch(userId, match.id);
          if (result) {
            matchResults.push({
              matchId: result.matchId,
              user1: userId,
              user2: match.id
            });
            console.log(`Created match between ${userId} and ${match.id}`);
          }
        }
      }
    }
    
    // Create date requests for some matches
    console.log('Creating date requests...');
    for (const match of matchResults) {
      // 50% chance to create a date request for each match
      if (Math.random() > 0.5) {
        const statuses = ['pending', 'accepted', 'confirmed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Randomly decide who initiates the date request
        const senderId = Math.random() > 0.5 ? match.user1 : match.user2;
        const recipientId = senderId === match.user1 ? match.user2 : match.user1;
        
        const dateRequestId = await createDateRequest(senderId, recipientId, status);
        console.log(`Created date request from ${senderId} to ${recipientId}`);
      }
    }
    
    // Create chats for some matches
    console.log('Creating chats...');
    for (const match of matchResults) {
      // 70% chance to create a chat for each match
      if (Math.random() > 0.3) {
        await createChat(match.user1, match.user2, match.matchId);
        console.log(`Created chat for match between ${match.user1} and ${match.user2}`);
      }
    }
    
    console.log('Database seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

export const clearTestData = async () => {
  try {
    console.log('Clearing test data...');
    
    // Clear matches
    const matchesQuery = query(collection(db, 'matches'));
    const matchesSnap = await getDocs(matchesQuery);
    const matchDeletions = matchesSnap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(matchDeletions);
    
    // Clear date requests
    const dateRequestsQuery = query(collection(db, 'dateRequests'));
    const dateRequestsSnap = await getDocs(dateRequestsQuery);
    const dateRequestDeletions = dateRequestsSnap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(dateRequestDeletions);
    
    // Clear chats
    const chatsQuery = query(collection(db, 'chats'));
    const chatsSnap = await getDocs(chatsQuery);
    const chatDeletions = chatsSnap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(chatDeletions);
    
    // Clear notifications
    const notificationsQuery = query(collection(db, 'notifications'));
    const notificationsSnap = await getDocs(notificationsQuery);
    const notificationDeletions = notificationsSnap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(notificationDeletions);
    
    console.log('Test data cleared successfully!');
    return true;
  } catch (error) {
    console.error('Error clearing test data:', error);
    throw error;
  }
}; 