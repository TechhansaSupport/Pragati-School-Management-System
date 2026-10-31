import React from 'react';
import CalendarView from '../components/CalendarModal';

const CalendarPage = () => {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      minHeight: 0, 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden' 
    }}>
      <CalendarView isOpen={true} embedded={true} />
    </div>
  );
};

export default CalendarPage;

