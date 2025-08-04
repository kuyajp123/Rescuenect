import { WeatherCard, DailyForecastCard, HourlyForecast } from "@/components/ui/weather"
import realtimeWeather from "@/data/realtimeWeather.json"
import { useState, useEffect } from "react";
import { DisplayDateAndTime } from "@/components/helper/DateAndTime";
import axios from "axios";
import GlassCard from "@/components/ui/card/GlassCard";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { useWeatherStore } from "@/components/stores/useWeatherStores";

const Weather = () => {
  const [time, date] = DisplayDateAndTime();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const weather = useWeatherStore((s) => s.weather);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/weather`);
  //       setData(response.data);
  //       console.log('Fetched data:', response.data);
  //     } catch (error) {
  //       console.error('Error fetching weather data:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchData();
  // }, []);


  return (
    <div className="flex flex-col gap-4 h-full w-full p-4">
      {/* Today */}
      <div className="flex flex-col">
        <b className="text-3xl">{time}</b>
        <span className="text-sm">{date}</span>
      </div>
      <div className="h-full w-full flex flex-row gap-4">
        <div className="flex flex-col gap-6 w-full ">

          {/* Realtime weather */}
          <div>
            {data && data.realTimeData && data.realTimeData.data ? (
              <WeatherCard
                key={data.realTimeData.location.lat + data.realTimeData.location.lon}
                name={"bancaan"}
                icon={data.realTimeData.data.values.weatherCode}
                precipitationProbability={data.realTimeData.data.values?.precipitationProbability}
                rainIntensity={data.realTimeData.data.values?.rainIntensity}
                humidity={data.realTimeData.data.values?.humidity}
                temperature={Math.round(data.realTimeData.data.values?.temperature)}
                temperatureApparent={Math.round(data.realTimeData.data.values?.temperatureApparent)}
                windSpeed={data.realTimeData.data.values?.windSpeed}
                weatherCode={data.realTimeData.data.values?.weatherCode}
                cloudCover={data.realTimeData.data.values?.cloudCover}
                rainAccumulation={data.realTimeData.data.values?.rainAccumulation}
                uvIndex={data.realTimeData.data.values?.uvIndex}
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
                {data && data.forecastData ? (
                data.forecastData.slice(1).map((forecast: any) => (
                  <DailyForecastCard
                  key={forecast.time}
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
                {data && data.hourlyData ? 
                  data.hourlyData.slice(0, 24).map((hourly: any) => (
                    HourlyForecast({
                      key: hourly.time,
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
  )
}

export default Weather