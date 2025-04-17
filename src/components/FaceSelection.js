import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function FaceSelection() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedFaces, setSelectedFaces] = useState([]);

  // In production, these would be AI-generated faces or curated photos
  // For now, using placeholder images
  const faces = [
    {
      id: 1,
      url: 'https://source.unsplash.com/400x400/?portrait,person,1',
      traits: ['warm', 'friendly', 'approachable']
    },
    {
      id: 2,
      url: 'https://source.unsplash.com/400x400/?portrait,person,2',
      traits: ['creative', 'artistic', 'thoughtful']
    },
    {
      id: 3,
      url: 'https://source.unsplash.com/400x400/?portrait,person,3',
      traits: ['adventurous', 'energetic', 'outgoing']
    },
    {
      id: 4,
      url: 'https://source.unsplash.com/400x400/?portrait,person,4',
      traits: ['intellectual', 'curious', 'focused']
    },
    {
      id: 5,
      url: 'https://source.unsplash.com/400x400/?portrait,person,5',
      traits: ['calm', 'peaceful', 'balanced']
    },
    {
      id: 6,
      url: 'https://source.unsplash.com/400x400/?portrait,person,6',
      traits: ['confident', 'ambitious', 'driven']
    },
    {
      id: 7,
      url: 'https://source.unsplash.com/400x400/?portrait,person,7',
      traits: ['empathetic', 'caring', 'nurturing']
    },
    {
      id: 8,
      url: 'https://source.unsplash.com/400x400/?portrait,person,8',
      traits: ['playful', 'humorous', 'light-hearted']
    },
    {
      id: 9,
      url: 'https://source.unsplash.com/400x400/?portrait,person,9',
      traits: ['mysterious', 'deep', 'introspective']
    }
  ];

  const handleFaceToggle = (faceId) => {
    setSelectedFaces(prev => {
      if (prev.includes(faceId)) {
        return prev.filter(id => id !== faceId);
      }
      if (prev.length >= 3) {
        toast.error('Please select no more than 3 faces');
        return prev;
      }
      return [...prev, faceId];
    });
  };

  const handleSubmit = async () => {
    if (selectedFaces.length < 1) {
      toast.error('Please select at least one face');
      return;
    }

    setLoading(true);
    try {
      // Get the selected faces' traits
      const selectedTraits = selectedFaces
        .map(id => faces.find(face => face.id === id)?.traits || [])
        .flat();

      // Update user profile with face preferences
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        facePreferences: selectedFaces,
        attractionTraits: selectedTraits,
        onboardingStep: 'face-selection-complete'
      });

      toast.success('Preferences saved successfully!');
      navigate('/availability');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-gray-900">Choose Your Preferences</h1>
          <p className="mt-2 text-sm text-rose-600 italic">
            Select up to 3 faces you feel drawn to
          </p>
          <p className="mt-1 text-xs text-gray-500">
            These help us understand your preferences and create meaningful connections
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {faces.map((face) => (
            <div
              key={face.id}
              onClick={() => handleFaceToggle(face.id)}
              className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transform transition-all duration-200 ${
                selectedFaces.includes(face.id)
                  ? 'ring-4 ring-rose-500 scale-95'
                  : 'hover:scale-105'
              }`}
            >
              <img
                src={face.url}
                alt="AI Generated Face"
                className="w-full h-full object-cover"
              />
              {selectedFaces.includes(face.id) && (
                <div className="absolute inset-0 bg-rose-500 bg-opacity-20 flex items-center justify-center">
                  <div className="bg-white rounded-full p-2">
                    <svg
                      className="w-6 h-6 text-rose-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                <div className="flex flex-wrap gap-1">
                  {face.traits.map((trait, index) => (
                    <span
                      key={index}
                      className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded-full"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue to Availability'}
          </button>
        </div>
      </div>
    </div>
  );
} 