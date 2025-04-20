import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Suppress React DevTools message in development
if (process.env.NODE_ENV === 'development') {
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Download the React DevTools')) {
      return;
    }
    originalConsoleLog.apply(console, args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 