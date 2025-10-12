
// Convert frontend participant status to backend status for API calls
export const mapParticipantStatus = (status: string): 'accepted' | 'pending' | 'declined' => {
  switch (status.toLowerCase()) {
    case 'going':
      return 'accepted';
    case 'pending':
      return 'pending';
    case 'not_going':
      return 'declined';
    default:
      return 'pending';
  }
};

// Helper function to get initials from a name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

// Helper function to format date based on user's locale
export const formatDate = (dateString: string, locale: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

// Helper function to format date range when start and end dates differ
export const formatDateRange = (startDateString: string, endDateString: string | null, locale: string): string => {
  if (!endDateString) return formatDate(startDateString, locale);
  
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  
  // If dates are the same, just return the single date
  if (startDate.toDateString() === endDate.toDateString()) {
    return formatDate(startDateString, locale);
  }
  
  // Otherwise return a date range
  const startFormatted = startDate.toLocaleDateString(locale, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    year: startDate.getFullYear() === endDate.getFullYear() ? undefined : 'numeric'
  });
  
  const endFormatted = endDate.toLocaleDateString(locale, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  return `${startFormatted} - ${endFormatted}`;
};

// Helper function to format time only based on user's locale
export const formatTime = (dateString: string, locale: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString(locale, { hour: 'numeric', minute: 'numeric', hour12: false });
};

// Helper function to format time range based on user's locale
export const formatTimeRange = (startDateString: string, endDateString: string | null, locale: string): string => {
  const startTime = formatTime(startDateString, locale);
  
  if (endDateString) {
    const endTime = formatTime(endDateString, locale);
    return `${startTime} - ${endTime}`;
  }
  
  return startTime;
};

// Helper function to determine if two dates are on the same day
export const isSameDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() && 
         d1.getMonth() === d2.getMonth() && 
         d1.getDate() === d2.getDate();
};
