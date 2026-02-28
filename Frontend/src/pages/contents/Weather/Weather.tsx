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

const Weather = () => {
  const [time, date] = DisplayDateAndTime();
  const data = useWeatherStore(state => state.weather);
  const UserData = useAuth(state => state.userData);
  const navigate = useNavigate();

  // Determine loading state based on data availability
  const loading = !data || !data.realtime || !data.hourly || !data.daily || data.realtime.length === 0;

  const hourlyData = useMemo(() => {
    return data && data.hourly ? data.hourly.slice(0, 24) : [];
  }, [data]);

  return (
    <WeatherBackgroundLayout weatherCode={data?.realtime?.[0]?.weatherCode || 1000}>
      <div className="flex flex-col h-full w-full items-center p-4">
        {/* Today */}
        <div className="w-full">
          <div className="h-full w-full flex justify-center flex-col xl:flex-row gap-6 ">
            <div className="flex flex-col gap-6 w-fit">
              <div className="flex flex-col">
                <b className="text-2xl sm:text-3xl">{time}</b>
                <span className="text-sm">{date}</span>
              </div>
              {/* Realtime weather */}
              <div>
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
                  <div className="flex items-center justify-center p-8">
                    <p>Loading weather data...</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8">
                    <p>Unable to load weather data</p>
                  </div>
                )}
              </div>

              {/* 5 day forecast */}
              <div className="flex flex-col mt-5 gap-6">
                <div>
                  <p>
                    <b>5-Day Forecast</b>
                  </p>
                </div>
                {/* <div className="flex flex-row gap-4"> */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {data && data.daily && data.daily.length > 0 ? (
                    data.daily
                      .slice(1)
                      .map((forecast: any) => (
                        <DailyForecastCard
                          key={forecast.id}
                          time={forecast.time}
                          temperature={Math.round(forecast.temperatureAvg)}
                          weatherCode={forecast.weatherCodeMax}
                          onClick={() => navigate(`/weather/details/${forecast.id}`)}
                        />
                      ))
                  ) : loading ? (
                    <div className="flex items-center justify-center p-8 col-span-full">
                      <p>Loading weather data...</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-8 col-span-full">
                      <p>Unable to load weather data</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 24 hour forecast */}
            <div className="flex flex-col h-full">
              <GlassCard className="flex flex-col w-fit h-100 xl:h-167.5 p-4 overflow-y-auto">
                <div className="mb-4">
                  <p>
                    <b>24 Hour Forecast</b>
                  </p>
                </div>
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
                      const now = new Date();
                      const hourlyDate = new Date(item.time);
                      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      const forecastDay = new Date(
                        hourlyDate.getFullYear(),
                        hourlyDate.getMonth(),
                        hourlyDate.getDate()
                      );
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
                        <TableRow
                          key={item.id || item.time}
                          className="h-20 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          onClick={() => navigate(`/weather/hourly/${item.id}`)}
                        >
                          <TableCell className="p-0 pr-4">
                            <span className="text-[12px] opacity-70">{dayLabel}</span>
                            <br />
                            {hourlyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </TableCell>
                          <TableCell className="px-4">
                            {getWeatherIcons(item.weatherCode, item.time)({ height: 40, width: 50 })}
                          </TableCell>
                          <TableCell className="px-4">{getWeatherCondition(item.weatherCode)}</TableCell>
                          <TableCell className="px-4">{Math.round(item.temperature)}°C</TableCell>
                        </TableRow>
                      );
                    }}
                  </TableBody>
                </Table>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </WeatherBackgroundLayout>
  );
};

export default Weather;
