import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { EventProvider } from './contexts/EventContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AdminProvider } from './contexts/AdminContext';
import { FriendsProvider } from './contexts/FriendsContext';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Events from './components/Events';
import MyEvents from './components/MyEvents';
import Profile from './components/Profile';
import AdminDashboardHome from './components/AdminDashboardHome';
import AdminPartners from './components/AdminPartners';
import Login from './components/Login';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import DevAdminRoute from './components/DevAdminRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <EventProvider>
          <NotificationProvider>
            <AdminProvider>
              <FriendsProvider>
                <div className="min-h-screen">
                  <Navigation />
                  <main className="pt-16">
                    <Routes>
                      {/* Public routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />

                      {/* Protected routes */}
                      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                      <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
                      <Route path="/my-events" element={<PrivateRoute><MyEvents /></PrivateRoute>} />
                      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

                      {/* Admin routes */}
                      <Route path="/admin" element={<DevAdminRoute><AdminDashboardHome /></DevAdminRoute>} />
                      <Route path="/admin/partners" element={<DevAdminRoute><AdminPartners /></DevAdminRoute>} />
                    </Routes>
                  </main>
                </div>
              </FriendsProvider>
            </AdminProvider>
          </NotificationProvider>
        </EventProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 