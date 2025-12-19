import { GetDateAndTime } from '@/helper/DateAndTime';
import { getWeatherCondition, getWeatherIcons } from '@/helper/WeatherLogic';
import { ForecastDataProps } from '@/types/types';
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/react';

const DailyForecastCard = ({ time, temperature, weatherCode, onClick }: ForecastDataProps & { onClick?: () => void }) => {
  const date = new Date(time);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  let label;
  if (isToday) {
    label = 'Today';
  } else if (isTomorrow) {
    label = 'Tom';
  } else {
    label = GetDateAndTime({ date: time, weekday: 'short', day: 'numeric' });
  }

  return (
    <Card
      isPressable
      isHoverable
      onPress={onClick}
      className="w-auto shadow-lg p-4 dark:border dark:border-gray-700 cursor-pointer"
    >
      <CardHeader className="flex justify-center">{label}</CardHeader>
      <CardBody className="flex flex-col items-center gap-4 justify-center">
        <h2 className="text-lg font-semibold">{temperature}°C</h2>
        {getWeatherIcons(weatherCode, time)({ height: 40, width: 50 })}
      </CardBody>
      <CardFooter className="flex justify-center">
        <p className="text-xs text-gray-500">{getWeatherCondition(weatherCode)}</p>
      </CardFooter>
    </Card>
  );
};

export default DailyForecastCard;
