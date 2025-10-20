import { TableCell, TableRow } from '@heroui/table';
import { ChevronRightIcon } from 'lucide-react';
import { ForecastDataProps } from '@/types/types';
import { getWeatherIcons, getWeatherCondition } from '@/helper/WeatherLogic';

export const HourlyForecast = ({ time, weatherCode, temperature }: ForecastDataProps) => {
  const now = new Date();
  const hourlyDate = new Date(time);

  // remove time portion for clean date comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const forecastDay = new Date(hourlyDate.getFullYear(), hourlyDate.getMonth(), hourlyDate.getDate());

  const diffInTime = forecastDay.getTime() - today.getTime();
  const diffInDays = diffInTime / (1000 * 3600 * 24);

  let dayLabel = '';
  if (diffInDays === 0) {
    dayLabel = 'Today';
  } else if (diffInDays === -1) {
    dayLabel = 'Yesterday';
  } else if (diffInDays === 1) {
    dayLabel = 'Tomorrow';
  } else {
    dayLabel = forecastDay.toDateString();
  }

  return (
    <TableRow key={time} className="h-20">
      <TableCell className="p-0 pr-4">
        <span className="text-[12px] opacity-70">{dayLabel}</span>
        <br />
        {hourlyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
      </TableCell>
      <TableCell className="px-4">{getWeatherIcons(weatherCode, time)({ height: 40, width: 50 })}</TableCell>
      <TableCell className="px-4">{getWeatherCondition(weatherCode)}</TableCell>
      <TableCell className="px-4">{Math.round(temperature)} °C</TableCell>
      <TableCell className="p-0 pl-4">
        <ChevronRightIcon className="h-5 w-5" />
      </TableCell>
    </TableRow>
  );
};

export default HourlyForecast;
