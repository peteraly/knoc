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
// import Chat from './components/Chat';

// Import your other components here
// import OnboardingForm from './components/OnboardingForm';
// import FaceSelection from './components/FaceSelection';
// import AvailabilityPicker from './components/AvailabilityPicker';
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
        <Routes>
          {/* Public routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Protected routes */}
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
                <AvailabilityPicker />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/matches"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <Matches />
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
          
          {/* Redirect root to signin if not authenticated, or to matches if authenticated */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/matches" replace />
              </ProtectedRoute>
            }
          />
          
          {/* Catch all route - redirect to signin */}
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
        
        {/* DevTools for database seeding (only visible in development) */}
        <DevTools />
      </AuthProvider>
    </Router>
  );
}

export default App; 