import { WeatherCard, DailyForecastCard, HourlyForecast } from "@/components/ui/weather"
import { DisplayDateAndTime } from "@/components/helper/DateAndTime";
import { useWeatherStore } from '@/components/stores/useWeatherStores';
import GlassCard from "@/components/ui/card/GlassCard";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";

const Weather = () => {
  const [time, date] = DisplayDateAndTime();
  const data = useWeatherStore((state) => state.weather);
  
  // Determine loading state based on data availability
  const loading = !data || 
    !data.realtime || 
    !data.hourly || 
    !data.daily || 
    data.realtime.length === 0;

  return (
    <div className="flex flex-col h-full w-full items-center">
      {/* Today */}
        <div className="flex flex-col lg:w-[85%] sm:w-[100%] md:[w-[90%] w-full gap-4">
          <div className="flex flex-col">
            <b className="text-3xl">{time}</b>
            <span className="text-sm">{date}</span>
          </div>
          <div className="h-full w-full flex flex-row">
            <div className="flex flex-col gap-6 w-full">

              {/* Realtime weather */}
              <div>
                {data && data.realtime && data.realtime.length > 0 && data.realtime[0].data ? (
                  <WeatherCard
                    key={data.realtime[0].location.lat + data.realtime[0].location.lon}
                    name={"bancaan"}
                    icon={data.realtime[0].data.values.weatherCode}
                    precipitationProbability={data.realtime[0].data.values?.precipitationProbability}
                    rainIntensity={data.realtime[0].data.values?.rainIntensity}
                    humidity={data.realtime[0].data.values?.humidity}
                    temperature={Math.round(data.realtime[0].data.values?.temperature)}
                    temperatureApparent={Math.round(data.realtime[0].data.values?.temperatureApparent)}
                    windSpeed={data.realtime[0].data.values?.windSpeed}
                    weatherCode={data.realtime[0].data.values?.weatherCode}
                    cloudCover={data.realtime[0].data.values?.cloudCover}
                    rainAccumulation={data.realtime[0].data.values?.rainAccumulation}
                    uvIndex={data.realtime[0].data.values?.uvIndex}
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
                <div><p><b>5-Day Forecast</b></p></div>
                <div className="flex flex-row flex-wrap gap-4 ">
                    {data && data.daily && data.daily.length > 0 ? (
                    data.daily.slice(1).map((forecast: any) => (
                      <DailyForecastCard
                      key={forecast.id}
                      time={forecast.time}
                      temperature={Math.round(forecast.temperatureAvg)}
                      weatherCode={forecast.weatherCodeMax}
                      />
                    ))
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
              </div>
            </div>

            {/* 24 hour forecast */}
            <div className="flex flex-col w-full h-full">
              <GlassCard className="flex flex-col w-fit h-[600px] p-4 overflow-y-auto">
                <div className="mb-4">
                    <p><b>24 Hour Forecast</b></p>
                </div>
                <Table 
                  shadow="none" 
                  removeWrapper 
                  hideHeader 
                  aria-label="Example static collection table"
                >
                  <TableHeader>
                      <TableColumn>.</TableColumn>
                      <TableColumn>.</TableColumn>
                      <TableColumn>.</TableColumn>
                      <TableColumn>.</TableColumn> 
                      <TableColumn>.</TableColumn> 
                  </TableHeader>
                  <TableBody>
                    {data && data.hourly ? 
                      data.hourly.slice(0, 24).map((hourly: any) => (
                        HourlyForecast({
                          key: hourly.id,
                          time: hourly.time,
                          weatherCode: hourly.weatherCode,
                          temperature: hourly.temperature,
                        } as any)
                      ))
                      : loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center w-100">Loading hourly data...</TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center w-100">Unable to load hourly data</TableCell>
                      </TableRow>
                    )
                    }
                  </TableBody>
                </Table>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
  )
}

export default Weather