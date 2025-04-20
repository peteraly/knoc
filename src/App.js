import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import PrivateRoute from './components/PrivateRoute';
import Navigation from './components/Navigation';
import DatingDashboard from './components/Matches';
import Profile from './components/Profile';
import Login from './components/Login';
import OnboardingForm from './components/OnboardingForm';
import DatePlanning from './components/DatePlanning';
import Chat from './components/Chat';
import DevTools from './components/DevTools';
import Explore from './components/Explore';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 pb-16">
          <Toaster position="top-center" />
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Onboarding Routes */}
            <Route path="/onboarding" element={
              <PrivateRoute>
                <OnboardingForm />
              </PrivateRoute>
            } />
            
            {/* Main App Routes */}
            <Route path="/" element={<Navigate to="/matches" replace />} />
            <Route path="/matches" element={
              <PrivateRoute>
                <DatingDashboard />
              </PrivateRoute>
            } />
            <Route path="/explore" element={
              <PrivateRoute>
                <Explore />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/account" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/date-planning/new" element={
              <PrivateRoute>
                <DatePlanning />
              </PrivateRoute>
            } />
            <Route path="/chat/:chatId" element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            } />
            <Route path="/dates" element={
              <Navigate to="/matches" replace />
            } />
            <Route path="/face-selection" element={
              <Navigate to="/profile" replace />
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/matches" replace />} />
          </Routes>
          <Navigation />
          <DevTools />
        </div>
      </AuthProvider>
    </Router>
  );
} 