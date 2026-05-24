import GlassCard from '@/components/ui/card/GlassCard';
import { DailyForecastCard, WeatherCard } from '@/components/ui/weather';
import WeatherBackgroundLayout from '@/components/ui/weather/WeatherBackgroundLayout';
import { DisplayDateAndTime } from '@/helper/DateAndTime';
import { getWeatherCondition, getWeatherIcons } from '@/helper/WeatherLogic';
import { useAuth } from '@/stores/useAuth';
import { useWeatherStore } from '@/stores/useWeatherStores';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const getHourlyDateParts = (time: string | Date) => {
  const now = new Date();
  const hourlyDate = new Date(time);
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

  return {
    dayLabel,
    timeLabel: hourlyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
};

const Weather = () => {
  const [time, date] = DisplayDateAndTime();
  const data = useWeatherStore(state => state.weather);
  const UserData = useAuth(state => state.userData);
  const navigate = useNavigate();

  const loading = !data || !data.realtime || !data.hourly || !data.daily;

  const hourlyData = useMemo(() => {
    return data && data.hourly ? data.hourly.slice(0, 24) : [];
  }, [data]);

  return (
    <WeatherBackgroundLayout weatherCode={data?.realtime?.[0]?.weatherCode || 1000}>
      <div className="flex min-h-full w-full max-w-full flex-col overflow-x-hidden p-3 sm:p-4 lg:p-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 lg:gap-6">
          <div className="flex w-full flex-col gap-5 xl:flex-row xl:items-start xl:gap-6">
            <div className="flex w-full min-w-0 flex-col gap-5 xl:flex-1">
              <div className="flex flex-col">
                <b className="text-2xl sm:text-3xl">{time}</b>
                <span className="text-sm">{date}</span>
              </div>

              <div className="w-full min-w-0">
                {data && data.realtime && data.realtime.length > 0 ? (
                  <WeatherCard
                    key={data.realtime[0].location.lat + data.realtime[0].location.lon}
                    name={UserData?.barangay || 'Your Location'}
                    icon={data.realtime[0].weatherCode}
                    precipitationProbability={data.realtime[0]?.precipitationProbability}
                    rainIntensity={data.realtime[0]?.rainIntensity}
                    humidity={data.realtime[0]?.humidity}
                    temperature={Math.round(data.realtime[0]?.temperature)}
                    temperatureApparent={Math.round(data.realtime[0]?.temperatureApparent)}
                    windSpeed={data.realtime[0]?.windSpeed}
                    weatherCode={data.realtime[0]?.weatherCode}
                    cloudCover={data.realtime[0]?.cloudCover}
                    uvIndex={data.realtime[0]?.uvIndex}
                  />
                ) : loading ? (
                  <div className="rounded-xl bg-white/95 p-6 text-default-600 shadow-sm dark:bg-black/30 dark:text-white">
                    Loading weather data...
                  </div>
                ) : (
                  <div className="rounded-xl bg-white/95 p-6 text-default-600 shadow-sm dark:bg-black/30 dark:text-white">
                    Unable to load weather data
                  </div>
                )}
              </div>

              <div className="flex w-full min-w-0 flex-col gap-3">
                <p className="font-semibold">5-Day Forecast</p>
                <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                  {data && data.daily && data.daily.length > 0 ? (
                    data.daily.slice(1).map((forecast: any) => (
                      <DailyForecastCard
                        key={forecast.id}
                        time={forecast.time}
                        temperature={Math.round(forecast.temperatureAvg)}
                        weatherCode={forecast.weatherCodeMax}
                        onClick={() => navigate(`/weather/details/${forecast.id}`)}
                      />
                    ))
                  ) : loading ? (
                    <div className="col-span-full rounded-xl bg-white/95 p-6 text-center text-default-600 shadow-sm dark:bg-black/30 dark:text-white">
                      Loading weather data...
                    </div>
                  ) : (
                    <div className="col-span-full rounded-xl bg-white/95 p-6 text-center text-default-600 shadow-sm dark:bg-black/30 dark:text-white">
                      Unable to load weather data
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full min-w-0 xl:w-[420px] xl:shrink-0">
              <GlassCard
                size="small"
                className="flex max-h-[28rem] w-full flex-col overflow-y-auto p-3 sm:p-4 xl:h-[670px] xl:max-h-none"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-semibold">24 Hour Forecast</p>
                  <span className="rounded-full bg-white/20 px-2 py-1 text-xs">{hourlyData.length} items</span>
                </div>

                <div className="flex flex-col gap-2 md:hidden">
                  {loading ? (
                    <div className="rounded-lg bg-white/90 p-4 text-center text-default-600 dark:bg-black/30 dark:text-white">
                      Loading...
                    </div>
                  ) : hourlyData.length === 0 ? (
                    <div className="rounded-lg bg-white/90 p-4 text-center text-default-600 dark:bg-black/30 dark:text-white">
                      Unable to load hourly data
                    </div>
                  ) : (
                    hourlyData.map((item: any) => {
                      const { dayLabel, timeLabel } = getHourlyDateParts(item.time);

                      return (
                        <button
                          key={item.id || item.time}
                          type="button"
                          className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg bg-white/90 p-3 text-left text-default-900 shadow-sm transition hover:bg-white dark:bg-black/30 dark:text-white"
                          onClick={() => navigate(`/weather/hourly/${item.id}`)}
                        >
                          <span className="min-w-0">
                            <span className="text-[11px] opacity-70">{dayLabel}</span>
                            <span className="block truncate text-sm font-semibold">{timeLabel}</span>
                            <span className="block truncate text-xs text-default-500">
                              {getWeatherCondition(item.weatherCode)}
                            </span>
                          </span>
                          <span className="shrink-0">
                            {getWeatherIcons(item.weatherCode, item.time)({ height: 32, width: 40 })}
                          </span>
                          <strong className="text-sm">{Math.round(item.temperature)}&deg;C</strong>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="hidden md:block">
                  <Table shadow="none" removeWrapper hideHeader aria-label="24 hour forecast table" className="min-w-0">
                    <TableHeader>
                      <TableColumn>Time</TableColumn>
                      <TableColumn>Icon</TableColumn>
                      <TableColumn>Condition</TableColumn>
                      <TableColumn>Temp</TableColumn>
                    </TableHeader>
                    <TableBody
                      items={hourlyData}
                      emptyContent="Unable to load hourly data"
                      loadingContent="Loading..."
                      isLoading={loading}
                    >
                      {(item: any) => {
                        const { dayLabel, timeLabel } = getHourlyDateParts(item.time);

                        return (
                          <TableRow
                            key={item.id || item.time}
                            className="h-20 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            onClick={() => navigate(`/weather/hourly/${item.id}`)}
                          >
                            <TableCell className="p-0 pr-4">
                              <span className="text-[12px] opacity-70">{dayLabel}</span>
                              <br />
                              {timeLabel}
                            </TableCell>
                            <TableCell className="px-4">
                              {getWeatherIcons(item.weatherCode, item.time)({ height: 40, width: 50 })}
                            </TableCell>
                            <TableCell className="px-4">{getWeatherCondition(item.weatherCode)}</TableCell>
                            <TableCell className="px-4">{Math.round(item.temperature)}&deg;C</TableCell>
                          </TableRow>
                        );
                      }}
                    </TableBody>
                  </Table>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </WeatherBackgroundLayout>
  );
};

export default Weather;
