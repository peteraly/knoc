import React from 'react';

const AdminAnalytics = () => {
  const analytics = {
    overview: {
      totalRevenue: 25840,
      totalEvents: 45,
      totalUsers: 320,
      averageRating: 4.7
    },
    monthlyStats: [
      { month: 'Jan', events: 15, revenue: 8500, users: 120 },
      { month: 'Feb', events: 18, revenue: 9200, users: 145 },
      { month: 'Mar', events: 12, revenue: 8140, users: 55 }
    ],
    topEvents: [
      { name: 'Wine Tasting', attendees: 45, revenue: 2250, rating: 4.9 },
      { name: 'Cooking Class', attendees: 38, revenue: 1900, rating: 4.8 },
      { name: 'Yoga Session', attendees: 32, revenue: 1600, rating: 4.7 }
    ],
    categoryBreakdown: [
      { category: 'Social', percentage: 40, count: 18 },
      { category: 'Educational', percentage: 25, count: 11 },
      { category: 'Wellness', percentage: 20, count: 9 },
      { category: 'Entertainment', percentage: 15, count: 7 }
    ],
    userMetrics: {
      newUsers: 85,
      activeUsers: 245,
      averageEventsPerUser: 2.8,
      retentionRate: 78
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Performance metrics and insights</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm font-medium text-gray-500">Total Revenue</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {formatCurrency(analytics.overview.totalRevenue)}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm font-medium text-gray-500">Total Events</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {analytics.overview.totalEvents}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm font-medium text-gray-500">Total Users</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {analytics.overview.totalUsers}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-sm font-medium text-gray-500">Average Rating</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {analytics.overview.averageRating}
            </div>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Monthly Performance</h2>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Month</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Events</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Revenue</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">New Users</th>
                </tr>
              </thead>
              <tbody>
                {analytics.monthlyStats.map((stat, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="py-4 text-sm font-medium text-gray-900">{stat.month}</td>
                    <td className="py-4 text-sm text-gray-500">{stat.events}</td>
                    <td className="py-4 text-sm text-gray-500">{formatCurrency(stat.revenue)}</td>
                    <td className="py-4 text-sm text-gray-500">{stat.users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Top Events */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Top Performing Events</h2>
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Event</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Attendees</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Revenue</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topEvents.map((event, index) => (
                    <tr key={index} className="border-t border-gray-100">
                      <td className="py-4 text-sm font-medium text-gray-900">{event.name}</td>
                      <td className="py-4 text-sm text-gray-500">{event.attendees}</td>
                      <td className="py-4 text-sm text-gray-500">{formatCurrency(event.revenue)}</td>
                      <td className="py-4 text-sm text-gray-500">{event.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Event Categories</h2>
              <div className="space-y-4">
                {analytics.categoryBreakdown.map((category, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">{category.category}</span>
                      <span className="text-gray-500">{category.count} events</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Metrics */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">User Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">New Users</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {analytics.userMetrics.newUsers}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Active Users</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {analytics.userMetrics.activeUsers}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Avg Events/User</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {analytics.userMetrics.averageEventsPerUser}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Retention Rate</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {analytics.userMetrics.retentionRate}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics; 