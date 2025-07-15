let date = new Date();

export const GetDateAndTime = () => {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // For AM/PM format
  };
  const formattedDate = new Intl.DateTimeFormat('en-US', options as any).format(date);

  return formattedDate;
};

export const GetDate = () => {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const formattedDate = new Intl.DateTimeFormat('en-US', options as any).format(date);

  return formattedDate;
}

type DayFormat = 'narrow' | 'short' | 'long';

export const GetDay = (format: DayFormat) => {
  const options = {
    weekday: format,
  };
  const formattedDay = new Intl.DateTimeFormat('en-US', options as any).format(date);

  return formattedDay;
}

type TimeFormat = {
  // Hour formatting options
  hour?: 'numeric' | '2-digit';
  
  // Minute formatting options
  minute?: 'numeric' | '2-digit';
  
  // Second formatting options
  second?: 'numeric' | '2-digit';
  
  // 12-hour vs 24-hour format
  hour12?: boolean;
  
  // Fractional seconds (1-3 digits)
  fractionalSecondDigits?: 1 | 2 | 3;
  
  // Hour cycle options
  hourCycle?: 'h11' | 'h12' | 'h23' | 'h24';
  
  // Timezone display options
  timeZone?: string; // e.g., 'Asia/Manila', 'UTC', 'America/New_York'
  timeZoneName?: 'short' | 'long' | 'shortOffset' | 'longOffset' | 'shortGeneric' | 'longGeneric';
  
  // Day period (AM/PM) formatting
  dayPeriod?: 'narrow' | 'short' | 'long';
}

export const GetTime = (format: TimeFormat = {}) => {
  const options: Intl.DateTimeFormatOptions = {
    hour: format.hour ?? '2-digit',
    minute: format.minute ?? '2-digit',
    second: format.second,
    hour12: format.hour12 ?? true, // Default to 12-hour format
    fractionalSecondDigits: format.fractionalSecondDigits,
    hourCycle: format.hourCycle,
    timeZone: format.timeZone ?? 'Asia/Manila', // Default to Philippine timezone
    timeZoneName: format.timeZoneName,
    dayPeriod: format.dayPeriod,
  };

  // Remove undefined values to avoid issues
  Object.keys(options).forEach(key => {
    if (options[key as keyof Intl.DateTimeFormatOptions] === undefined) {
      delete options[key as keyof Intl.DateTimeFormatOptions];
    }
  });

  const formattedTime = new Intl.DateTimeFormat('en-US', options).format(date);

  return formattedTime;
}

// Usage Examples for GetTime function:

// Basic usage - Default format (12-hour with AM/PM)
// GetTime() → "02:30 PM"

// Custom hour and minute format
// GetTime({ hour: 'numeric', minute: '2-digit' }) → "2:30 PM"

// 24-hour format
// GetTime({ hour12: false }) → "14:30"

// Include seconds
// GetTime({ second: '2-digit' }) → "02:30:45 PM"

// Include fractional seconds
// GetTime({ second: '2-digit', fractionalSecondDigits: 3 }) → "02:30:45.123 PM"

// Different hour cycles
// GetTime({ hourCycle: 'h23' }) → "14:30" (24-hour, 0-23)
// GetTime({ hourCycle: 'h11' }) → "2:30 PM" (12-hour, 0-11)

// Timezone examples
// GetTime({ timeZone: 'UTC' }) → "06:30 AM" (if local time is 2:30 PM in Manila)
// GetTime({ timeZone: 'America/New_York' }) → "02:30 AM"

// Timezone name display
// GetTime({ timeZoneName: 'short' }) → "02:30 PM PST"
// GetTime({ timeZoneName: 'long' }) → "02:30 PM Philippine Standard Time"

// Day period customization
// GetTime({ dayPeriod: 'long' }) → "02:30 in the afternoon"
// GetTime({ dayPeriod: 'narrow' }) → "02:30 a"

// Complex example for emergency timestamps
// GetTime({ 
//   hour: '2-digit', 
//   minute: '2-digit', 
//   second: '2-digit',
//   timeZone: 'Asia/Manila',
//   timeZoneName: 'short',
//   hour12: false 
// }) → "14:30:45 PST"