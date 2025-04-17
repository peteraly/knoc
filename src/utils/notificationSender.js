import { getMessaging, send } from 'firebase/messaging';
import { messaging } from './firebase';

// Helper function to format time slots
const formatTimeSlot = (date, time) => {
  return new Date(`${date}T${time}`).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};

// Helper function to generate personalized message for user
const generateUserMessage = (match, date, time, location) => {
  return {
    notification: {
      title: 'New Match!',
      body: `You've been matched with ${match.name}! Your date is scheduled for ${formatTimeSlot(date, time)} at ${location}.`
    },
    data: {
      matchId: match.id,
      date: date,
      time: time,
      location: location
    }
  };
};

// Helper function to generate personalized message for match
const generateMatchMessage = (user, date, time, location) => {
  return {
    notification: {
      title: 'New Match!',
      body: `You've been matched with ${user.name}! Your date is scheduled for ${formatTimeSlot(date, time)} at ${location}.`
    },
    data: {
      matchId: user.id,
      date: date,
      time: time,
      location: location
    }
  };
};

// Main function to send match notification
export const sendMatchNotification = async (user, match, date, time, location) => {
  try {
    // Send notification to user
    await send(messaging, generateUserMessage(match, date, time, location));
    
    // Send notification to match
    await send(messaging, generateMatchMessage(user, date, time, location));
    
    return true;
  } catch (error) {
    console.error('Error sending match notification:', error);
    throw error;
  }
};

// Function to send date reminder
export const sendDateReminder = async (user, match, date, time, location) => {
  try {
    const reminderMessage = {
      notification: {
        title: 'Date Reminder',
        body: `Your date with ${match.name} is tomorrow at ${formatTimeSlot(date, time)} at ${location}.`
      },
      data: {
        matchId: match.id,
        date: date,
        time: time,
        location: location
      }
    };
    
    await send(messaging, reminderMessage);
    return true;
  } catch (error) {
    console.error('Error sending date reminder:', error);
    throw error;
  }
}; 