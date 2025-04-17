import { db } from './firebase';
import { collection, addDoc, setDoc, doc, getDoc } from 'firebase/firestore';

// Function to create a user profile
async function createUserProfile(userData) {
  try {
    // Check if user profile already exists
    const userRef = doc(db, 'users', userData.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      console.log('User profile already exists:', userData.uid);
      return userData.uid;
    }

    await setDoc(userRef, {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('User profile created:', userData.uid);
    return userData.uid;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    console.error('Failed userData:', userData);
    throw new Error(`Failed to create user profile: ${error.message}`);
  }
}

// Function to create a match between two users
async function createMatch(user1Id, user2Id) {
  try {
    // Verify both users exist before creating match
    const user1Ref = doc(db, 'users', user1Id);
    const user2Ref = doc(db, 'users', user2Id);
    
    const [user1Doc, user2Doc] = await Promise.all([
      getDoc(user1Ref),
      getDoc(user2Ref)
    ]);

    if (!user1Doc.exists()) {
      throw new Error(`User ${user1Id} does not exist`);
    }
    if (!user2Doc.exists()) {
      throw new Error(`User ${user2Id} does not exist`);
    }

    const matchData = {
      users: [user1Id, user2Id],
      timestamp: new Date(),
      status: 'active',
      lastInteraction: new Date()
    };

    const matchRef = await addDoc(collection(db, 'matches'), matchData);
    console.log('Match created:', matchRef.id);
    return matchRef.id;
  } catch (error) {
    console.error('Error in createMatch:', error);
    console.error('Failed match data:', { user1Id, user2Id });
    throw new Error(`Failed to create match: ${error.message}`);
  }
}

// Main function to seed the database with test data
export async function seedDatabase(currentUserId) {
  if (!currentUserId) {
    throw new Error('currentUserId is required');
  }

  console.log('Starting database seeding for user:', currentUserId);

  try {
    // Create current user's profile if it doesn't exist
    console.log('Creating current user profile...');
    await createUserProfile({
      uid: currentUserId,
      name: 'Current User',
      photoURL: 'https://via.placeholder.com/150',
      title: 'Software Engineer',
      company: 'Tech Corp',
      bio: 'Passionate about technology and innovation',
      skills: ['JavaScript', 'React', 'Node.js'],
      interests: ['AI', 'Web Development', 'Open Source']
    });

    // Create some test users
    const testUsers = [
      {
        uid: 'test-user-1',
        name: 'Alice Johnson',
        photoURL: 'https://via.placeholder.com/150',
        title: 'Product Manager',
        company: 'Innovation Labs',
        bio: 'Building products that make a difference',
        skills: ['Product Strategy', 'UX Design', 'Agile'],
        interests: ['Product Management', 'Design Thinking', 'Tech Innovation']
      },
      {
        uid: 'test-user-2',
        name: 'Bob Smith',
        photoURL: 'https://via.placeholder.com/150',
        title: 'Data Scientist',
        company: 'Data Analytics Co',
        bio: 'Turning data into insights',
        skills: ['Python', 'Machine Learning', 'Data Analysis'],
        interests: ['AI/ML', 'Big Data', 'Data Visualization']
      },
      {
        uid: 'test-user-3',
        name: 'Carol White',
        photoURL: 'https://via.placeholder.com/150',
        title: 'UX Designer',
        company: 'Design Studio',
        bio: 'Creating beautiful and functional experiences',
        skills: ['UI Design', 'User Research', 'Prototyping'],
        interests: ['Design Systems', 'Accessibility', 'User Experience']
      }
    ];

    // Create test user profiles
    console.log('Creating test user profiles...');
    for (const user of testUsers) {
      await createUserProfile(user);
    }

    // Create matches between current user and test users
    console.log('Creating matches...');
    for (const user of testUsers) {
      await createMatch(currentUserId, user.uid);
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error in seedDatabase:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}

// Function to clear test data (use carefully!)
export async function clearTestData() {
  // Implementation for clearing test data would go here
  // Note: This is just a placeholder - implement based on your needs
  console.warn('clearTestData not implemented');
} 