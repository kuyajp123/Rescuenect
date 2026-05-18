import { getWeatherCondition, getWeatherIcons } from '@/helper/WeatherLogic';
import { WeatherCardProps } from '@/types/types';
import { Card, CardBody } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { useMemo } from 'react';

const WeatherCard = ({
  name,
  icon,
  precipitationProbability,
  rainIntensity,
  humidity,
  temperature,
  uvIndex,
  temperatureApparent,
  windSpeed,
  weatherCode,
  cloudCover,
  rainAccumulation,
}: WeatherCardProps) => {
  const metrics = useMemo(() => {
    const baseMetrics = [
      {
        label: 'Feels like',
        value: temperatureApparent !== undefined && temperatureApparent !== null ? <>{temperatureApparent}&deg;C</> : '--',
      },
      {
        label: 'Chance of rain',
        value:
          precipitationProbability !== undefined && precipitationProbability !== null
            ? `${precipitationProbability}%`
            : '--',
      },
      {
        label: 'Humidity',
        value: humidity !== undefined && humidity !== null ? `${humidity}%` : '--',
      },
      {
        label: 'Rain intensity',
        value: rainIntensity !== undefined && rainIntensity !== null ? `${rainIntensity} mm/h` : '--',
      },
      {
        label: 'Cloud',
        value: cloudCover !== undefined && cloudCover !== null ? `${cloudCover}%` : '--',
      },
      {
        label: 'Wind speed',
        value: windSpeed !== undefined && windSpeed !== null ? `${windSpeed} km/h` : '--',
      },
    ];

    if (uvIndex !== undefined && uvIndex !== null) {
      baseMetrics.push({
        label: 'UV Index',
        value: String(uvIndex),
      });
    }

    if (rainAccumulation !== undefined && rainAccumulation !== null) {
      baseMetrics.push({
        label: 'Rain acc.',
        value: `${rainAccumulation} mm`,
      });
    }

    return baseMetrics;
  }, [
    temperatureApparent,
    precipitationProbability,
    humidity,
    rainIntensity,
    cloudCover,
    windSpeed,
    uvIndex,
    rainAccumulation,
  ]);

  return (
    <Card className="w-full max-w-full h-auto dark:border dark:border-gray-700">
      <CardBody className="flex flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-stretch lg:gap-6">
        <div className="flex min-w-0 flex-row items-center justify-between gap-4 lg:w-44 lg:shrink-0 lg:flex-col lg:items-start">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="break-words text-sm font-medium sm:text-base">{name}</p>
            <p className="text-sm text-default-500">{getWeatherCondition(weatherCode)}</p>
          </div>
          <div className="flex shrink-0 flex-row items-center gap-2">
            <strong className="text-3xl sm:text-4xl lg:text-3xl">{temperature}&deg;C</strong>
            {icon && getWeatherIcons(icon)({ height: 40, width: 50 })}
          </div>
        </div>

        <Divider orientation="vertical" className="hidden h-auto lg:block" />
        <Divider className="lg:hidden" />

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
          {metrics.map(metric => (
            <div key={metric.label} className="min-w-0 rounded-lg bg-default-100/70 p-3 dark:bg-default-100/10">
              <p className="text-[11px] uppercase tracking-wide text-default-500">{metric.label}</p>
              <p className="mt-1 break-words text-sm font-semibold text-default-900">{metric.value}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default WeatherCard;
