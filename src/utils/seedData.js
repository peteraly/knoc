import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs,
  deleteDoc,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { findOverlappingTimeSlots } from './matcher';

export const sampleUsers = {
  maya_patel: {
    uid: 'maya_patel',
    basicInfo: {
      name: 'Maya Patel',
      age: 29,
      gender: 'Woman',
      location: 'San Francisco, CA',
      bio: 'Tech enthusiast and yoga instructor. Love exploring new restaurants and hiking trails.',
      photoURL: 'https://source.unsplash.com/400x400/?portrait,woman,1'
    },
    preferences: {
      interestedIn: ['Man', 'Woman'],
      ageRange: {
        min: 25,
        max: 35
      },
      maxDistance: 25,
      activities: ['Hiking', 'Yoga', 'Dining', 'Museums']
    },
    photos: [
      'https://source.unsplash.com/400x400/?portrait,woman,1',
      'https://source.unsplash.com/400x400/?portrait,woman,2'
    ],
    facePreferences: [1, 3, 5],
    availability: {
      monday: ['morning', 'evening'],
      wednesday: ['afternoon', 'evening'],
      friday: ['morning', 'afternoon'],
      saturday: ['afternoon', 'evening']
    },
    onboardingComplete: true,
    onboardingStep: 'complete',
    createdAt: new Date()
  },
  sarah_johnson: {
    uid: 'sarah_johnson',
    basicInfo: {
      name: 'Sarah Johnson',
      age: 28,
      gender: 'Woman',
      location: 'San Francisco, CA',
      bio: 'Coffee enthusiast and avid hiker. Looking for someone to explore new trails and try out local cafes.',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
    },
    preferences: {
      interestedIn: ['Man', 'Woman'],
      ageRange: {
        min: 25,
        max: 35
      },
      maxDistance: 25,
      activities: ['Hiking', 'Coffee', 'Photography', 'Travel']
    },
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
    ],
    facePreferences: [2, 4, 6],
    availability: {
      monday: ['morning', 'evening'],
      wednesday: ['afternoon', 'evening'],
      friday: ['morning', 'afternoon'],
      saturday: ['afternoon', 'evening']
    },
    onboardingComplete: true,
    onboardingStep: 'complete',
    createdAt: new Date()
  },
  michael_chen: {
    uid: 'michael_chen',
    basicInfo: {
      name: 'Michael Chen',
      age: 31,
      gender: 'Man',
      location: 'San Francisco, CA',
      bio: 'Tech professional by day, amateur chef by night. Always up for trying new restaurants or cooking together.',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
    },
    preferences: {
      interestedIn: ['Woman'],
      ageRange: {
        min: 25,
        max: 35
      },
      maxDistance: 25,
      activities: ['Cooking', 'Technology', 'Food', 'Movies']
    },
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
    ],
    facePreferences: [1, 3, 5],
    availability: {
      monday: ['morning', 'evening'],
      wednesday: ['afternoon', 'evening'],
      friday: ['morning', 'afternoon'],
      saturday: ['afternoon', 'evening']
    },
    onboardingComplete: true,
    onboardingStep: 'complete',
    createdAt: new Date()
  },
  emily_rodriguez: {
    uid: 'emily_rodriguez',
    basicInfo: {
      name: 'Emily Rodriguez',
      age: 26,
      gender: 'Woman',
      location: 'Oakland, CA',
      bio: 'Artist and yoga instructor. Seeking someone creative who enjoys both active adventures and quiet moments.',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
    },
    preferences: {
      interestedIn: ['Man', 'Woman'],
      ageRange: {
        min: 25,
        max: 35
      },
      maxDistance: 25,
      activities: ['Art', 'Yoga', 'Music', 'Nature']
    },
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
    ],
    facePreferences: [2, 4, 6],
    availability: {
      monday: ['morning', 'evening'],
      wednesday: ['afternoon', 'evening'],
      friday: ['morning', 'afternoon'],
      saturday: ['afternoon', 'evening']
    },
    onboardingComplete: true,
    onboardingStep: 'complete',
    createdAt: new Date()
  },
  james_wilson: {
    uid: 'james_wilson',
    basicInfo: {
      name: 'James Wilson',
      age: 29,
      gender: 'Man',
      location: 'Berkeley, CA',
      bio: 'Music producer and vinyl collector. Looking for concert buddies and deep conversations over craft beer.',
      photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'
    },
    preferences: {
      interestedIn: ['Woman'],
      ageRange: {
        min: 25,
        max: 35
      },
      maxDistance: 25,
      activities: ['Music', 'Concerts', 'Vinyl Records', 'Craft Beer']
    },
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'
    ],
    facePreferences: [1, 3, 5],
    availability: {
      monday: ['morning', 'evening'],
      wednesday: ['afternoon', 'evening'],
      friday: ['morning', 'afternoon'],
      saturday: ['afternoon', 'evening']
    },
    onboardingComplete: true,
    onboardingStep: 'complete',
    createdAt: new Date()
  },
  alex_kim: {
    uid: 'alex_kim',
    basicInfo: {
      name: 'Alex Kim',
      age: 27,
      gender: 'Non-binary',
      location: 'San Francisco, CA',
      bio: 'Game developer and board game enthusiast. Looking for someone to share laughs and adventures with.',
      photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'
    },
    preferences: {
      interestedIn: ['Man', 'Woman', 'Non-binary'],
      ageRange: {
        min: 25,
        max: 35
      },
      maxDistance: 25,
      activities: ['Gaming', 'Board Games', 'Anime', 'Technology']
    },
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80'
    ],
    facePreferences: [1, 3, 5],
    availability: {
      monday: ['morning', 'evening'],
      wednesday: ['afternoon', 'evening'],
      friday: ['morning', 'afternoon'],
      saturday: ['afternoon', 'evening']
    },
    onboardingComplete: true,
    onboardingStep: 'complete',
    createdAt: new Date()
  },
  jordan_taylor: {
    uid: 'jordan_taylor',
    basicInfo: {
      name: 'Jordan Taylor',
      age: 30,
      gender: 'Non-binary',
      location: 'San Jose, CA',
      bio: 'Environmental scientist and rock climbing instructor. Passionate about sustainability and outdoor adventures.',
      photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9'
    },
    preferences: {
      interestedIn: ['Man', 'Woman', 'Non-binary'],
      ageRange: {
        min: 25,
        max: 35
      },
      maxDistance: 25,
      activities: ['Rock Climbing', 'Environment', 'Sustainability', 'Hiking']
    },
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9'
    ],
    facePreferences: [2, 4, 6],
    availability: {
      monday: ['morning', 'evening'],
      wednesday: ['afternoon', 'evening'],
      friday: ['morning', 'afternoon'],
      saturday: ['afternoon', 'evening']
    },
    onboardingComplete: true,
    onboardingStep: 'complete',
    createdAt: new Date()
  }
};

// Sample profiles for seeding
const SAMPLE_PROFILES = [
  {
    id: 'profile1',
    name: 'Sarah Johnson',
    age: 28,
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    bio: 'Adventure seeker and coffee enthusiast. Love hiking, photography, and trying new restaurants.',
    interests: ['Hiking', 'Photography', 'Coffee', 'Travel', 'Cooking'],
    availability: {
      Monday: ['Morning', 'Evening'],
      Wednesday: ['Afternoon', 'Evening'],
      Friday: ['Morning', 'Afternoon', 'Evening'],
      Saturday: ['Morning', 'Afternoon']
    }
  },
  {
    id: 'profile2',
    name: 'Michael Chen',
    age: 32,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    bio: 'Tech entrepreneur by day, musician by night. Always looking for new experiences and connections.',
    interests: ['Technology', 'Music', 'Fitness', 'Reading', 'Art'],
    availability: {
      Tuesday: ['Morning', 'Evening'],
      Thursday: ['Afternoon', 'Evening'],
      Saturday: ['Morning', 'Afternoon', 'Evening'],
      Sunday: ['Morning', 'Afternoon']
    }
  },
  {
    id: 'profile3',
    name: 'Emma Davis',
    age: 29,
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    bio: 'Yoga instructor and foodie. Passionate about wellness, cooking, and meeting new people.',
    interests: ['Yoga', 'Cooking', 'Wellness', 'Food', 'Travel'],
    availability: {
      Monday: ['Morning', 'Afternoon'],
      Wednesday: ['Morning', 'Evening'],
      Friday: ['Afternoon', 'Evening'],
      Sunday: ['Morning', 'Afternoon']
    }
  },
  {
    id: 'profile4',
    name: 'James Wilson',
    age: 30,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    bio: 'Music producer and vinyl collector. Looking for concert buddies and deep conversations over craft beer.',
    interests: ['Music', 'Concerts', 'Vinyl Records', 'Craft Beer', 'Art'],
    availability: {
      Tuesday: ['Evening'],
      Thursday: ['Morning', 'Evening'],
      Saturday: ['Morning', 'Afternoon'],
      Sunday: ['Afternoon']
    }
  },
  {
    id: 'profile5',
    name: 'Alex Kim',
    age: 27,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
    bio: 'Game developer and board game enthusiast. Looking for someone to share laughs and adventures with.',
    interests: ['Gaming', 'Board Games', 'Anime', 'Technology', 'Food'],
    availability: {
      Monday: ['Morning', 'Evening'],
      Wednesday: ['Afternoon', 'Evening'],
      Friday: ['Morning', 'Afternoon'],
      Saturday: ['Afternoon', 'Evening']
    }
  },
  {
    id: 'profile6',
    name: 'Jordan Taylor',
    age: 28,
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
    bio: 'Environmental scientist and rock climbing instructor. Passionate about sustainability and outdoor adventures.',
    interests: ['Rock Climbing', 'Environment', 'Sustainability', 'Hiking', 'Photography'],
    availability: {
      Monday: ['Morning', 'Evening'],
      Wednesday: ['Afternoon', 'Evening'],
      Friday: ['Morning', 'Afternoon'],
      Saturday: ['Afternoon', 'Evening']
    }
  }
];

// Sample date requests for seeding
const SAMPLE_DATE_REQUESTS = [
  {
    id: 'request1',
    from: 'profile1',
    to: 'profile2',
    status: 'pending',
    message: 'Hey! Would love to grab coffee and chat about tech and music sometime!',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    proposedDate: {
      day: 'Friday',
      time: 'Morning',
      activity: 'Coffee at Local Cafe'
    }
  },
  {
    id: 'request2',
    from: 'profile3',
    to: 'profile4',
    status: 'pending',
    message: 'I heard you love music! Would you be interested in checking out the new vinyl shop downtown?',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    proposedDate: {
      day: 'Saturday',
      time: 'Afternoon',
      activity: 'Visit Vinyl Shop'
    }
  },
  {
    id: 'request3',
    from: 'profile5',
    to: 'profile6',
    status: 'pending',
    message: 'I see you love rock climbing! Would you be interested in showing me some beginner spots?',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    proposedDate: {
      day: 'Sunday',
      time: 'Morning',
      activity: 'Rock Climbing Session'
    }
  }
];

// Sample confirmed dates for seeding
const SAMPLE_CONFIRMED_DATES = [
  {
    id: 'date1',
    participants: ['profile1', 'profile3'],
    status: 'confirmed',
    date: {
      day: 'Saturday',
      time: 'Morning',
      activity: 'Yoga Class and Coffee'
    },
    confirmedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    location: 'Sunrise Yoga Studio'
  },
  {
    id: 'date2',
    participants: ['profile2', 'profile5'],
    status: 'confirmed',
    date: {
      day: 'Sunday',
      time: 'Afternoon',
      activity: 'Board Game Cafe'
    },
    confirmedAt: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
    location: 'Game Haven Cafe'
  }
];

export const SAMPLE_MATCHES = [
  {
    id: 'match_1',
    users: ['maya_patel', 'michael_chen'],
    commonInterests: ['hiking', 'coffee', 'tech'],
    commonActivities: ['Weekend hikes', 'Coffee shop hopping'],
    matchScore: 85
  },
  {
    id: 'match_2',
    users: ['sarah_johnson', 'james_wilson'],
    commonInterests: ['hiking', 'fitness', 'food'],
    commonActivities: ['Weekend hikes', 'Restaurant exploring'],
    matchScore: 90
  }
];

export const SAMPLE_CHATS = [
  {
    id: 'chat_1',
    participants: ['maya_patel', 'michael_chen'],
    type: 'match',
    messages: [
      {
        senderId: 'maya_patel',
        text: 'Hey! I noticed we both like hiking. Any favorite trails?',
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        senderId: 'michael_chen',
        text: 'Hi! Yes, I love Lands End Trail. Have you been there?',
        timestamp: new Date(Date.now() - 3500000)
      }
    ]
  },
  {
    id: 'chat_2',
    participants: ['sarah_johnson', 'james_wilson'],
    type: 'date_planning',
    dateRequestId: 'date_request_2',
    messages: [
      {
        senderId: 'sarah_johnson',
        text: 'Looking forward to our hike!',
        timestamp: new Date(Date.now() - 7200000)
      },
      {
        senderId: 'james_wilson',
        text: 'Me too! Should we meet at the trailhead?',
        timestamp: new Date(Date.now() - 7100000)
      }
    ]
  }
];

// Sample chat messages for seeding conversations
export const sampleChatMessages = {
  casual: [
    "Hey there! I noticed we both love {activity}. Have you tried {venue} yet?",
    "Your profile mentioned {activity}. I'd love to hear more about that!",
    "I see you're into {activity} too! What got you started with that?",
    "Hi! I think we'd have a great time doing {activity} together. Would you be interested?",
    "Your photos from {activity} look amazing! Where was that taken?"
  ],
  dateRequest: [
    "Would you be interested in grabbing coffee at {venue} this {day}?",
    "I know this great spot for {activity} - {venue}. Free this {day}?",
    "How about we check out {venue} for some {activity} this {day}?",
    "I'd love to take you to {venue} for {activity}. Are you free {day}?",
    "There's a cool {activity} event at {venue} this {day}. Want to join me?"
  ],
  response: [
    "That sounds perfect! I'd love to join you.",
    "Yes, I'm definitely interested! Looking forward to it.",
    "That would be great! I've been wanting to try that place.",
    "Absolutely! I'm excited to meet you there.",
    "Count me in! That sounds like a lot of fun."
  ]
};

// Sample venues for different activities
export const sampleVenues = {
  Coffee: [
    "Blue Bottle Coffee",
    "Sightglass Coffee",
    "Ritual Coffee Roasters",
    "Philz Coffee",
    "Four Barrel Coffee"
  ],
  Dining: [
    "State Bird Provisions",
    "Nopa",
    "Foreign Cinema",
    "Lazy Bear",
    "Rich Table"
  ],
  Hiking: [
    "Lands End Trail",
    "Mount Tamalpais",
    "Twin Peaks",
    "Muir Woods",
    "Angel Island"
  ],
  Museums: [
    "SF MOMA",
    "California Academy of Sciences",
    "de Young Museum",
    "Asian Art Museum",
    "Exploratorium"
  ],
  "Live Music": [
    "The Independent",
    "Great American Music Hall",
    "The Chapel",
    "Bottom of the Hill",
    "The Fillmore"
  ]
};

export const populateUserData = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userData = sampleUsers[userId];
  
  if (!userData) {
    console.error(`No sample data found for user ${userId}`);
    return false;
  }

  try {
    // Normalize availability data to lowercase for consistency
    const normalizedAvailability = {};
    if (userData.availability) {
      Object.entries(userData.availability).forEach(([day, slots]) => {
        normalizedAvailability[day.toLowerCase()] = slots.map(slot => slot.toLowerCase());
      });
    }

    await setDoc(userRef, {
      ...userData,
      availability: normalizedAvailability,
      createdAt: serverTimestamp(),
      onboardingComplete: true,
      onboardingStep: 'complete'
    });
    console.log(`Successfully populated data for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error populating user data: ${error}`);
    return false;
  }
};

export const populateMatches = async (currentUserId) => {
  try {
    // Get current user's data
    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    if (!currentUserDoc.exists()) {
      console.error('Current user not found');
      return false;
    }
    const currentUserData = currentUserDoc.data();

    // Get all potential matches
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    
    for (const userDoc of usersSnapshot.docs) {
      const otherUserId = userDoc.id;
      if (otherUserId === currentUserId) continue;

      const otherUserData = userDoc.data();
      
      // Check if users are interested in each other's gender
      const currentUserInterestedIn = currentUserData.preferences?.interestedIn || [];
      const otherUserInterestedIn = otherUserData.preferences?.interestedIn || [];
      
      if (!currentUserInterestedIn.includes(otherUserData.basicInfo?.gender) ||
          !otherUserInterestedIn.includes(currentUserData.basicInfo?.gender)) {
        continue;
      }

      // Calculate match score based on common activities
      const currentUserActivities = currentUserData.preferences?.activities || [];
      const otherUserActivities = otherUserData.preferences?.activities || [];
      const commonActivities = currentUserActivities.filter(activity => 
        otherUserActivities.includes(activity)
      );
      const matchScore = commonActivities.length / Math.max(currentUserActivities.length, otherUserActivities.length);

      // Only create match if score is above threshold
      if (matchScore < 0.3) continue;

      // Find overlapping time slots
      const overlappingSlots = findOverlappingTimeSlots(
        currentUserData.availability || {},
        otherUserData.availability || {}
      );

      // Check if match already exists
      const existingMatchQuery = query(
        collection(db, 'matches'),
        where('participants', 'array-contains', currentUserId)
      );
      const existingMatches = await getDocs(existingMatchQuery);
      const matchExists = existingMatches.docs.some(doc => {
        const data = doc.data();
        return data.participants.includes(otherUserId);
      });

      if (matchExists) continue;

      // Create match document
      const matchData = {
        participants: [currentUserId, otherUserId],
        matchScore,
        overlappingSlots,
        commonActivities,
        createdAt: serverTimestamp(),
        status: 'pending'
      };

      const matchRef = await addDoc(collection(db, 'matches'), matchData);

      // Create initial chat message
      const chatRef = await addDoc(collection(db, 'chats'), {
        participants: [currentUserId, otherUserId],
        matchId: matchRef.id,
        messages: [{
          senderId: currentUserId,
          content: sampleChatMessages.casual[Math.floor(Math.random() * sampleChatMessages.casual.length)],
          timestamp: serverTimestamp()
        }],
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp()
      });

      // Update match with chat reference
      await updateDoc(matchRef, { chatId: chatRef.id });
    }

    return true;
  } catch (error) {
    console.error('Error populating matches:', error);
    return false;
  }
};

export const clearMatches = async (currentUserId) => {
  try {
    // Clear matches
    const matchesQuery = query(
      collection(db, 'matches'),
      where('participants', 'array-contains', currentUserId)
    );
    const matchesDocs = await getDocs(matchesQuery);
    for (const doc of matchesDocs.docs) {
      await deleteDoc(doc.ref);
    }

    // Clear chats
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUserId)
    );
    const chatsDocs = await getDocs(chatsQuery);
    for (const doc of chatsDocs.docs) {
      await deleteDoc(doc.ref);
    }

    console.log(`Cleared all matches and chats for user ${currentUserId}`);
  } catch (error) {
    console.error(`Error clearing matches: ${error}`);
  }
};

export { SAMPLE_PROFILES, SAMPLE_DATE_REQUESTS, SAMPLE_CONFIRMED_DATES }; 