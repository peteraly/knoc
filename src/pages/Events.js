import React, { useState } from 'react';
import EventSidebar from '../components/EventSidebar';
import MapView from '../components/MapView';

const Events = () => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [timelineView, setTimelineView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleCategoryFilter = (categories) => {
    setSelectedCategories(categories);
  };

  return (
    <div className="flex h-screen">
      {/* Map View */}
      <div className="flex-1">
        <MapView
          selectedCategories={selectedCategories}
          timelineView={timelineView}
          selectedDate={selectedDate}
          onTimelineChange={(view, date) => {
            setTimelineView(view);
            setSelectedDate(date);
          }}
        />
      </div>

      {/* Sidebar */}
      <div className="w-96 border-l border-gray-200">
        <EventSidebar
          timelineView={timelineView}
          selectedDate={selectedDate}
          onTimelineChange={(view, date) => {
            setTimelineView(view);
            setSelectedDate(date);
          }}
          onCategoryFilter={handleCategoryFilter}
        />
      </div>
    </div>
  );
};

export default Events; 