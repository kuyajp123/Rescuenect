export const GetDateAndTime = () => {
  const date = new Date(); // Create a new Date object each time
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

type DateFormat = {
  // Year formatting options
  year?: 'numeric' | '2-digit';
  
  // Month formatting options
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  
  // Day formatting options
  day?: 'numeric' | '2-digit';
  
  // Weekday formatting options
  weekday?: 'narrow' | 'short' | 'long';
  
  // Era formatting options
  era?: 'narrow' | 'short' | 'long';
  
  // Timezone display options
  timeZone?: string; // e.g., 'Asia/Manila', 'UTC', 'America/New_York'
  timeZoneName?: 'short' | 'long' | 'shortOffset' | 'longOffset' | 'shortGeneric' | 'longGeneric';
}

export const GetDate = (format: DateFormat = {}) => {
  const date = new Date(); // Create a new Date object each time
  const options: Intl.DateTimeFormatOptions = {
    year: format.year ?? 'numeric',
    month: format.month ?? 'long',
    day: format.day ?? 'numeric',
    weekday: format.weekday,
    era: format.era,
    timeZone: format.timeZone ?? 'Asia/Manila', // Default to Philippine timezone
    timeZoneName: format.timeZoneName,
  };

  // Remove undefined values to avoid issues
  Object.keys(options).forEach(key => {
    if (options[key as keyof Intl.DateTimeFormatOptions] === undefined) {
      delete options[key as keyof Intl.DateTimeFormatOptions];
    }
  });

  const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

  return formattedDate;
}

// For backwards compatibility - just get the weekday
export const GetDay = (format: 'narrow' | 'short' | 'long' = 'long') => {
  return GetDate({ weekday: format });
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
  const date = new Date(); // Create a new Date object each time
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

// Usage Examples for GetDate function:

// Basic usage - Default format (Month Day, Year)
// GetDate() → "July 15, 2025"

// Year only
// GetDate({ year: 'numeric' }) → "2025"
// GetDate({ year: '2-digit' }) → "25"

// Month formatting options
// GetDate({ month: 'numeric' }) → "7"
// GetDate({ month: '2-digit' }) → "07"
// GetDate({ month: 'long' }) → "July"
// GetDate({ month: 'short' }) → "Jul"
// GetDate({ month: 'narrow' }) → "J"

// Day formatting options
// GetDate({ day: 'numeric' }) → "15"
// GetDate({ day: '2-digit' }) → "15"

// Weekday formatting options
// GetDate({ weekday: 'long' }) → "Monday"
// GetDate({ weekday: 'short' }) → "Mon"
// GetDate({ weekday: 'narrow' }) → "M"

// Combined formats
// GetDate({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) → "Monday, July 15, 2025"
// GetDate({ weekday: 'short', month: 'short', day: 'numeric' }) → "Mon, Jul 15"
// GetDate({ month: 'numeric', day: 'numeric', year: '2-digit' }) → "7/15/25"

// Short date formats
// GetDate({ month: '2-digit', day: '2-digit', year: 'numeric' }) → "07/15/2025"
// GetDate({ year: 'numeric', month: '2-digit', day: '2-digit' }) → "2025/07/15"

// Different timezone examples
// GetDate({ timeZone: 'UTC' }) → "July 15, 2025" (UTC date)
// GetDate({ timeZone: 'America/New_York' }) → "July 14, 2025" (if Manila is ahead)

// Timezone name display
// GetDate({ timeZoneName: 'short' }) → "July 15, 2025 PST"
// GetDate({ timeZoneName: 'long' }) → "July 15, 2025 Philippine Standard Time"

// Era display (useful for historical dates)
// GetDate({ era: 'short' }) → "July 15, 2025 AD"
// GetDate({ era: 'long' }) → "July 15, 2025 Anno Domini"

// Perfect for RescueNect emergency timestamps
// GetDate({ 
//   weekday: 'short', 
//   month: 'short', 
//   day: 'numeric', 
//   year: 'numeric',
//   timeZone: 'Asia/Manila' 
// }) → "Mon, Jul 15, 2025"

// GetDay function examples (backwards compatible):
// GetDay() → "Monday"
// GetDay('short') → "Mon"
// GetDay('narrow') → "M"