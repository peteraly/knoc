import React, { useState } from 'react';
import { format } from 'date-fns';

const EventsSidebar = ({ events, onAddEvent, onEditEvent, onDeleteEvent }) => {
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '12:00',
    location: '',
    coordinates: [-77.0369, 38.9072], // Default to DC
    emoji: '📍',
    category: 'social'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEvent) {
      onEditEvent({ ...newEvent, id: editingEvent.id });
      setEditingEvent(null);
    } else {
      onAddEvent({ ...newEvent, id: Date.now() });
    }
    setNewEvent({
      title: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '12:00',
      location: '',
      coordinates: [-77.0369, 38.9072],
      emoji: '📍',
      category: 'social'
    });
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setNewEvent(event);
  };

  const handleDelete = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      onDeleteEvent(eventId);
      if (editingEvent?.id === eventId) {
        setEditingEvent(null);
        setNewEvent({
          title: '',
          description: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          time: '12:00',
          location: '',
          coordinates: [-77.0369, 38.9072],
          emoji: '📍',
          category: 'social'
        });
      }
    }
  };

  return (
    <div className="w-96 bg-white h-full overflow-auto shadow-lg">
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">
          {editingEvent ? 'Edit Event' : 'Add New Event'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows="3"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={newEvent.category}
                onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="social">Social</option>
                <option value="food">Food</option>
                <option value="culture">Culture</option>
                <option value="fitness">Fitness</option>
                <option value="music">Music</option>
                <option value="tour">Tour</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Emoji</label>
              <select
                value={newEvent.emoji}
                onChange={(e) => setNewEvent({ ...newEvent, emoji: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="📍">📍 Pin</option>
                <option value="🎉">🎉 Party</option>
                <option value="🍽️">🍽️ Food</option>
                <option value="🎵">🎵 Music</option>
                <option value="🏃‍♂️">🏃‍♂️ Fitness</option>
                <option value="🎨">🎨 Art</option>
                <option value="📚">📚 Book</option>
                <option value="🎭">🎭 Theater</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {editingEvent ? 'Update Event' : 'Add Event'}
          </button>
        </form>

        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Current Events</h3>
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{event.emoji} {event.title}</h4>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {format(new Date(`${event.date}T${event.time}`), 'PPp')}
                    </p>
                    <p className="text-sm text-gray-500">{event.location}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(event)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsSidebar; 