import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import toast from 'react-hot-toast';
import ProgressIndicator from './ProgressIndicator';

const Profile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), profile);
      toast.success('Profile updated successfully');
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <ProgressIndicator />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Your Profile</h1>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <div className="space-x-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Basic Info Section */}
            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={profile.basicInfo.name}
                      onChange={(e) => setProfile({
                        ...profile,
                        basicInfo: { ...profile.basicInfo, name: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{profile.basicInfo.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={profile.basicInfo.age}
                      onChange={(e) => setProfile({
                        ...profile,
                        basicInfo: { ...profile.basicInfo, age: parseInt(e.target.value) }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{profile.basicInfo.age}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Preferences Section */}
            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Preferences</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Comfort Level</label>
                  {editMode ? (
                    <select
                      value={profile.basicInfo.comfort}
                      onChange={(e) => setProfile({
                        ...profile,
                        basicInfo: { ...profile.basicInfo, comfort: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    >
                      <option value="coffee">Coffee Date</option>
                      <option value="dinner">Dinner Date</option>
                      <option value="activity">Activity Date</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-gray-900 capitalize">{profile.basicInfo.comfort}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Activities</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.basicInfo.activities.map((activity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800"
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Emergency Contact Section */}
            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={profile.basicInfo.emergencyContact.name}
                      onChange={(e) => setProfile({
                        ...profile,
                        basicInfo: {
                          ...profile.basicInfo,
                          emergencyContact: {
                            ...profile.basicInfo.emergencyContact,
                            name: e.target.value
                          }
                        }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{profile.basicInfo.emergencyContact.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={profile.basicInfo.emergencyContact.phone}
                      onChange={(e) => setProfile({
                        ...profile,
                        basicInfo: {
                          ...profile.basicInfo,
                          emergencyContact: {
                            ...profile.basicInfo.emergencyContact,
                            phone: e.target.value
                          }
                        }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  ) : (
                    <p className="mt-1 text-gray-900">{profile.basicInfo.emergencyContact.phone}</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 