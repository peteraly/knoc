import React, { useState } from 'react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    general: {
      siteName: 'Knock',
      supportEmail: 'support@knock.com',
      timezone: 'America/Los_Angeles',
      defaultLanguage: 'en'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      eventReminders: true,
      marketingEmails: false
    },
    events: {
      defaultCapacity: 20,
      minimumCapacity: 5,
      registrationBuffer: 24, // hours
      cancellationPolicy: 48 // hours
    },
    security: {
      requireEmailVerification: true,
      twoFactorAuth: false,
      sessionTimeout: 120, // minutes
      passwordExpiry: 90 // days
    }
  });

  const [activeSection, setActiveSection] = useState('general');

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">Manage system configuration and preferences</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Navigation */}
            <nav className="p-4 space-y-1">
              {Object.keys(settings).map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    activeSection === section
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className="p-6 md:col-span-3">
              {activeSection === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">General Settings</h2>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Site Name</label>
                      <input
                        type="text"
                        value={settings.general.siteName}
                        onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                        className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm py-2 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Support Email</label>
                      <input
                        type="email"
                        value={settings.general.supportEmail}
                        onChange={(e) => handleInputChange('general', 'supportEmail', e.target.value)}
                        className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm py-2 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Timezone</label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
                        className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm py-2 px-3 text-sm"
                      >
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h2>
                  <div className="space-y-4">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleInputChange('notifications', key, e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300"
                          />
                          <label className="ml-2 text-sm text-gray-700">
                            {key.split(/(?=[A-Z])/).join(' ')}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'events' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Event Settings</h2>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Default Capacity</label>
                      <input
                        type="number"
                        value={settings.events.defaultCapacity}
                        onChange={(e) => handleInputChange('events', 'defaultCapacity', parseInt(e.target.value))}
                        className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm py-2 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Minimum Capacity</label>
                      <input
                        type="number"
                        value={settings.events.minimumCapacity}
                        onChange={(e) => handleInputChange('events', 'minimumCapacity', parseInt(e.target.value))}
                        className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm py-2 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Registration Buffer (hours)</label>
                      <input
                        type="number"
                        value={settings.events.registrationBuffer}
                        onChange={(e) => handleInputChange('events', 'registrationBuffer', parseInt(e.target.value))}
                        className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm py-2 px-3 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.security.requireEmailVerification}
                          onChange={(e) => handleInputChange('security', 'requireEmailVerification', e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                        <label className="ml-2 text-sm text-gray-700">Require Email Verification</label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.security.twoFactorAuth}
                          onChange={(e) => handleInputChange('security', 'twoFactorAuth', e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                        <label className="ml-2 text-sm text-gray-700">Enable Two-Factor Authentication</label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="mt-1 block w-full border border-gray-200 rounded-md shadow-sm py-2 px-3 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings; 