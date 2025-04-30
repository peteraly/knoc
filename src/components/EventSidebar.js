import React, { useState, useEffect } from 'react';
import { UserGroupIcon, MagnifyingGlassIcon, CalendarIcon, UserPlusIcon, PlusIcon, XMarkIcon, ClockIcon, ShareIcon, CheckCircleIcon, EnvelopeIcon, LinkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { classNames } from '../utils/classNames';
import EventDetails from './EventDetails';
import EventForm from './EventForm';
import { useEvents } from '../contexts/EventContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { useFriends } from '../contexts/FriendsContext';
import FriendsList from './FriendsList';

const EventSidebar = ({ timelineView, selectedDate, onTimelineChange, onCategoryFilter }) => {
  const { events, selectedEvent, selectEvent, handleToggleAttendance, isUserWaitlisted, eventCategories } = useEvents();
  const { friends, addFriend, viewFriendEvents, selectedFriend, getFriendEvents } = useFriends();
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [availableSeatsCount, setAvailableSeatsCount] = useState('any');
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedEventWithInvite, setSelectedEventWithInvite] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showJoinConfirmation, setShowJoinConfirmation] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [eventToConfirm, setEventToConfirm] = useState(null);
  const [categoryEventCounts, setCategoryEventCounts] = useState({});

  // Categories with emojis
  const categories = eventCategories || [
    { id: 'all', name: 'All Events', emoji: '✨' },
    { id: 'social', name: 'Social', emoji: '🤝' },
    { id: 'sports', name: 'Sports', emoji: '⚽' },
    { id: 'food', name: 'Food & Drinks', emoji: '🍽️' },
    { id: 'music', name: 'Music', emoji: '🎵' },
    { id: 'art', name: 'Art & Culture', emoji: '🎨' },
    { id: 'tech', name: 'Tech', emoji: '💻' },
    { id: 'outdoor', name: 'Outdoor', emoji: '🏞️' }
  ];

  // Add neighborhoods array after categories
  const neighborhoods = [
    { id: 'all', name: 'All Neighborhoods', emoji: '📍' },
    { id: 'downtown', name: 'Downtown', emoji: '🌆' },
    { id: 'mission', name: 'Mission District', emoji: '🎨' },
    { id: 'haight', name: 'Haight-Ashbury', emoji: '🌺' },
    { id: 'castro', name: 'Castro', emoji: '🌈' },
    { id: 'soma', name: 'SoMa', emoji: '🏢' },
    { id: 'marina', name: 'Marina', emoji: '⛵' },
    { id: 'richmond', name: 'Richmond', emoji: '🌊' },
    { id: 'sunset', name: 'Sunset', emoji: '🌅' },
    { id: 'nob-hill', name: 'Nob Hill', emoji: '⛰️' },
    { id: 'north-beach', name: 'North Beach', emoji: '🍝' },
    { id: 'other', name: 'Other Areas', emoji: '📌' }
  ];

  const filterOptions = [
    { id: 'all', name: 'All' },
    { id: 'available-seats', name: 'Available Seats' },
    { id: 'upcoming', name: 'Upcoming' },
    { id: 'popular', name: 'Popular' }
  ];

  // Add available seats options
  const availableSeatsOptions = [
    { value: 'any', label: 'Any number of seats' },
    { value: '1', label: '1 seat' },
    { value: '2', label: '2 seats' },
    { value: '3', label: '3 seats' },
    { value: '4', label: '4 seats' },
    { value: '5', label: '5+ seats' }
  ];

  // Show notification and auto-hide after 3 seconds
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const isEventInTimeline = (event) => {
    if (!timelineView || !selectedDate) return false;
    const eventDate = new Date(event.date);
    const selected = new Date(selectedDate);
    
    switch (timelineView) {
      case 'day':
        return eventDate.toDateString() === selected.toDateString();
      case 'week':
        const weekStart = new Date(selected);
        weekStart.setDate(selected.getDate() - selected.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return eventDate >= weekStart && eventDate <= weekEnd;
      case 'month':
        return eventDate.getMonth() === selected.getMonth() && 
               eventDate.getFullYear() === selected.getFullYear();
      default:
        return false;
    }
  };

  // Calculate event counts per category
  useEffect(() => {
    const counts = {};
    events.forEach(event => {
      counts[event.category] = (counts[event.category] || 0) + 1;
    });
    setCategoryEventCounts(counts);
  }, [events]);

  // Enhanced category toggle with map sync
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      
      // Sync with map via callback
      if (onCategoryFilter) {
        onCategoryFilter(newCategories);
      }
      
      return newCategories;
    });
  };

  // Clear all category filters
  const clearCategoryFilters = () => {
    setSelectedCategories([]);
    if (onCategoryFilter) {
      onCategoryFilter([]);
    }
  };

  // Enhanced getFilteredEvents to handle multiple categories
  const getFilteredEvents = () => {
    let filtered = [...events];

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(event => 
        selectedCategories.includes(event.category)
      );
    }

    // First filter based on active tab
    if (activeTab === 'your-events') {
      filtered = filtered.filter(event => 
        event.attendees.includes('current-user') && !isUserWaitlisted(event.id)
      );
    } else if (activeTab === 'friends' && selectedFriend) {
      filtered = getFriendEvents(selectedFriend.id);
    } else if (activeTab === 'waitlisted') {
      filtered = filtered.filter(event => isUserWaitlisted(event.id));
    } else if (activeTab === 'discover') {
      filtered = filtered.filter(event => 
        !event.attendees.includes('current-user') && !isUserWaitlisted(event.id)
      );
    }

    // Then apply additional filters
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by neighborhood
    if (selectedNeighborhood !== 'all') {
      filtered = filtered.filter(event => event.neighborhood === selectedNeighborhood);
    }

    // Apply additional filters
    switch (selectedFilter) {
      case 'available-seats':
        filtered = filtered.filter(event => {
          const availableSeats = event.maxAttendees - event.currentAttendees;
          if (availableSeatsCount === 'any') {
            return availableSeats > 0;
          } else if (availableSeatsCount === '5') {
            return availableSeats >= 5;
          } else {
            const neededSeats = parseInt(availableSeatsCount, 10);
            return availableSeats >= neededSeats;
          }
        });
        // Sort by most available seats first
        filtered.sort((a, b) => {
          const aSeats = a.maxAttendees - a.currentAttendees;
          const bSeats = b.maxAttendees - b.currentAttendees;
          return bSeats - aSeats;
        });
        break;
      case 'upcoming':
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'popular':
        filtered.sort((a, b) => b.currentAttendees - a.currentAttendees);
        break;
      default:
        break;
    }

    return {
      timelineEvents: filtered.filter(isEventInTimeline),
      otherEvents: filtered.filter(event => !isEventInTimeline(event))
    };
  };

  // Get filtered events
  const { timelineEvents, otherEvents } = getFilteredEvents();

  // Calculate total available seats for each event
  const getAvailableSeats = (event) => event.maxAttendees - event.currentAttendees;

  const handleSelectEvent = (event, openInvite = false) => {
    selectEvent(event);
    setSelectedEventWithInvite(openInvite);
  };

  const handleCloseDetails = () => {
    selectEvent(null);
  };

  const handleJoinClick = (event) => {
    setEventToConfirm(event);
    setShowJoinConfirmation(true);
    setShowLeaveConfirmation(false);
  };

  const handleLeaveClick = (event) => {
    setEventToConfirm(event);
    setShowLeaveConfirmation(true);
    setShowJoinConfirmation(false);
  };

  const handleConfirmJoin = () => {
    if (eventToConfirm) {
      handleToggleAttendance(eventToConfirm.id);
      setShowJoinConfirmation(false);
      setEventToConfirm(null);
    }
  };

  const handleConfirmLeave = () => {
    if (eventToConfirm) {
      handleToggleAttendance(eventToConfirm.id);
      setShowLeaveConfirmation(false);
      setEventToConfirm(null);
    }
  };

  const handleAddEventSubmit = (eventData) => {
    // Handle adding a new event
    setShowAddEventModal(false);
    showNotification(`Created new event: ${eventData.title}`, 'success');
  };

  const handleEventAction = (event) => {
    if (event.attendees.includes('current-user')) {
      handleLeaveClick(event);
    } else {
      handleJoinClick(event);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-xl">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' :
          notification.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        {/* Add Event Button Row */}
        <div className="px-4 py-2 border-b border-gray-100">
          <button
            onClick={() => setShowAddEventModal(true)}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-1" />
            <span>Add Event</span>
          </button>
        </div>
        
        {/* Main Navigation Row */}
        <div className="flex space-x-2 px-4 pb-4">
          <button
            className={classNames(
              'flex-1 py-2 px-2 rounded-lg text-sm whitespace-nowrap',
              activeTab === 'discover'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
            onClick={() => setActiveTab('discover')}
          >
            Discover
          </button>
          <button
            className={classNames(
              'flex-1 py-2 px-2 rounded-lg text-sm whitespace-nowrap',
              activeTab === 'your-events'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
            onClick={() => setActiveTab('your-events')}
          >
            Your Events
          </button>
          <button
            className={classNames(
              'flex-1 py-2 px-2 rounded-lg text-sm whitespace-nowrap',
              activeTab === 'friends'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
            onClick={() => setActiveTab('friends')}
          >
            Friends
          </button>
          <button
            className={classNames(
              'flex-1 py-2 px-2 rounded-lg text-sm whitespace-nowrap',
              activeTab === 'waitlisted'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
            onClick={() => setActiveTab('waitlisted')}
          >
            Waitlisted
          </button>
        </div>

        {/* Filters Section */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {filterOptions.map(filter => (
              <button
                key={filter.id}
                onClick={() => {
                  setSelectedFilter(filter.id);
                  if (filter.id !== 'available-seats') {
                    setAvailableSeatsCount('any');
                  }
                }}
                className={classNames(
                  'px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap',
                  selectedFilter === filter.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                )}
              >
                {filter.name}
              </button>
            ))}
          </div>

          {/* Available Seats Filter Dropdown */}
          {selectedFilter === 'available-seats' && (
            <div className="mt-2 flex items-center space-x-2">
              <label htmlFor="seats-filter" className="text-sm text-gray-600">
                Looking for:
              </label>
              <select
                id="seats-filter"
                value={availableSeatsCount}
                onChange={(e) => setAvailableSeatsCount(e.target.value)}
                className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {availableSeatsOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Enhanced Category Filter Bar */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Filter by Category</h3>
            {selectedCategories.length > 0 && (
              <button
                onClick={clearCategoryFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pb-2 scrollbar-hide">
            {categories.map(category => {
              const count = categoryEventCounts[category.id] || 0;
              const isSelected = selectedCategories.includes(category.id);
              
              return (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={classNames(
                    'flex flex-col items-center p-3 rounded-lg transition-all duration-200',
                    isSelected
                      ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500'
                      : count > 0
                      ? 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed opacity-50'
                  )}
                  disabled={count === 0}
                >
                  <span className="text-2xl mb-1">{category.emoji}</span>
                  <span className="text-xs text-center font-medium leading-tight">{category.name}</span>
                  {count > 0 && (
                    <span className={classNames(
                      'mt-1 px-2 py-0.5 text-xs rounded-full',
                      isSelected
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-gray-200 text-gray-600'
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Events List with Category Filter Info */}
      <div className="flex-1 overflow-y-auto">
        {selectedCategories.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
            <p className="text-sm text-blue-700">
              Showing events in: {selectedCategories.map(id => 
                categories.find(c => c.id === id)?.name
              ).join(', ')}
            </p>
          </div>
        )}
        {selectedFilter === 'available-seats' && (
          <div className="px-4 py-2 bg-purple-50 border-b border-purple-100">
            <p className="text-sm text-purple-700">
              {availableSeatsCount === 'any' 
                ? 'Showing events with available seats'
                : availableSeatsCount === '5'
                  ? 'Showing events with 5 or more available seats'
                  : `Showing events with at least ${availableSeatsCount} available seat${availableSeatsCount === '1' ? '' : 's'}`}
            </p>
          </div>
        )}
        {activeTab === 'friends' ? (
          <div className="p-4">
            <FriendsList
              friends={friends}
              onAddFriend={addFriend}
              onViewFriendEvents={viewFriendEvents}
            />
            {selectedFriend && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedFriend.name}'s Events
                </h3>
                <div className="space-y-4">
                  {getFriendEvents(selectedFriend.id).map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isSelected={selectedEvent?.id === event.id}
                      onSelect={() => handleSelectEvent(event)}
                      onToggleAttendance={handleEventAction}
                      isWaitlisted={isUserWaitlisted(event.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Timeline Events */}
            {timelineEvents.length > 0 && (
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {format(new Date(selectedDate), timelineView === 'month' ? 'MMMM yyyy' : 'MMMM d, yyyy')}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {timelineEvents.length} event{timelineEvents.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-4">
                  {timelineEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={{
                        ...event,
                        availableSeats: getAvailableSeats(event)
                      }}
                      isSelected={selectedEvent?.id === event.id}
                      onSelect={() => handleSelectEvent(event)}
                      onToggleAttendance={handleEventAction}
                      isWaitlisted={isUserWaitlisted(event.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Events */}
            {otherEvents.length > 0 && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Other Events</h3>
                  <span className="text-sm text-gray-500">
                    {otherEvents.length} event{otherEvents.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-4">
                  {otherEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={{
                        ...event,
                        availableSeats: getAvailableSeats(event)
                      }}
                      isSelected={selectedEvent?.id === event.id}
                      onSelect={() => handleSelectEvent(event)}
                      onToggleAttendance={handleEventAction}
                      isWaitlisted={isUserWaitlisted(event.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Create New Event</h3>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <EventForm
              onSubmit={handleAddEventSubmit}
              onCancel={() => setShowAddEventModal(false)}
            />
          </div>
        </div>
      )}

      {/* Event Details Overlay */}
      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => {
            handleSelectEvent(null);
            setSelectedEventWithInvite(false);
          }}
          onJoinEvent={handleJoinClick}
          openInviteDirectly={selectedEventWithInvite}
        />
      )}

      {/* Join Confirmation Modal */}
      {showJoinConfirmation && eventToConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Join Event</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to join "{eventToConfirm.title}"? 
              {eventToConfirm.currentAttendees < eventToConfirm.minAttendees && (
                <span className="block mt-2 text-yellow-600">
                  Note: This event needs {eventToConfirm.minAttendees - eventToConfirm.currentAttendees} more people to meet the minimum capacity.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowJoinConfirmation(false);
                  setEventToConfirm(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmJoin}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveConfirmation && eventToConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Leave Event</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to leave "{eventToConfirm.title}"? 
              {eventToConfirm.currentAttendees <= eventToConfirm.minAttendees && (
                <span className="block mt-2 text-red-600">
                  Warning: This event currently has the minimum number of attendees. If you leave, it may not meet the required capacity.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowLeaveConfirmation(false);
                  setEventToConfirm(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLeave}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirm Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EventCard = ({ event, isSelected, onSelect, onToggleAttendance, isWaitlisted }) => {
  const { handleToggleAttendance, isUserWaitlisted } = useEvents();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [notification, setNotification] = useState(null);

  const isUserAttending = event.attendees.includes('current-user');
  const hasDeadline = event.registrationDeadline && new Date(event.registrationDeadline) > new Date();
  const isPastDeadline = event.registrationDeadline && new Date(event.registrationDeadline) <= new Date();
  const currentAttendees = event.currentAttendees;
  const peopleNeeded = event.minAttendees - currentAttendees;
  const isUrgent = peopleNeeded > 0 && hasDeadline && new Date(event.registrationDeadline) - new Date() < 24 * 60 * 60 * 1000;
  const needsMorePeople = peopleNeeded > 0 && hasDeadline && !isPastDeadline;

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleInvite = (e) => {
    e.stopPropagation();
    setShowInviteModal(true);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    setShowShareOptions(true);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    try {
      // Here you would typically make an API call to send the invite
      // For now, we'll just show a success message
      showNotification(`Invitation sent to ${inviteEmail}`, 'success');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteMessage('');
    } catch (error) {
      showNotification('Failed to send invitation. Please try again.', 'error');
    }
  };

  const handleCopyLink = async () => {
    try {
      const eventUrl = `${window.location.origin}/events/${event.id}`;
      await navigator.clipboard.writeText(eventUrl);
      showNotification('Event link copied to clipboard!', 'success');
      setShowShareOptions(false);
    } catch (error) {
      showNotification('Failed to copy link. Please try again.', 'error');
    }
  };

  return (
    <>
      <div
        className={classNames(
          'relative p-4 rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden',
          isSelected ? 'border-rose-500 bg-rose-50' : 
          needsMorePeople ? 'border-purple-500 bg-purple-50' :
          'border-gray-200 hover:border-rose-300 hover:bg-rose-50/50',
          isWaitlisted ? 'opacity-75' : ''
        )}
        onClick={() => onSelect(event)}
      >
        <div className="flex items-start justify-between space-x-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-2xl shrink-0">{event.emoji}</span>
              <h3 className="text-lg font-semibold text-gray-900 min-w-0 truncate">
                {event.title.replace(`${event.emoji} `, '')}
              </h3>
              {isWaitlisted && (
                <span className="shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                  Waitlisted
                </span>
              )}
              {needsMorePeople && (
                <span className="shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                  Needs {peopleNeeded} more {peopleNeeded === 1 ? 'person' : 'people'}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{event.description}</p>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>{format(new Date(event.date), 'MMM d')} at {event.time}</span>
            </div>
            <div className="mt-1 flex items-center text-sm text-gray-500">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>{event.location}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <UserGroupIcon className="h-4 w-4 text-gray-500 shrink-0" />
              <span className={classNames(
                'text-sm font-medium',
                currentAttendees >= event.minAttendees ? 'text-green-600' : 'text-purple-600'
              )}>
                {currentAttendees}/{event.minAttendees} attending
              </span>
            </div>
            {needsMorePeople && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleInvite}
                  className={classNames(
                    'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap',
                    isUrgent
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                  )}
                >
                  <UserPlusIcon className="h-4 w-4 mr-1 shrink-0" />
                  Invite {peopleNeeded} more {peopleNeeded === 1 ? 'person' : 'people'}
                </button>
                {isUrgent && (
                  <span className="text-xs text-red-600 whitespace-nowrap">
                    Registration ends soon!
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="shrink-0">
            {!isUserAttending && !isWaitlisted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAttendance(event);
                }}
                className={classNames(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  currentAttendees < event.maxAttendees
                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                )}
              >
                {currentAttendees < event.maxAttendees ? 'Join' : 'Full'}
              </button>
            )}
            {isUserAttending && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAttendance(event);
                }}
                className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                Leave
              </button>
            )}
            {isWaitlisted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAttendance(event);
                }}
                className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                Leave Waitlist
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-semibold">Invite People to {event.title}</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* People Needed Banner */}
            {needsMorePeople && (
              <div className="bg-green-50 p-4 flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-green-600" />
                <p className="text-green-700">
                  This event needs {peopleNeeded} more {peopleNeeded === 1 ? 'person' : 'people'} to happen
                </p>
              </div>
            )}

            <div className="p-4 space-y-6">
              {/* Share Event Link */}
              <div className="space-y-2">
                <h4 className="text-base font-medium text-gray-900">Share Event Link</h4>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/event/${event.id}`}
                    className="flex-1 bg-transparent border-none text-sm text-gray-600 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Send Email Invite */}
              <div className="space-y-2">
                <h4 className="text-base font-medium text-gray-900">Send Email Invite</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendInvite}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Send
                  </button>
                </div>
              </div>

              {/* Share on Social Media */}
              <div className="space-y-2">
                <h4 className="text-base font-medium text-gray-900">Share on Social Media</h4>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-4 text-sm font-medium text-[#1DA1F2] bg-[#E8F5FD] rounded hover:bg-[#d4edfb]">
                    Share on Twitter
                  </button>
                  <button className="flex-1 py-2 px-4 text-sm font-medium text-[#4267B2] bg-[#E7EEF8] rounded hover:bg-[#d9e4f6]">
                    Share on Facebook
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Options Modal */}
      {showShareOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Share Event</h3>
              <button
                onClick={() => setShowShareOptions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/events/${event.id}`}
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                >
                  Copy Link
                </button>
              </div>
              <div className="flex justify-center space-x-4">
                <button className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </button>
                <button className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' :
          notification.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          <CheckCircleIcon className="h-5 w-5 mr-2" />
          <span>{notification.message}</span>
        </div>
      )}
    </>
  );
};

export default EventSidebar; 