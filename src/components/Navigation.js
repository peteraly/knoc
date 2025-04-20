import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-around -mb-px">
          <Link
            to="/matches"
            className={`flex-1 flex flex-col items-center py-4 ${
              currentPath.includes('/matches') || currentPath === '/'
                ? 'text-rose-500 border-t-2 border-rose-500 -mt-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="mt-1 text-sm font-medium">Matches & Dates</span>
          </Link>

          <Link
            to="/profile"
            className={`flex-1 flex flex-col items-center py-4 ${
              currentPath.includes('/profile')
                ? 'text-rose-500 border-t-2 border-rose-500 -mt-px'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="mt-1 text-sm font-medium">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 