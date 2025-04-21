import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Profile from './components/Profile';
import Login from './components/Login';
import OnboardingForm from './components/OnboardingForm';
import FaceSelection from './components/FaceSelection';
import Matches from './components/Matches';
import DatePlanning from './components/DatePlanning';
import PrivateRoute from './components/PrivateRoute';
import { Toaster } from 'react-hot-toast';
import Navigation from './components/Navigation';
import DevTools from './components/DevTools';
import Explore from './components/Explore';
import { AuthProvider } from './contexts/AuthContext';
import Events from './components/Events';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Router>
        <AuthProvider>
          <Toaster position="top-center" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/events" 
              element={
                <PrivateRoute>
                  <Events />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/account" 
              element={<Navigate to="/profile" replace />} 
            />
            <Route 
              path="/onboarding" 
              element={
                <PrivateRoute>
                  <OnboardingForm />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/face-selection" 
              element={
                <PrivateRoute>
                  <FaceSelection />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/matches" 
              element={
                <PrivateRoute>
                  <Matches />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/dates" 
              element={
                <PrivateRoute>
                  <Matches currentView="dates" />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/date-planning" 
              element={
                <PrivateRoute>
                  <DatePlanning />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/date-planning/new" 
              element={
                <PrivateRoute>
                  <DatePlanning isNewDate={true} />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/explore" 
              element={
                <PrivateRoute>
                  <Explore />
                </PrivateRoute>
              } 
            />
          </Routes>
          <Navigation />
          <DevTools />
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App; 