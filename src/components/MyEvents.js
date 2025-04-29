import React, { useState } from 'react';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';

const MyEvents = () => {
  const { events, loading, error } = useEvents();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter events to show only those created by the current user
  const myEvents = events.filter(event => event.hostId === user?.id);

  const filteredEvents = myEvents.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full text-xs';
      case 'cancelled':
        return 'bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs';
      default:
        return 'bg-gray-50 text-gray-700 px-2 py-1 rounded-full text-xs';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading your events...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your hosted events</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm font-medium text-gray-500">Total Events</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">{myEvents.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm font-medium text-gray-500">Confirmed Events</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {myEvents.filter(e => e.status === 'confirmed').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm font-medium text-gray-500">Pending Events</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {myEvents.filter(e => e.status === 'pending').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm font-medium text-gray-500">Total Attendees</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {myEvents.reduce((sum, event) => sum + (event.attendees?.length || 0), 0)}
            </div>
          </div>
        </div>

        {/* Search and Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="w-64">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Event
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Event</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Date</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Attendees</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="border-t border-gray-100">
                      <td className="py-4">
                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-500">{event.description}</div>
                      </td>
                      <td className="py-4 text-sm text-gray-500">{formatDate(event.date)}</td>
                      <td className="py-4">
                        <span className={getStatusBadge(event.status)}>{event.status}</span>
                      </td>
                      <td className="py-4 text-sm text-gray-500">{event.attendees?.length || 0}</td>
                      <td className="py-4 text-sm text-gray-500">{event.capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyEvents; 