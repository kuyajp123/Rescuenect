import { TableCell, TableRow } from '@heroui/table';
import { ChevronRightIcon } from 'lucide-react';
import { ForecastDataProps } from '@/types/types';
import { getWeatherIcons, getWeatherCondition } from '@/helper/WeatherLogic';

export const HourlyForecast = ({ time, weatherCode, temperature }: ForecastDataProps) => {
  const today = new Date().toDateString();
  const hourlyDate = new Date(time);
  const dateString = hourlyDate.toDateString();
  return (
    <TableRow key={time} className="h-20">
      <TableCell className="p-0 pr-4">
        <span className="text-[12px] opacity-70">
          {dateString === today ? 'Today' : dateString < today ? 'Yesterday' : 'Tomorrow'}
        </span>{' '}
        <br />
        {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
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
