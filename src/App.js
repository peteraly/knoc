import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SignIn from './components/SignIn';
import AuthCallback from './components/AuthCallback';
import Matches from './components/Matches';
import DevTools from './components/DevTools';
import { Toaster } from 'react-hot-toast';
import OnboardingForm from './components/OnboardingForm';
import FaceSelection from './components/FaceSelection';
import AvailabilityPicker from './components/AvailabilityPicker';
import OnboardingGuard from './components/OnboardingGuard';
import Profile from './components/Profile';
import SpotifyCallback from './components/SpotifyCallback';
import Navigation from './components/Navigation';
import SendNote from './components/SendNote';
import DatePlanning from './components/DatePlanning';
import Connections from './components/Connections';
// import Chat from './components/Chat';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#FFF5F5',
              color: '#E11D48',
              border: '1px solid #FCA5A5',
            },
          }}
        />
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/spotify-callback" element={<SpotifyCallback />} />
            
            {/* Protected routes with Navigation */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <>
                      <Navigation />
                      <Profile />
                    </>
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />

            <Route
              path="/preferences"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <>
                      <Navigation />
                      <Profile activeTab="preferences" />
                    </>
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingForm />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/face-selection"
              element={
                <ProtectedRoute>
                  <FaceSelection />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/availability"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <>
                      <Navigation />
                      <AvailabilityPicker />
                    </>
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/matches"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <>
                      <Navigation />
                      <Matches />
                    </>
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/chat/:matchId"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    {/* <Chat /> */}
                    <div>Chat (Coming Soon)</div>
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />

            <Route
              path="/send-note/:matchId"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <Navigation />
                    <SendNote />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            
            <Route path="/date-planning/:requestId" element={<DatePlanning />} />
            
            <Route
              path="/connections"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <>
                      <Navigation />
                      <Connections />
                    </>
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            
            {/* Redirect root to matches */}
            <Route path="/" element={<Navigate to="/matches" replace />} />
            
            {/* Catch all route - redirect to signin */}
            <Route path="*" element={<Navigate to="/signin" replace />} />
          </Routes>
          
          {/* DevTools for database seeding (only visible in development) */}
          <DevTools />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App; 