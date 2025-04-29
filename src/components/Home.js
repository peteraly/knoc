import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import EventsMap from './EventsMap';
import DashboardHeader from './DashboardHeader';

export default function Home({ isSplitView, userId }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Use either the passed userId (for split view) or the currentUser's ID
  const effectiveUserId = userId || currentUser?.uid;

  return (
    <div className={`${isSplitView ? '' : 'min-h-screen'} bg-gray-50`}>
      {/* Only show header when not in split view */}
      {!isSplitView && <DashboardHeader userId={effectiveUserId} />}

      {/* Main Content */}
      <main className="flex-1">
        <div className={`${isSplitView ? 'h-[calc(100vh-8rem)]' : 'h-[calc(100vh-4rem)]'}`}>
          <EventsMap />
        </div>
      </main>
    </div>
  );
} 