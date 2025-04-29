import React, { useState } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { formatDate } from '../utils/dateUtils';

const AdminDashboardHome = () => {
  const { analytics, events, users, reports, settings, handlePartnerStatusChange } = useAdmin();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const renderOverview = () => {
    // Calculate total attendees from events
    const totalAttendees = events.reduce((sum, event) => sum + (event.attendees || 0), 0);

    return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Users</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">{analytics?.totalUsers || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Active Events</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">{analytics?.activeEvents || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Attendees</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">{totalAttendees}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Partner Events</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">{analytics?.partnerEvents || 0}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {(analytics?.recentActivity || []).map((activity, index) => (
              <li key={index} className="px-4 py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {activity.type === 'event' && <span className="text-green-500">🎉</span>}
                    {activity.type === 'user' && <span className="text-blue-500">👤</span>}
                    {activity.type === 'partner' && <span className="text-purple-500">🤝</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500">{formatDate(activity.timestamp)}</p>
                  </div>
                </div>
              </li>
            ))}
            {(!analytics?.recentActivity || analytics.recentActivity.length === 0) && (
              <li className="px-4 py-4 text-sm text-gray-500">No recent activity</li>
            )}
          </ul>
        </div>
      </div>
    </div>
    );
  };

  const renderEvents = () => {
    const filteredEvents = events.filter(event => 
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getEventHost = (hostId) => {
      const host = users.find(user => user.id === hostId);
      return host ? (host.displayName || host.email) : 'Unknown Host';
    };

    return (
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="w-full">
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Events Table */}
        <div className="bg-white shadow overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event, index) => (
                  <tr 
                    key={index}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      <div className="text-sm text-gray-500">{event.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {event.hostId ? getEventHost(event.hostId) : 'Unknown Host'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(event.date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        event.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        event.status === 'at-risk' ? 'bg-yellow-100 text-yellow-800' :
                        event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status || 'upcoming'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {event.attendees || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No events found matching your search.' : 'No events available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Side Panel */}
        {selectedEvent && (
          <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedEvent.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{selectedEvent.description}</p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Host</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedEvent.hostId ? getEventHost(selectedEvent.hostId) : 'Unknown Host'}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedEvent.date)}</dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <div>{selectedEvent.location}</div>
                        <div className="text-gray-500">{selectedEvent.address}</div>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          selectedEvent.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          selectedEvent.status === 'at-risk' ? 'bg-yellow-100 text-yellow-800' :
                          selectedEvent.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedEvent.status || 'upcoming'}
                        </span>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Attendees</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedEvent.attendees || 0} registered</dd>
                    </div>

                    {selectedEvent.capacity && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Capacity</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedEvent.capacity} max</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUsers = () => {
    const filteredUsers = users.filter(user => 
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-lg">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.displayName || 'No name'}</div>
                          <div className="text-sm text-gray-500">{formatDate(user.createdAt)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.role || 'user'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isPartner ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.isPartner ? 'Partner' : 'Regular'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handlePartnerStatusChange(user.id, !user.isPartner)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {user.isPartner ? 'Remove Partner' : 'Make Partner'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">General Settings</h3>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            {Object.entries(settings.generalSettings).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={value}
                  readOnly
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Notification Settings</h3>
          <div className="mt-6">
            {Object.entries(settings.notificationSettings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                </div>
                <div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={value}
                    readOnly
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your platform's events, users, and settings</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'events'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'users'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === 'settings'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default AdminDashboardHome; 