import React, { useState } from 'react';
import { UserGroupIcon, MagnifyingGlassIcon, CalendarIcon, UserPlusIcon, PlusIcon, XMarkIcon, ClockIcon, ShareIcon } from '@heroicons/react/24/outline';
import { classNames } from '../utils/classNames';
import EventDetails from './EventDetails';
import EventForm from './EventForm';
import { useEvents } from '../contexts/EventContext';
import { format } from 'date-fns';

const EventSidebar = ({ events, selectedEvent, onAddEvent }) => {
  const { handleToggleAttendance, selectEvent, isUserWaitlisted } = useEvents();
  const [view, setView] = useState('discover'); // Default to discover view
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPeopleNeeded, setSelectedPeopleNeeded] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedEventWithInvite, setSelectedEventWithInvite] = useState(false);

  // Main navigation options
  const mainNavOptions = [
    {
      id: 'discover',
      name: 'Discover',
      icon: MagnifyingGlassIcon,
      count: events.filter(e => !e.attendees.includes('current-user')).length
    },
    {
      id: 'attending',
      name: 'Your Events',
      icon: CalendarIcon,
      count: events.filter(e => e.attendees.includes('current-user')).length
    },
    {
      id: 'waitlisted',
      name: 'Waitlisted',
      icon: ClockIcon,
      count: events.filter(e => isUserWaitlisted(e.id)).length
    }
  ];

  // Categories with emojis
  const categories = [
    { id: 'all', name: 'All Events', emoji: '✨' },
    { id: 'social', name: 'Social', emoji: '🤝' },
    { id: 'sports', name: 'Sports', emoji: '⚽' },
    { id: 'food', name: 'Food & Drinks', emoji: '🍽️' },
    { id: 'music', name: 'Music', emoji: '🎵' },
    { id: 'art', name: 'Art & Culture', emoji: '🎨' },
    { id: 'tech', name: 'Tech', emoji: '💻' },
    { id: 'outdoor', name: 'Outdoor', emoji: '🏞️' }
  ];

  // People needed options
  const peopleNeededOptions = [
    { id: 'all', label: 'Any Size', icon: UserGroupIcon },
    { id: '1', label: '+1 Person', number: 1 },
    { id: '2', label: '+2 People', number: 2 },
    { id: '3', label: '+3 People', number: 3 },
    { id: '4', label: '+4 People', number: 4 },
    { id: '5+', label: '5+ People', number: 5 }
  ];

  // Filter events based on all criteria
  const getFilteredEvents = () => {
    return events.filter(event => {
      // Filter by view (discover/attending/waitlisted)
      const viewMatch = view === 'discover' 
        ? !event.attendees.includes('current-user') && !isUserWaitlisted(event.id)
        : view === 'attending'
        ? event.attendees.includes('current-user')
        : isUserWaitlisted(event.id);

      // Filter by category
      const categoryMatch = selectedCategory === 'all' || event.category === selectedCategory;

      // Filter by people needed
      const currentAttendees = event.attendees.length;
      const peopleNeeded = event.minAttendees - currentAttendees;
      const peopleNeededMatch = selectedPeopleNeeded === 'all' || 
        (selectedPeopleNeeded === '5+' ? peopleNeeded >= 5 : peopleNeeded === parseInt(selectedPeopleNeeded));

      // Filter by search query - safely handle undefined values
      const searchMatch = !searchQuery || (
        (event.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (event.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      );

      return viewMatch && categoryMatch && peopleNeededMatch && searchMatch;
    });
  };

  const handleSelectEvent = (event, openInvite = false) => {
    selectEvent(event);
    setSelectedEventWithInvite(openInvite);
  };

  const handleCloseDetails = () => {
    selectEvent(null);
  };

  const handleJoinEvent = async (event) => {
    if (event && event.id) {
      try {
        await handleToggleAttendance(event.id);
        // After toggling attendance, we should update the selected event
        // Find the updated event from the events list
        const updatedEvent = events.find(e => e.id === event.id);
        if (updatedEvent) {
          selectEvent(updatedEvent);
        }
      } catch (error) {
        console.error('Error joining event:', error);
      }
    }
  };

  const handleAddEvent = (eventData) => {
    onAddEvent(eventData);
    setShowAddEventModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-xl">
      {/* Main Navigation */}
      <div className="flex items-center gap-2 p-2 border-b">
        {mainNavOptions.map(option => (
          <button
            key={option.id}
            onClick={() => setView(option.id)}
            className={`
              flex items-center justify-center flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${view === option.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            <option.icon className="w-5 h-5 mr-2" />
            {option.name}
            <span className="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
              {option.count}
            </span>
          </button>
        ))}
        
        {/* Add Event Button */}
        <button
          onClick={() => setShowAddEventModal(true)}
          className="flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          <span className="font-medium">Add Event</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category Filters - Horizontal Scrollable */}
      <div className="p-2 border-b overflow-x-auto">
        <div className="flex space-x-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={classNames(
                'flex items-center px-3 py-1.5 rounded-full whitespace-nowrap text-sm transition-colors',
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <span className="mr-1">{category.emoji}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* People Needed Filter */}
      <div className="p-2 border-b">
        <div className="flex flex-wrap gap-2">
          {peopleNeededOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedPeopleNeeded(option.id)}
              className={classNames(
                'flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors',
                selectedPeopleNeeded === option.id
                  ? 'bg-green-100 text-green-600 border-2 border-green-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {option.icon ? (
                <option.icon className="w-4 h-4 mr-1" />
              ) : (
                <UserPlusIcon className="w-4 h-4 mr-1" />
              )}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y">
          {getFilteredEvents().map(event => {
            const currentAttendees = event.attendees.length;
            const peopleNeeded = Math.max(0, event.minAttendees - currentAttendees);
            const isUrgent = peopleNeeded > 0 && event.registrationDeadline && 
              new Date(event.registrationDeadline) > new Date() &&
              new Date(event.registrationDeadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            const isUserAttending = event.attendees.includes('current-user');
            const isPastDeadline = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();

            return (
              <div
                key={event.id}
                className={classNames(
                  'w-full p-4 transition-colors hover:bg-gray-50 relative',
                  selectedEvent?.id === event.id ? 'bg-blue-50' : '',
                  peopleNeeded > 0 && !isPastDeadline ? 'border-l-4 border-green-500' : ''
                )}
              >
                <button
                  onClick={() => handleSelectEvent(event)}
                  className="w-full text-left"
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{event.emoji}</span>
                        <h3 className="font-medium text-gray-900">{event.title}</h3>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{event.description}</p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {new Date(event.date).toLocaleDateString()} at {event.time}
                      </div>
                      {/* People needed indicator with invite action */}
                      {peopleNeeded > 0 && (
                        <div className={classNames(
                          'mt-2 inline-flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-sm',
                          isPastDeadline ? 'bg-gray-50' : isUrgent ? 'bg-red-50' : 'bg-green-50'
                        )}>
                          <div className="flex items-center">
                            <UserGroupIcon className={classNames(
                              'w-4 h-4 mr-2',
                              isPastDeadline ? 'text-gray-500' : isUrgent ? 'text-red-600' : 'text-green-600'
                            )} />
                            <div className={isPastDeadline ? 'text-gray-600' : isUrgent ? 'text-red-800' : 'text-green-800'}>
                              <span className="font-bold">{peopleNeeded}</span> more needed
                              {isUrgent && !isPastDeadline && (
                                <span className="ml-1 text-xs">
                                  • Deadline soon
                                </span>
                              )}
                              {isPastDeadline && (
                                <span className="ml-1 text-xs">
                                  • Registration closed
                                </span>
                              )}
                            </div>
                          </div>
                          {isUserAttending && !isPastDeadline && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectEvent(event, true);
                              }}
                              className={classNames(
                                'flex items-center ml-2 px-2 py-1 rounded-md transition-colors',
                                isUrgent 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              )}
                            >
                              <ShareIcon className="w-3.5 h-3.5" />
                              <span className="ml-1 text-xs font-medium">Invite</span>
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Registration deadline */}
                      {event.registrationDeadline && (
                        <div className={classNames(
                          'mt-1 text-xs',
                          isPastDeadline ? 'text-red-500' : 'text-gray-500'
                        )}>
                          <ClockIcon className="w-3 h-3 inline mr-1" />
                          {isPastDeadline ? 'Registration closed' : `Register by ${format(new Date(event.registrationDeadline), 'MMM d')}`}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
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
              onSubmit={handleAddEvent}
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
          onJoinEvent={handleJoinEvent}
          openInviteDirectly={selectedEventWithInvite}
        />
      )}
    </div>
  );
};

export default EventSidebar; 