import GlassCard from '@/components/ui/card/GlassCard';
import { DailyForecastCard, HourlyForecast, WeatherCard } from '@/components/ui/weather';
import { DisplayDateAndTime } from '@/helper/DateAndTime';
import { useAuth } from '@/stores/useAuth';
import { useWeatherStore } from '@/stores/useWeatherStores';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';

const Weather = () => {
  const [time, date] = DisplayDateAndTime();
  const data = useWeatherStore(state => state.weather);
  const UserData = useAuth(state => state.userData);

  // Determine loading state based on data availability
  const loading = !data || !data.realtime || !data.hourly || !data.daily || data.realtime.length === 0;

  return (
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
                  rainAccumulation={data.realtime[0]?.rainAccumulation}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {data && data.daily && data.daily.length > 0 ? (
                  data.daily
                    .slice(1)
                    .map((forecast: any) => (
                      <DailyForecastCard
                        key={forecast.id}
                        time={forecast.time}
                        temperature={Math.round(forecast.temperatureAvg)}
                        weatherCode={forecast.weatherCodeMax}
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
            <GlassCard className="flex flex-col w-fit h-[400px] xl:h-[670px] p-4 overflow-y-auto">
              <div className="mb-4">
                <p>
                  <b>24 Hour Forecast</b>
                </p>
              </div>
              <Table shadow="none" removeWrapper hideHeader aria-label="24 hour forecast table" className="min-w-0">
                <TableHeader>
                  <TableColumn>.</TableColumn>
                  <TableColumn>.</TableColumn>
                  <TableColumn>.</TableColumn>
                  <TableColumn>.</TableColumn>
                  <TableColumn>.</TableColumn>
                </TableHeader>
                <TableBody>
                  {/* dont change this component into jsx component! because heroui components is very strict when it comes to rendering. they did not access jsx component inside of their components. remain as function calls instead of jsx component. */}
                  {data && data.hourly ? (
                    data.hourly.slice(0, 24).map((hourly: any) =>
                      HourlyForecast({
                        key: hourly.id,
                        time: hourly.time,
                        weatherCode: hourly.weatherCode,
                        temperature: hourly.temperature,
                      } as any)
                    )
                  ) : loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center w-100">
                        Loading hourly data...
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center w-100">
                        Unable to load hourly data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather;
