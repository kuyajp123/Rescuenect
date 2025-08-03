import { GetDateAndTimeProps } from '@/components/shared/types';
import { useState, useEffect } from 'react';

const GetDateAndTime = (
{ 
    date,
    year, 
    month, 
    weekday, 
    day, 
    hour, 
    minute, 
    second, 
    hour12 
}: GetDateAndTimeProps) => {

  const rawDate = date ? new Date(date) : new Date(); // use given date or fallback to now
  const options = {
    year: year, // e.g., 'numeric', '2-digit'
    month: month, // e.g., 'numeric', '2-digit', 'long', 'short', 'narrow'
    weekday: weekday, // Optional, can be set to 'long', 'short', etc.
    day: day, // e.g., 'numeric', '2-digit'
    hour: hour, // e.g., '2-digit', 'numeric'
    minute: minute, // e.g., '2-digit', 'numeric'
    second: second, // Optional, can be set to '2-digit', 'numeric'
    timeZone: 'Asia/Manila', // Default to Philippine timezone
    hour12: hour12, // For AM/PM format
  };
  const formattedDate = new Intl.DateTimeFormat('en-US', options as any).format(rawDate);

  return formattedDate;
}


const DisplayDateAndTime = () => {
    const getTime = GetDateAndTime({ hour: 'numeric', minute: '2-digit', hour12: true })
    const getDate = GetDateAndTime({ weekday: 'short', year: 'numeric', month: 'long', day: '2-digit' })
    
    const [time, setTime] = useState<string>(getTime);
    const [date, setDate] = useState<string>(getDate);
  
    useEffect(() => {
      const interval = setInterval(() => {
        setTime(GetDateAndTime({ hour: 'numeric', minute: '2-digit', hour12: true }))
        setDate(GetDateAndTime({ weekday: 'short', year: 'numeric', month: 'long', day: '2-digit' }))
      }, 1000)
  
      return () => clearInterval(interval);
    }, [])
    
    return [time, date]
}

export { GetDateAndTime, DisplayDateAndTime };