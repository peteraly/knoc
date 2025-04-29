import React, { useState } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { formatDate } from '../utils/dateUtils';

const AdminPartners = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { users, loading, error } = useAdmin();

  // Filter users to only show partners
  const partners = users.filter(user => user.isPartner);
  
  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs';
      case 'inactive':
        return 'bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs';
      default:
        return 'bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading partner data...</div>
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
          <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
          <p className="mt-2 text-sm text-gray-600">Manage event hosts and organizers</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm font-medium text-gray-500">Total Partners</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">{partners.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm font-medium text-gray-500">Active Partners</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {partners.filter(p => p.status === 'active').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm font-medium text-gray-500">Total Events Hosted</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {partners.reduce((sum, p) => sum + (p.eventsHosted || 0), 0)}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm font-medium text-gray-500">Average Rating</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {(partners.reduce((sum, p) => sum + (p.rating || 0), 0) / partners.length || 0).toFixed(1)}
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
                  placeholder="Search partners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Name</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Email</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Join Date</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Events Hosted</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Rating</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Specialties</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.map((partner) => (
                    <tr key={partner.id} className="border-t border-gray-100">
                      <td className="py-4 text-sm font-medium text-gray-900">{partner.name}</td>
                      <td className="py-4 text-sm text-gray-500">{partner.email}</td>
                      <td className="py-4">
                        <span className={getStatusBadge(partner.status)}>{partner.status}</span>
                      </td>
                      <td className="py-4 text-sm text-gray-500">{formatDate(partner.joinDate)}</td>
                      <td className="py-4 text-sm text-gray-500">{partner.eventsHosted || 0}</td>
                      <td className="py-4 text-sm text-gray-500">{partner.rating ? partner.rating.toFixed(1) : 'N/A'}</td>
                      <td className="py-4 text-sm text-gray-500">
                        {partner.specialties ? (
                          <div className="flex flex-wrap gap-1">
                            {partner.specialties.map((specialty, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        ) : (
                          'None specified'
                        )}
                      </td>
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

export default AdminPartners; 