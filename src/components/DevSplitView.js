import React, { useState } from 'react';
import Profile from './Profile';
import Matches, { MatchProvider } from './Matches';
import Events from './Events';
import Home from './Home';
import DashboardHeader from './DashboardHeader';

const TABS = [
  { id: 'home', label: 'Home', component: Home },
  { id: 'matches', label: 'Matches', component: props => (
    <MatchProvider>
      <Matches {...props} />
    </MatchProvider>
  )},
  { id: 'events', label: 'Events', component: Events },
  { id: 'profile', label: 'Profile', component: Profile }
];

// Test user ID for Sarah Johnson
const TEST_USER = 'profile1';

export default function DevSplitView() {
  const [currentTab, setCurrentTab] = useState('profile');

  const renderContent = () => {
    const TabComponent = TABS.find(tab => tab.id === currentTab)?.component;
    if (!TabComponent) return null;

    return (
      <div className="flex flex-col h-full">
        <DashboardHeader userId={TEST_USER} />
        <div className="flex-1 overflow-auto">
          <TabComponent 
            userId={TEST_USER}
            autoLoginUserId={TEST_USER}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex justify-center space-x-4 p-4 border-b">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`px-4 py-2 rounded ${
              currentTab === tab.id ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
} 