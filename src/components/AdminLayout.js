import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  // Redirect if user is not an admin
  React.useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const navigationItems = [
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'Users', path: '/admin/users', icon: '👥' },
    { name: 'Events', path: '/admin/events', icon: '🎉' },
    { name: 'Partners', path: '/admin/partners', icon: '🤝' },
    { name: 'Analytics', path: '/admin/analytics', icon: '📈' },
    { name: 'Settings', path: '/admin/settings', icon: '⚙️' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Link to="/admin" className="flex items-center space-x-2">
              <span className="text-2xl">🎯</span>
              <span className="text-xl font-bold text-gray-900">Admin</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <span className="sr-only">Close sidebar</span>
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <span className="text-xl">👤</span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.displayName || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`lg:pl-64 flex flex-col min-h-screen ${
          isSidebarOpen ? 'pl-64' : 'pl-0'
        }`}
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              ☰
            </button>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-md hover:bg-gray-100">
                <span className="sr-only">Notifications</span>
                🔔
              </button>
              <button className="p-2 rounded-md hover:bg-gray-100">
                <span className="sr-only">Help</span>
                ❓
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout; 