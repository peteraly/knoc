import React, { useState, useEffect } from 'react';
import { useEvents } from '../contexts/EventContext';
import { formatDate, formatTime } from '../utils/dateUtils';

const AdminDashboard = () => {
  const { events, users } = useEvents();
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    userType: 'all',
    eventStatus: 'all',
    eventType: 'all',
    dateRange: 'all'
  });

  // User management states
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAction, setUserAction] = useState(null);

  // Event management states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventAction, setEventAction] = useState(null);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filters.userType === 'all' || user.type === filters.userType;
    return matchesSearch && matchesType;
  });

  // Filter events based on search and filters
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filters.eventStatus === 'all' || event.status === filters.eventStatus;
    const matchesType = filters.eventType === 'all' || event.eventType === filters.eventType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleUserAction = (user, action) => {
    setSelectedUser(user);
    setUserAction(action);
  };

  const handleEventAction = (event, action) => {
    setSelectedEvent(event);
    setEventAction(action);
  };

  const confirmUserAction = () => {
    // Implement user action logic here
    console.log(`Performing ${userAction} on user:`, selectedUser);
    setSelectedUser(null);
    setUserAction(null);
  };

  const confirmEventAction = () => {
    // Implement event action logic here
    console.log(`Performing ${eventAction} on event:`, selectedEvent);
    setSelectedEvent(null);
    setEventAction(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'users'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'events'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Events
              </button>
            </nav>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {activeTab === 'users' ? (
                <select
                  value={filters.userType}
                  onChange={(e) => setFilters({ ...filters, userType: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="host">Hosts</option>
                  <option value="attendee">Attendees</option>
                </select>
              ) : (
                <div className="flex space-x-4">
                  <select
                    value={filters.eventStatus}
                    onChange={(e) => setFilters({ ...filters, eventStatus: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="at-risk">At Risk</option>
                  </select>
                  <select
                    value={filters.eventType}
                    onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="standard">Standard</option>
                    <option value="vip">VIP</option>
                    <option value="partner">Partner</option>
                    <option value="invite-only">Invite Only</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'users' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.type === 'host' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.hostedEvents?.length || 0} hosted, {user.attendingEvents?.length || 0} attending
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleUserAction(user, 'verify')}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleUserAction(user, 'suspend')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Suspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendees</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEvents.map(event => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <span className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-100">
                                {event.emoji}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{event.title}</div>
                              <div className="text-sm text-gray-500">{event.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            event.eventType === 'vip' ? 'bg-purple-100 text-purple-800' :
                            event.eventType === 'partner' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {event.eventType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            event.status === 'at-risk' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(event.date)} at {formatTime(event.time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {event.attendees?.length || 0} / {event.maxAttendees}
                          {event.vipSpots > 0 && ` (${event.vipSpots} VIP)`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEventAction(event, 'approve')}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleEventAction(event, 'cancel')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Action Modal */}
      {selectedUser && userAction && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {userAction === 'verify' ? 'Verify User' : 'Suspend User'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to {userAction} {selectedUser.name}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUserAction(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmUserAction}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  userAction === 'verify' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Action Modal */}
      {selectedEvent && eventAction && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {eventAction === 'approve' ? 'Approve Event' : 'Cancel Event'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to {eventAction} {selectedEvent.title}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setEventAction(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmEventAction}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  eventAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 