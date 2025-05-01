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
    { id: 'all', name: 'All', icon: '✨' },
    { id: 'available-seats', name: 'Available Seats', icon: '💺' },
    { id: 'upcoming', name: 'Upcoming', icon: '📅' },
    { id: 'popular', name: 'Popular', icon: '🔥' },
    { id: 'vip', name: 'VIP Only', icon: '👑' }
  ];

  // Add available seats options
  const availableSeatsOptions = [
    { value: 'any', label: 'Any number of seats', icon: '🎫' },
    { value: '1', label: '1 seat', icon: '👤' },
    { value: '2', label: '2 seats', icon: '👥' },
    { value: '3', label: '3 seats', icon: '👥' },
    { value: '4', label: '4 seats', icon: '👥' },
    { value: '5', label: '5+ seats', icon: '👥' }
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

    // Apply additional filters and sorting
    switch (selectedFilter) {
      case 'vip':
        filtered = filtered.filter(event => 
          event.isVIP === true || event.category === 'vip' || event.eventType === 'vip'
        );
        break;
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
        // Default sorting logic for 'all' filter
        filtered.sort((a, b) => {
          const now = new Date();
          const aDate = new Date(a.date);
          const bDate = new Date(b.date);
          
          // First, prioritize events happening today
          const aIsToday = aDate.toDateString() === now.toDateString();
          const bIsToday = bDate.toDateString() === now.toDateString();
          if (aIsToday && !bIsToday) return -1;
          if (!aIsToday && bIsToday) return 1;
          
          // Then, prioritize events with more available seats
          const aSeats = a.maxAttendees - a.currentAttendees;
          const bSeats = b.maxAttendees - b.currentAttendees;
          if (aSeats !== bSeats) return bSeats - aSeats;
          
          // Finally, sort by date
          return aDate - bDate;
        });
        break;
    }

    // Split events into timeline and other events
    const timelineEvents = filtered.filter(isEventInTimeline);
    const otherEvents = filtered.filter(event => !isEventInTimeline(event));

    // Sort other events based on timeline view
    if (timelineView === 'day') {
      otherEvents.sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        const now = new Date();
        
        // Prioritize events happening today
        const aIsToday = aDate.toDateString() === now.toDateString();
        const bIsToday = bDate.toDateString() === now.toDateString();
        if (aIsToday && !bIsToday) return -1;
        if (!aIsToday && bIsToday) return 1;
        
        // Then sort by date
        return aDate - bDate;
      });
    } else if (timelineView === 'week') {
      otherEvents.sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        // Prioritize events in the current week
        const aInWeek = aDate >= weekStart && aDate <= weekEnd;
        const bInWeek = bDate >= weekStart && bDate <= weekEnd;
        if (aInWeek && !bInWeek) return -1;
        if (!aInWeek && bInWeek) return 1;
        
        // Then sort by date
        return aDate - bDate;
      });
    } else if (timelineView === 'month') {
      otherEvents.sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        const now = new Date();
        
        // Prioritize events in the current month
        const aInMonth = aDate.getMonth() === now.getMonth() && aDate.getFullYear() === now.getFullYear();
        const bInMonth = bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
        if (aInMonth && !bInMonth) return -1;
        if (!aInMonth && bInMonth) return 1;
        
        // Then sort by date
        return aDate - bDate;
      });
    }

    return { timelineEvents, otherEvents };
  };

  // Get filtered events
  const { timelineEvents, otherEvents } = getFilteredEvents();

  // Calculate total available seats for each event
  const getAvailableSeats = (event) => event.maxAttendees - event.currentAttendees;

  const handleSelectEvent = (event, openInvite = false) => {
    console.log('handleSelectEvent called with:', {
      title: event?.title,
      id: event?.id,
      openInvite
    });
    
    if (event) {
      // First select the event
      selectEvent(event);
      // Then set the invite state if needed
      setSelectedEventWithInvite(openInvite);
    }
  };

  const handleCloseDetails = () => {
    console.log('handleCloseDetails called');
    // Reset both states when closing
    selectEvent(null);
    setSelectedEventWithInvite(false);
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
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter Events</h3>
          <div className="flex flex-wrap gap-2">
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
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  selectedFilter === filter.id
                    ? filter.id === 'vip'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                )}
              >
                <span>{filter.icon}</span>
                <span>{filter.name}</span>
                {selectedFilter === filter.id && filter.id === 'vip' && (
                  <div className="ml-1 px-1.5 py-0.5 text-xs bg-purple-200 text-purple-800 rounded">
                    Active
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Show active filter info for VIP */}
          {selectedFilter === 'vip' && (
            <div className="mt-3 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg">
              <p className="text-sm text-purple-700 flex items-center">
                <span className="mr-2">👑</span>
                Showing VIP events only
              </p>
            </div>
          )}

          {/* Enhanced Available Seats Filter */}
          {selectedFilter === 'available-seats' && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Available Seats</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {availableSeatsOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setAvailableSeatsCount(option.value)}
                    className={classNames(
                      'flex flex-col items-center justify-center p-2 rounded-lg border transition-colors',
                      availableSeatsCount === option.value
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <span className="text-xl mb-1">{option.icon}</span>
                    <span className="text-xs">{option.label}</span>
                  </button>
                ))}
              </div>
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
                      onSelect={handleSelectEvent}
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
                      onSelect={handleSelectEvent}
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
                      onSelect={handleSelectEvent}
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
            handleCloseDetails();
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
  const { isUserAttending, canEditEvent } = useEvents();
  const { friends } = useFriends();
  const isAttending = isUserAttending(event.id);
  const canInvite = canEditEvent(event) || isAttending;
  const isVIP = event.isVIP || event.category === 'vip' || event.eventType === 'vip';

  // Calculate attendance info
  const currentAttendees = event.attendees?.length || 0;
  const maxAttendees = event.maxAttendees || 10;
  const spotsLeft = maxAttendees - currentAttendees;
  
  // Get friend attendees (for development, ensure event.attendees exists)
  const friendAttendees = (event.attendees || [])
    .filter(attendeeId => friends?.some(friend => friend.id === attendeeId))
    .map(attendeeId => friends?.find(friend => friend.id === attendeeId))
    .filter(Boolean);

  const handleInviteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Invite button clicked for event:', event.title);
    onSelect(event, true);
  };

  return (
    <div
      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 relative ${
        isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200 hover:border-blue-300'
      }`}
      onClick={(e) => {
        e.preventDefault();
        onSelect(event, false);
      }}
    >
      <div className="flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{event.title}</h3>
            {isVIP && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                VIP
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleAttendance(event);
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isAttending
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : isWaitlisted
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isAttending ? 'Attending' : isWaitlisted ? 'Waitlisted' : 'Join'}
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-3">{event.description}</p>
          
        {/* Event Details */}
        <div className="space-y-2">
          {/* Date and Time */}
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4 mr-1.5" />
              <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 mr-1.5" />
              <span>{event.time || '7:00 PM'}</span>
            </div>
          </div>
            
          {/* Location */}
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="w-4 h-4 mr-1.5" />
            <span>{event.location || 'San Francisco, CA'}</span>
          </div>

          {/* Attendance Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <UserGroupIcon className="w-4 h-4 mr-1.5" />
              <span>{currentAttendees} attending</span>
              {spotsLeft > 0 && (
                <span className="ml-1 text-green-600">
                  ({spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left)
                </span>
              )}
            </div>
            {friendAttendees.length > 0 && (
              <div className="text-blue-600">
                {friendAttendees[0]?.name} {friendAttendees.length > 1 ? `+ ${friendAttendees.length - 1} friends` : 'is going'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Button - Positioned absolutely in bottom right */}
      {canInvite && (
        <button
          onClick={handleInviteClick}
          className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors shadow-sm"
          title="Invite friends"
          type="button"
        >
          <UserPlusIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default EventSidebar; 