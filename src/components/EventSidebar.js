import React, { useState } from 'react';
import EventForm from './EventForm';
import { useEvents } from '../contexts/EventContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
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
  const [activeFilter, setActiveFilter] = useState('confirmed');
  const { isUserAttending, isUserWaitlisted } = useEvents();

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
              <XMarkIcon className="h-5 w-5 mr-1" />
              Back
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

  // Group events by user's involvement
  const groupedEvents = events.reduce((acc, event) => {
    if (isUserAttending(event.id)) {
      acc.confirmed.push(event);
    } else if (isUserWaitlisted(event.id)) {
      acc.waitlist.push(event);
    } else {
      acc.discover.push(event);
    }
    return acc;
  }, { discover: [], confirmed: [], waitlist: [] });

  const FilterButton = ({ filter, label, count }) => (
    <button
      onClick={() => setActiveFilter(filter)}
      className={`px-4 py-2 flex items-center justify-center ${
        activeFilter === filter 
          ? 'bg-rose-500 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } rounded-md transition-colors duration-200`}
    >
      <span className="font-medium">{label}</span>
      <span className={`ml-2 px-2 py-0.5 rounded-full text-sm ${
        activeFilter === filter
          ? 'bg-rose-400 text-white'
          : 'bg-gray-200 text-gray-600'
      }`}>
        {count}
      </span>
    </button>
  );

  const renderEventList = (events) => (
    <div className="grid gap-4 auto-rows-max">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          onClick={() => handleEventSelect(event)}
        >
          <EventCard
            event={event}
            type={activeFilter}
            isActive={selectedEvent?.id === event.id}
          />
        </div>
      ))}
      {events.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No events to display
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Events</h2>
          <button
            onClick={() => setIsAddingEvent(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-rose-500 rounded-md hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            Add Event
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {/* Filter buttons */}
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex gap-2">
            <FilterButton 
              filter="confirmed" 
              label="Your Events" 
              count={groupedEvents.confirmed.length} 
            />
            <FilterButton 
              filter="discover" 
              label="Discover" 
              count={groupedEvents.discover.length} 
            />
          </div>
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderEventList(
            activeFilter === 'confirmed' ? groupedEvents.confirmed : groupedEvents.discover
          )}
        </div>
      </div>

      {/* Event Details Panel */}
      {showDetails && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold">{selectedEvent.title}</h2>
              <button
                onClick={handleCloseDetails}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-gray-900">{selectedEvent.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                <p className="mt-1 text-gray-900">
                  {new Date(selectedEvent.date).toLocaleDateString()} at {selectedEvent.time}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1 text-gray-900">{selectedEvent.location}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1 text-gray-900 capitalize">{selectedEvent.status}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Attendees</h3>
                <p className="mt-1 text-gray-900">
                  {selectedEvent.attendees.length} / {selectedEvent.maxAttendees}
                </p>
              </div>

              <div className="flex gap-4">
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
  );
};

export default EventSidebar; 