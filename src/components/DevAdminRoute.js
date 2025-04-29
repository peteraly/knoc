import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';

const DevAdminRoute = ({ children }) => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const isDevelopment = process.env.NODE_ENV === 'development';

  console.log('DevAdminRoute - Development mode:', isDevelopment);
  console.log('DevAdminRoute - Current user:', currentUser?.email);
  console.log('DevAdminRoute - Is admin:', isAdmin);
  console.log('DevAdminRoute - Loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isDevelopment && !isAdmin) {
    console.log('DevAdminRoute - Access denied, redirecting to events');
    return <Navigate to="/events" state={{ from: location }} replace />;
  }

  console.log('DevAdminRoute - Access granted');
  return children;
};

export default DevAdminRoute; 