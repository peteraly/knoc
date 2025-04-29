import React, { useState, useRef } from 'react';
import EventForm from './EventForm';
import { useEvents } from '../contexts/EventContext';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import EventCard from './EventCard';

const EventSidebar = ({ 
  events, 
  onAddEvent, 
  onEditEvent, 
  onDeleteEvent, 
  selectedEvent,
  onEventSelect,
  isPortrait
}) => {
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');
  const scrollContainerRef = useRef(null);
  const { isUserAttending, isUserWaitlisted } = useEvents();

  // Switch to the appropriate tab when an event's status changes
  React.useEffect(() => {
    if (selectedEvent) {
      if (isUserAttending(selectedEvent.id)) {
        setActiveTab('confirmed');
      } else if (isUserWaitlisted(selectedEvent.id)) {
        setActiveTab('waitlist');
      } else {
        setActiveTab('discover');
      }
    }
  }, [selectedEvent, isUserAttending, isUserWaitlisted, events]);

  const handleAddEvent = (eventData) => {
    onAddEvent(eventData);
    setIsAddingEvent(false);
  };

  const handleEditEvent = (eventData) => {
    onEditEvent(editingEvent.id, eventData);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      onDeleteEvent(eventId);
    }
  };

  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    const scrollAmount = direction === 'left' ? -300 : 300;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleEventSelect = (event) => {
    onEventSelect(event.id === selectedEvent?.id ? null : event);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    onEventSelect(null);
  };

  if (isAddingEvent || editingEvent) {
    return (
      <div className={`fixed inset-0 z-50 bg-white overflow-y-auto`}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => isAddingEvent ? setIsAddingEvent(false) : setEditingEvent(null)}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Back to Events
            </button>
            <h2 className="text-2xl font-semibold">
              {isAddingEvent ? 'Add New Event' : 'Edit Event'}
            </h2>
            <div className="w-24" /> {/* Spacer for alignment */}
          </div>
          
          <EventForm
            initialData={editingEvent}
            onSubmit={isAddingEvent ? handleAddEvent : handleEditEvent}
            onCancel={() => isAddingEvent ? setIsAddingEvent(false) : setEditingEvent(null)}
          />
        </div>
      </div>
    );
  }

  // Sort events to prioritize user's events and selected event
  const sortedEvents = [...events].sort((a, b) => {
    // First priority: Selected event
    if (a.id === selectedEvent?.id) return -1;
    if (b.id === selectedEvent?.id) return 1;

    // Second priority: Sort by date
    return new Date(a.date) - new Date(b.date);
  });

  // Group events by user's involvement
  const groupedEvents = sortedEvents.reduce((acc, event) => {
    if (isUserAttending(event.id)) {
      acc.confirmed.push(event);
    } else if (isUserWaitlisted(event.id)) {
      acc.waitlist.push(event);
    } else {
      acc.discover.push(event);
    }
    return acc;
  }, { discover: [], confirmed: [], waitlist: [] });

  // Get events for the active tab
  const getActiveTabEvents = () => {
    switch (activeTab) {
      case 'discover':
        return groupedEvents.discover;
      case 'confirmed':
        return groupedEvents.confirmed;
      case 'waitlist':
        return groupedEvents.waitlist;
      default:
        return [];
    }
  };

  // Get tab count
  const getTabCount = (tab) => {
    switch (tab) {
      case 'discover':
        return groupedEvents.discover.length;
      case 'confirmed':
        return groupedEvents.confirmed.length;
      case 'waitlist':
        return groupedEvents.waitlist.length;
      default:
        return 0;
    }
  };

  return (
    <div className={`${isPortrait ? 'h-full' : 'h-full'} bg-white relative ${isPortrait ? 'border-b' : 'border-r'} border-gray-200 transition-all duration-300 ease-in-out ${
      showDetails ? (isPortrait ? 'h-[500px]' : 'w-[900px]') : (isPortrait ? 'h-32' : 'w-[420px]')
    }`}>
      <div className={`flex ${isPortrait ? 'flex-col' : 'h-full'}`}>
        {/* Main Sidebar Content */}
        <div className={`${isPortrait ? 'p-2' : 'p-6'} overflow-auto ${showDetails ? (isPortrait ? 'h-[452px]' : 'w-[420px]') : 'w-full h-full'}`}>
          <div className={`flex justify-between items-center ${isPortrait ? 'mb-1' : 'mb-8'}`}>
            <h2 className={`${isPortrait ? 'text-base' : 'text-2xl'} font-semibold`}>Events</h2>
            <button
              onClick={() => setIsAddingEvent(true)}
              className={`${isPortrait ? 'px-3 py-1' : 'px-6 py-2.5'} text-sm font-medium text-white bg-rose-500 rounded-md hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500`}
            >
              Add Event
            </button>
          </div>

          {/* Tabs */}
          <div className={`border-b border-gray-200 ${isPortrait ? 'mb-1' : 'mb-8'}`}>
            <nav className="-mb-px flex space-x-4">
              <button
                onClick={() => setActiveTab('discover')}
                className={`${isPortrait ? 'py-1' : 'py-4'} px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'discover'
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Discover
                <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-1.5 rounded-full text-xs">
                  {getTabCount('discover')}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('confirmed')}
                className={`${isPortrait ? 'py-1' : 'py-4'} px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'confirmed'
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Confirmed
                <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-1.5 rounded-full text-xs">
                  {getTabCount('confirmed')}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('waitlist')}
                className={`${isPortrait ? 'py-1' : 'py-4'} px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'waitlist'
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Waitlist
                <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-1.5 rounded-full text-xs">
                  {getTabCount('waitlist')}
                </span>
              </button>
            </nav>
          </div>

          {/* Events List */}
          <div>
            <div className={`flex justify-between items-center ${isPortrait ? 'mb-2' : 'mb-4'}`}>
              <h3 className="text-sm font-medium text-gray-500">
                {activeTab === 'discover' ? 'Discover Events' : 
                 activeTab === 'confirmed' ? 'Your Confirmed Events' : 
                 'Your Waitlisted Events'}
              </h3>
              {isPortrait && (
                <div className="flex gap-2">
                  <button
                    onClick={() => scroll('left')}
                    className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    aria-label="Scroll left"
                  >
                    <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => scroll('right')}
                    className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    aria-label="Scroll right"
                  >
                    <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
            <div
              ref={scrollContainerRef}
              className={`${
                isPortrait 
                  ? 'flex gap-3 overflow-x-auto pb-2 scrollbar-hide'
                  : 'grid grid-cols-1 gap-4 overflow-y-auto pb-6'
              }`}
              style={{
                ...(isPortrait ? {
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  paddingLeft: '8px',
                  paddingRight: '8px'
                } : {
                  maxHeight: 'calc(100vh - 240px)'
                })
              }}
            >
              {getActiveTabEvents().map(event => (
                <div
                  key={event.id}
                  className={`${isPortrait ? 'flex-none w-[280px]' : 'w-full'}`}
                  style={isPortrait ? { scrollSnapAlign: 'start' } : {}}
                >
                  <div
                    className={`transition-all duration-200 ${
                      selectedEvent?.id === event.id ? 'ring-2 ring-rose-500 rounded-lg' : ''
                    } bg-white shadow-sm hover:shadow-md rounded-lg`}
                    onClick={() => handleEventSelect(event)}
                  >
                    <EventCard
                      event={event}
                      type={activeTab}
                      onEdit={setEditingEvent}
                      onDelete={handleDeleteEvent}
                      isPortrait={isPortrait}
                    />
                  </div>
                </div>
              ))}
              {getActiveTabEvents().length === 0 && (
                <div className={`${isPortrait ? 'flex-none w-full' : 'w-full'} p-3 text-center text-gray-500`}>
                  {activeTab === 'discover' ? 'No events to discover' : 
                   activeTab === 'confirmed' ? 'You are not attending any events' : 
                   'Your Waitlisted Events'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        {showDetails && selectedEvent && (
          <div className={`${
            isPortrait 
              ? 'fixed left-0 right-0 top-32 bottom-0 z-30 bg-white'
              : 'fixed left-[420px] w-[480px] h-full border-l border-gray-200'
          }`}>
            <div className={`${isPortrait ? 'p-4' : 'p-8'} h-full overflow-y-auto`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium text-gray-900">Event Details</h3>
                <button
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h4>
                  <p className="mt-2 text-gray-600">{selectedEvent.description}</p>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(selectedEvent.date).toLocaleDateString()} at {selectedEvent.time}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedEvent.location}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedEvent.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          selectedEvent.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedEvent.status}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Attendees</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedEvent.attendees?.length || 0} / {selectedEvent.maxAttendees}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingEvent(selectedEvent)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Edit Event
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Delete Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventSidebar; 