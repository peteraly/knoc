import { db } from './firebase';
import { collection, addDoc, setDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

// Function to create a user profile
async function createUserProfile(userData) {
  try {
    const userRef = doc(db, 'users', userData.id);
    await setDoc(userRef, userData);
    console.log(`Created user profile for ${userData.basicInfo.name}`);
    return userRef.id;
  } catch (error) {
    console.error(`Error creating user profile for ${userData.basicInfo.name}:`, error);
    throw error;
  }
}

// Function to create a date request
async function createDateRequest(senderId, recipientId, status = 'pending') {
  try {
    const dateRequestData = {
      senderId,
      recipientId,
      status,
      createdAt: serverTimestamp(),
      proposedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      location: 'Coffee Shop',
      message: 'Would love to grab coffee and chat!',
      updatedAt: serverTimestamp()
    };

    const dateRequestRef = await addDoc(collection(db, 'dateRequests'), dateRequestData);
    console.log('Date request created:', dateRequestRef.id);
    return dateRequestRef.id;
  } catch (error) {
    console.error('Error creating date request:', error);
    throw error;
  }
}

// Function to create a match between two users
async function createMatch(user1Id, user2Id, status = 'active') {
  try {
    const matchData = {
      users: [user1Id, user2Id],
      timestamp: serverTimestamp(),
      status,
      lastInteraction: serverTimestamp(),
      commonInterests: ['Coffee', 'Music'],
      matchScore: Math.floor(Math.random() * 30) + 70 // Random score between 70-100
    };

    const matchRef = await addDoc(collection(db, 'matches'), matchData);
    console.log('Match created:', matchRef.id);
    return matchRef.id;
  } catch (error) {
    console.error('Error creating match:', error);
    throw error;
  }
}

const sampleUsers = [
  {
    id: 'test_user_1',
    basicInfo: {
      name: 'Sarah Johnson',
      age: '28',
      gender: 'woman',
      location: 'San Francisco, CA',
      photoURL: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=ff6b6b&color=fff',
      bio: 'Coffee enthusiast and amateur photographer. Love exploring new cafes and capturing city life. Always up for a good conversation over a cup of coffee.'
    },
    activities: ['Photography', 'Coffee Tasting', 'Hiking', 'Art Galleries', 'Yoga'],
    spotifyLink: 'https://open.spotify.com/user/example1',
    availability: {
      'Monday': ['Morning', 'Evening'],
      'Wednesday': ['Afternoon'],
      'Friday': ['Evening'],
      'Saturday': ['Morning', 'Afternoon']
    },
    preferences: {
      ageRange: { min: 25, max: 35 },
      maxDistance: 20,
      interests: ['Photography', 'Art', 'Music', 'Coffee']
    }
  },
  {
    id: 'test_user_2',
    basicInfo: {
      name: 'Michael Chen',
      age: '31',
      gender: 'man',
      location: 'San Francisco, CA',
      photoURL: 'https://ui-avatars.com/api/?name=Michael+Chen&background=4a90e2&color=fff',
      bio: 'Tech professional by day, tennis player by weekend. Always up for trying new restaurants and exploring the city. Looking for someone who shares a passion for good food and outdoor activities.'
    },
    activities: ['Tennis', 'Wine Tasting', 'Cooking', 'Tech Meetups', 'Hiking'],
    spotifyLink: 'https://open.spotify.com/user/example2',
    availability: {
      'Tuesday': ['Evening'],
      'Thursday': ['Afternoon', 'Evening'],
      'Saturday': ['Morning', 'Afternoon'],
      'Sunday': ['Morning']
    },
    preferences: {
      ageRange: { min: 25, max: 35 },
      maxDistance: 15,
      interests: ['Sports', 'Food & Wine', 'Technology', 'Outdoors']
    }
  },
  {
    id: 'test_user_3',
    basicInfo: {
      name: 'Alex Rivera',
      age: '26',
      gender: 'non-binary',
      location: 'Oakland, CA',
      photoURL: 'https://ui-avatars.com/api/?name=Alex+Rivera&background=50d890&color=fff',
      bio: 'Music producer and DJ. Looking for creative souls to explore the Bay Area music scene. Love discovering new artists and sharing playlists. Always down for a spontaneous dance party.'
    },
    activities: ['Music Production', 'Concert Going', 'Record Shopping', 'Yoga', 'Dancing'],
    spotifyLink: 'https://open.spotify.com/user/example3',
    availability: {
      'Monday': ['Evening'],
      'Wednesday': ['Morning', 'Evening'],
      'Friday': ['Evening'],
      'Sunday': ['Afternoon', 'Evening']
    },
    preferences: {
      ageRange: { min: 23, max: 32 },
      maxDistance: 25,
      interests: ['Music', 'Arts', 'Wellness', 'Dance']
    }
  },
  {
    id: 'test_user_4',
    basicInfo: {
      name: 'Emily Parker',
      age: '29',
      gender: 'woman',
      location: 'Berkeley, CA',
      photoURL: 'https://ui-avatars.com/api/?name=Emily+Parker&background=ffd93d&color=fff',
      bio: 'Literature professor and coffee shop explorer. Always carrying a book and ready for deep conversations. Love discussing ideas over a good cup of coffee or glass of wine.'
    },
    activities: ['Reading', 'Coffee Tasting', 'Museum Visits', 'Book Clubs', 'Writing'],
    spotifyLink: 'https://open.spotify.com/user/example4',
    availability: {
      'Tuesday': ['Morning', 'Evening'],
      'Thursday': ['Evening'],
      'Saturday': ['Afternoon'],
      'Sunday': ['Morning', 'Afternoon']
    },
    preferences: {
      ageRange: { min: 27, max: 35 },
      maxDistance: 20,
      interests: ['Literature', 'Arts', 'Coffee', 'Intellectual Discussion']
    }
  },
  {
    id: 'test_user_5',
    basicInfo: {
      name: 'James Wilson',
      age: '33',
      gender: 'man',
      location: 'San Jose, CA',
      photoURL: 'https://ui-avatars.com/api/?name=James+Wilson&background=845ec2&color=fff',
      bio: 'Software engineer who loves the outdoors. Looking for hiking and camping partners. When not coding, you can find me exploring trails or planning my next adventure.'
    },
    activities: ['Hiking', 'Rock Climbing', 'Camping', 'Photography', 'Coding'],
    spotifyLink: 'https://open.spotify.com/user/example5',
    availability: {
      'Wednesday': ['Evening'],
      'Saturday': ['Morning', 'Afternoon'],
      'Sunday': ['Morning', 'Afternoon']
    },
    preferences: {
      ageRange: { min: 28, max: 38 },
      maxDistance: 30,
      interests: ['Outdoor Activities', 'Photography', 'Adventure', 'Technology']
    }
  },
  {
    id: 'test_user_6',
    basicInfo: {
      name: 'Sofia Rodriguez',
      age: '27',
      gender: 'woman',
      location: 'San Francisco, CA',
      photoURL: 'https://ui-avatars.com/api/?name=Sofia+Rodriguez&background=ff9a8b&color=fff',
      bio: 'Art curator and foodie. Always on the hunt for the next great exhibition or hidden gem restaurant. Love sharing experiences and discovering new perspectives.'
    },
    activities: ['Art Curation', 'Food Tasting', 'Gallery Hopping', 'Cooking', 'Travel'],
    spotifyLink: 'https://open.spotify.com/user/example6',
    availability: {
      'Monday': ['Evening'],
      'Thursday': ['Afternoon', 'Evening'],
      'Saturday': ['Morning', 'Evening'],
      'Sunday': ['Afternoon']
    },
    preferences: {
      ageRange: { min: 25, max: 35 },
      maxDistance: 15,
      interests: ['Art', 'Food', 'Culture', 'Travel']
    }
  },
  {
    id: 'test_user_7',
    basicInfo: {
      name: 'David Kim',
      age: '30',
      gender: 'man',
      location: 'Oakland, CA',
      photoURL: 'https://ui-avatars.com/api/?name=David+Kim&background=6c5ce7&color=fff',
      bio: 'Chef and food blogger. Passionate about creating and sharing culinary experiences. Looking for someone who appreciates good food and enjoys trying new cuisines.'
    },
    activities: ['Cooking', 'Food Blogging', 'Wine Tasting', 'Restaurant Hopping', 'Photography'],
    spotifyLink: 'https://open.spotify.com/user/example7',
    availability: {
      'Tuesday': ['Evening'],
      'Friday': ['Evening'],
      'Saturday': ['Afternoon', 'Evening'],
      'Sunday': ['Morning']
    },
    preferences: {
      ageRange: { min: 26, max: 34 },
      maxDistance: 20,
      interests: ['Food', 'Cooking', 'Photography', 'Wine']
    }
  },
  {
    id: 'test_user_8',
    basicInfo: {
      name: 'Aisha Patel',
      age: '29',
      gender: 'woman',
      location: 'Berkeley, CA',
      photoURL: 'https://ui-avatars.com/api/?name=Aisha+Patel&background=a8e6cf&color=fff',
      bio: 'Environmental scientist and yoga instructor. Passionate about sustainability and wellness. Looking for someone who shares my love for nature and mindful living.'
    },
    activities: ['Yoga', 'Hiking', 'Environmental Activism', 'Meditation', 'Gardening'],
    spotifyLink: 'https://open.spotify.com/user/example8',
    availability: {
      'Monday': ['Morning', 'Evening'],
      'Wednesday': ['Morning'],
      'Saturday': ['Morning', 'Afternoon'],
      'Sunday': ['Morning']
    },
    preferences: {
      ageRange: { min: 27, max: 35 },
      maxDistance: 25,
      interests: ['Wellness', 'Nature', 'Sustainability', 'Yoga']
    }
  }
];

// Sample matches to create with different statuses
const sampleMatches = [
  ['test_user_1', 'test_user_2', 'active'],     // Sarah & Michael
  ['test_user_1', 'test_user_3', 'pending'],    // Sarah & Alex
  ['test_user_2', 'test_user_4', 'active'],     // Michael & Emily
  ['test_user_3', 'test_user_4', 'declined'],   // Alex & Emily
  ['test_user_5', 'test_user_1', 'active'],     // James & Sarah
  ['test_user_6', 'test_user_7', 'pending'],    // Sofia & David
  ['test_user_8', 'test_user_5', 'active'],     // Aisha & James
  ['test_user_7', 'test_user_3', 'pending']     // David & Alex
];

// Sample date requests
const sampleDateRequests = [
  ['test_user_1', 'test_user_2', 'accepted'],   // Sarah -> Michael
  ['test_user_3', 'test_user_4', 'pending'],    // Alex -> Emily
  ['test_user_2', 'test_user_1', 'pending'],    // Michael -> Sarah
  ['test_user_5', 'test_user_1', 'declined'],   // James -> Sarah
  ['test_user_4', 'test_user_2', 'pending'],    // Emily -> Michael
  ['test_user_6', 'test_user_7', 'accepted'],   // Sofia -> David
  ['test_user_8', 'test_user_5', 'pending'],    // Aisha -> James
  ['test_user_7', 'test_user_3', 'accepted']    // David -> Alex
];

export const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    // First create all user profiles
    for (const user of sampleUsers) {
      await createUserProfile(user);
    }
    console.log('Users created successfully');

    // Then create all matches
    for (const [user1Id, user2Id, status] of sampleMatches) {
      await createMatch(user1Id, user2Id, status);
    }
    console.log('Matches created successfully');

    // Finally create date requests
    for (const [senderId, recipientId, status] of sampleDateRequests) {
      await createDateRequest(senderId, recipientId, status);
    }
    console.log('Date requests created successfully');
    
    console.log('Database seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
};

// Function to clear test data (use carefully!)
export async function clearTestData() {
  // Implementation for clearing test data would go here
  console.warn('clearTestData not implemented');
} 