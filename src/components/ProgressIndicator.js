import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const steps = [
  { path: '/onboarding', label: 'Basic Info', icon: '👤' },
  { path: '/face-selection', label: 'Face Selection', icon: '😊' },
  { path: '/availability', label: 'Availability', icon: '📅' },
];

const ProgressIndicator = () => {
  const location = useLocation();
  const currentStepIndex = steps.findIndex(step => step.path === location.pathname);

  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <Link
                key={step.path}
                to={step.path}
                className={`flex flex-col items-center group ${
                  isCompleted ? 'text-pink-500' : 
                  isCurrent ? 'text-pink-600 font-medium' : 
                  'text-gray-400'
                }`}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center mb-1
                  ${isCompleted ? 'bg-pink-100' : 
                    isCurrent ? 'bg-pink-200' : 
                    'bg-gray-100'}
                  transition-all duration-200
                  group-hover:scale-110
                `}>
                  {isCompleted ? '✓' : step.icon}
                </div>
                <span className="text-xs">{step.label}</span>
                {index < steps.length - 1 && (
                  <div className={`
                    absolute top-4 left-1/2 w-full h-0.5 -z-10
                    ${isCompleted ? 'bg-pink-500' : 'bg-gray-200'}
                  `} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator; 