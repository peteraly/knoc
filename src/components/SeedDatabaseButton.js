import React, { useState } from 'react';
import { seedDatabase } from '../utils/seedDatabase';
import { toast } from 'react-hot-toast';

export default function SeedDatabaseButton() {
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const success = await seedDatabase();
      if (success) {
        toast.success('Database seeded successfully! Refresh the page to see matches.');
      } else {
        toast.error('Failed to seed database');
      }
    } catch (error) {
      console.error('Error seeding database:', error);
      toast.error('Failed to seed database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSeed}
      disabled={loading}
      className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white transition-colors ${
        loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
      }`}
    >
      {loading ? 'Seeding...' : 'Seed Database'}
    </button>
  );
} 