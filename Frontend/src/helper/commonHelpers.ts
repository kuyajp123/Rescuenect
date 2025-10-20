import { differenceInHours, differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { useLocation } from 'react-router-dom';

export const UrlLocation = () => {
  const location = useLocation();

  if (location.pathname) {
    if (location.pathname === '/') {
      return 'Dashboard';
    } else if (location.pathname === '/status') {
      return 'Status';
    } else if (location.pathname === '/weather') {
      return 'Weather';
    } else if (location.pathname === '/earthquake') {
      return 'Earthquake';
    } else if (location.pathname === '/add_notification') {
      return 'Add Notification';
    } else if (location.pathname === '/add_event') {
      return 'Add Event';
    } else if (location.pathname === '/donation') {
      return 'Donation';
    } else if (location.pathname === '/volunteer') {
      return 'Volunteer';
    } else {
      return '';
    }
  }
};

// Helper function to convert various date formats to Date object
const convertToDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;

  if (dateValue instanceof Date) return dateValue;

  // Handle Firestore Timestamp with toDate method
  if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // Handle Firestore Timestamp object format { seconds: number, nanoseconds: number }
  if (dateValue?.seconds && typeof dateValue.seconds === 'number') {
    return new Date(dateValue.seconds * 1000);
  }

  // Handle string dates
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Handle numeric timestamps (milliseconds)
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }

  return null;
};

// Helper function to format time since creation
export const formatTimeSince = (dateValue: any): string => {
  const date = convertToDate(dateValue);
  if (!date) return 'Unknown';

  try {
    const now = new Date();

    // Check if the date is in the future
    if (date > now) {
      // For future dates, show "in X minutes/hours" or the actual date
      const diffInHours = differenceInHours(date, now);
      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true, includeSeconds: true }).replace(/^about\s+/, '');
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
      }
    }

    // For past dates
    const diffInHours = differenceInHours(now, date);

    // If more than 24 hours (1 day), show the actual date
    if (diffInHours >= 24) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }

    // For recent times (less than 24 hours), show relative time
    const relativeTime = formatDistanceToNow(date, { addSuffix: true, includeSeconds: true }).replace(/^about\s+/, '');

    // If it's showing seconds, display "Just now" instead
    if (relativeTime.includes('second')) {
      return 'Just now';
    }

    return relativeTime;
  } catch (error) {
    return 'Unknown';
  }
};

// Helper function to format time remaining until expiration
export const formatTimeRemaining = (dateValue: any): string => {
  const date = convertToDate(dateValue);
  if (!date) return 'No expiration';

  try {
    const now = new Date();
    const minutesRemaining = differenceInMinutes(date, now);

    // If already expired
    if (minutesRemaining <= 0) {
      return 'Expired';
    }

    // If less than 60 minutes, show in minutes
    if (minutesRemaining < 60) {
      return `in ${minutesRemaining}m`;
    }

    // If 60+ minutes, show in hours
    const hoursRemaining = differenceInHours(date, now);
    if (hoursRemaining < 24) {
      return `in ${hoursRemaining}h`;
    }

    // If 24+ hours, show in days
    const daysRemaining = Math.floor(hoursRemaining / 24);
    return `in ${daysRemaining}d`;
  } catch (error) {
    return 'Invalid date';
  }
};
