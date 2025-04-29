import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

const AppLayout = () => {
  const isSplitView = window.location.pathname === '/dev/split';

  return (
    <div className={isSplitView ? '' : 'min-h-screen bg-gray-50 pb-16'}>
      <Outlet />
      {!isSplitView && <Navigation />}
    </div>
  );
};

export default AppLayout; 