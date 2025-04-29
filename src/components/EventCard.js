import React, { useState } from 'react';
import { CalendarIcon, ClockIcon, MapPinIcon, UserGroupIcon, UserPlusIcon, XMarkIcon, EnvelopeIcon, PhoneIcon, PhotoIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';

// Sample data for testing
const sampleAttendees = [
  { id: 1, name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: 2, name: 'Mike Chen', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: 3, name: 'Emma Davis', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: 4, name: 'Alex Thompson', avatar: 'https://i.pravatar.cc/150?img=4' },
];

const sampleNetwork = [
  { id: 5, name: 'James Wilson', avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: 6, name: 'Lisa Brown', avatar: 'https://i.pravatar.cc/150?img=6' },
  { id: 7, name: 'David Lee', avatar: 'https://i.pravatar.cc/150?img=7' },
  { id: 8, name: 'Rachel Green', avatar: 'https://i.pravatar.cc/150?img=8' },
];

// Sample event photos
const sampleEventPhotos = [
  { id: 1, url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', alt: 'Event venue' },
  { id: 2, url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', alt: 'Event setup' },
  { id: 3, url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', alt: 'Event atmosphere' },
];

// Event categories with emojis
const eventCategories = [
  { id: 'music', emoji: '🎵', name: 'Music' },
  { id: 'art', emoji: '🎨', name: 'Art' },
  { id: 'food', emoji: '🍽️', name: 'Food' },
  { id: 'sports', emoji: '🏃‍♂️', name: 'Sports' },
  { id: 'tech', emoji: '💻', name: 'Technology' },
  { id: 'business', emoji: '💼', name: 'Business' },
  { id: 'education', emoji: '📚', name: 'Education' },
  { id: 'social', emoji: '👥', name: 'Social' },
  { id: 'outdoor', emoji: '🌲', name: 'Outdoor' },
  { id: 'nightlife', emoji: '🌙', name: 'Nightlife' },
];

const EventCard = ({ event, onClick }) => {
  const { isUserAttending, isUserWaitlisted, handleInviteUser } = useEvents();
  const { user, userNetwork = [] } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteMethod, setInviteMethod] = useState('network');
  const [inviteInput, setInviteInput] = useState('');
  const [selectedNetworkUsers, setSelectedNetworkUsers] = useState([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const getStatusBadge = () => {
    if (isUserAttending(event.id)) {
      return <span className="absolute top-3 right-3 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Attending</span>;
    } else if (isUserWaitlisted(event.id)) {
      return <span className="absolute top-3 right-3 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Waitlisted</span>;
    }
    return null;
  };

  // Get network connections who are attending
  const getNetworkAttendees = () => {
    if (!event.attendees || !userNetwork) return [];
    return event.attendees.filter(attendeeId => 
      userNetwork.some(connection => connection.id === attendeeId)
    );
  };

  // Filter network connections who haven't been invited yet
  const getInvitableConnections = () => {
    if (!userNetwork) return [];
    return userNetwork.filter(connection => 
      !event.attendees?.includes(connection.id) &&
      !event.invites?.includes(connection.id)
    );
  };

  // Get category emoji for this event
  const getCategoryEmoji = () => {
    const category = eventCategories.find(cat => cat.id === event.category);
    return category ? category.emoji : '📅';
  };

  // Toggle category selection
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleInviteClick = (e) => {
    e.stopPropagation();
    setShowInviteModal(true);
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    // Here you would handle the actual invite logic
    console.log('Inviting:', { method: inviteMethod, input: inviteInput, selectedUsers: selectedNetworkUsers });
    setInviteInput('');
    setSelectedNetworkUsers([]);
  };

  const toggleNetworkUser = (userId) => {
    setSelectedNetworkUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handlePhotoClick = (photo, e) => {
    e.stopPropagation();
    setSelectedPhoto(photo);
    setShowPhotoModal(true);
  };

  return (
    <>
      <div 
        onClick={onClick}
        className="relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden"
      >
        <div className="flex">
          {/* Photo Gallery Section */}
          <div className="w-1/3 min-w-[200px] relative">
            <div className="h-full">
              {sampleEventPhotos.length > 0 && (
                <div 
                  className="h-full relative"
                  onClick={(e) => handlePhotoClick(sampleEventPhotos[0], e)}
                >
                  <img
                    src={sampleEventPhotos[0].url}
                    alt={sampleEventPhotos[0].alt}
                    className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  />
                  {sampleEventPhotos.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                      <PhotoIcon className="h-4 w-4 inline-block mr-1" />
                      {sampleEventPhotos.length} photos
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Event Details Section */}
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <span className="text-2xl mr-2">{getCategoryEmoji()}</span>
                <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
              </div>
              {getStatusBadge()}
            </div>
            
            <div className="space-y-2 mt-2">
              <div className="flex items-center text-gray-600">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">{new Date(event.date).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <ClockIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">{event.time}</span>
              </div>
              
              <div className="flex items-center text-gray-600">
                <MapPinIcon className="h-4 w-4 mr-2" />
                <span className="text-sm truncate">{event.location}</span>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center text-gray-600">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm">{event.attendees.length} / {event.maxAttendees}</span>
                  </div>

                  {/* Network attendees preview */}
                  {getNetworkAttendees().length > 0 && (
                    <div className="flex -space-x-2 overflow-hidden">
                      {getNetworkAttendees().slice(0, 3).map(attendee => (
                        <img
                          key={attendee.id}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-white"
                          src={attendee.avatar || '/default-avatar.png'}
                          alt={attendee.name}
                        />
                      ))}
                      {getNetworkAttendees().length > 3 && (
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 text-xs text-gray-600 ring-2 ring-white">
                          +{getNetworkAttendees().length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Invite button */}
                <button
                  onClick={handleInviteClick}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors duration-200"
                  title="Invite friends to this event"
                >
                  <UserPlusIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Invite</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Modal */}
      {showCategoryFilter && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCategoryFilter(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Filter Events</h3>
              <button 
                onClick={() => setShowCategoryFilter(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-3 mb-6">
              {eventCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg ${
                    selectedCategories.includes(category.id)
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl mb-1">{category.emoji}</span>
                  <span className="text-xs text-center">{category.name}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setSelectedCategories([])}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Clear All
              </button>
              <button
                onClick={() => {
                  // Here you would apply the filter
                  console.log('Filtering by categories:', selectedCategories);
                  setShowCategoryFilter(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowPhotoModal(false)}
        >
          <div className="relative max-w-4xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.alt}
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Enhanced Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Invite to {event.title}</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column - Attendees list */}
              <div>
                <h4 className="font-medium mb-3">Current Attendees</h4>
                <div className="space-y-2">
                  {sampleAttendees.map(attendee => (
                    <div key={attendee.id} className="flex items-center p-2 bg-gray-50 rounded-lg">
                      <img
                        src={attendee.avatar}
                        alt={attendee.name}
                        className="h-8 w-8 rounded-full mr-3"
                      />
                      <span className="font-medium">{attendee.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column - Invite options */}
              <div>
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => setInviteMethod('network')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      inviteMethod === 'network' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Network
                  </button>
                  <button
                    onClick={() => setInviteMethod('email')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      inviteMethod === 'email' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => setInviteMethod('phone')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      inviteMethod === 'phone' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Phone
                  </button>
                </div>

                {inviteMethod === 'network' ? (
                  <div className="space-y-2">
                    {sampleNetwork.map(user => (
                      <div 
                        key={user.id} 
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                          selectedNetworkUsers.includes(user.id) 
                            ? 'bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleNetworkUser(user.id)}
                      >
                        <div className="flex items-center">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-8 w-8 rounded-full mr-3"
                          />
                          <span className="font-medium">{user.name}</span>
                        </div>
                        <div className={`h-5 w-5 rounded-full border ${
                          selectedNetworkUsers.includes(user.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedNetworkUsers.includes(user.id) && (
                            <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleInviteSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {inviteMethod === 'email' ? 'Email Address' : 'Phone Number'}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          {inviteMethod === 'email' ? (
                            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <PhoneIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <input
                          type={inviteMethod === 'email' ? 'email' : 'tel'}
                          value={inviteInput}
                          onChange={(e) => setInviteInput(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder={inviteMethod === 'email' ? 'Enter email address' : 'Enter phone number'}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Send Invite
                    </button>
                  </form>
                )}

                {inviteMethod === 'network' && selectedNetworkUsers.length > 0 && (
                  <button
                    onClick={handleInviteSubmit}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Invite Selected ({selectedNetworkUsers.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventCard; 