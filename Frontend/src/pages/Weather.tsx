import { WeatherCard, FiveDayForecastCard, DayForecastData } from "@/components/ui/weather"
import weatherData from "@/data/phTimeZoneWeather.json"
import realtimeWeather from "@/data/realtimeWeather.json"
import GlassCard from "@/components/ui/card/GlassCard";
import { Table, TableHeader, TableColumn, TableBody } from "@heroui/table";
import { GetDateAndTime } from "@/components/helper/DateAndTime";
import { useState, useEffect } from "react";
import axios from "axios";


const Weather = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/weather`);
        setData(response.data);
        console.log('Fetched data:', response.data);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


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

  return (
    <div className="flex flex-row gap-4 h-auto w-full p-4">
      <div className="h-180 w-80% flex flex-row gap-4">
        <div className="flex flex-col gap-6 w-150 ">
          {/* Today */}
          <div className="flex flex-col">
            <b className="text-3xl">{time}</b>
            <span className="text-sm">{date}</span>
          </div>

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
                data.forecastData.map((forecast: any) => (
                  <FiveDayForecastCard
                    key={forecast.time}
                    time={forecast.time}
                    temperature={Math.round(forecast.temperatureAvg)}
                    weatherCode={forecast.weatherCodeMax}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center p-8">
                  <p>Unable to load weather data</p>
                </div>
              )}
              
            </div>
          </div>
        </div>

        {/* 24 hour forecast */}
        <div className="">
          <GlassCard className="flex flex-col gap-7 w-auto h-full p-4 overflow-y-auto mt-20">
            <div>
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
              {DayForecastData(
                    {
                        key: weatherData.timelines.daily[0].time,
                        time: weatherData.timelines.daily[0].time,
                        weatherCode: weatherData.timelines.daily[0].values.weatherCodeMax,
                        temperature: Math.round(weatherData.timelines.hourly[0].values.temperature)
                    }
                )}
            </TableBody>
            </Table>
          </GlassCard>
        </div>
      </div>
      
      <div className="h-200 flex flex-col overflow-y-auto gap-4 pt-20 pb-4 px-5">
          <div>
            <p><b>Realtime weather of other group of barangay in naic.</b></p>
          </div>

          {/* 
          * Realtime weather of other group of barangay in naic
          * Include the div when mapping
          */}
          <div>
            <WeatherCard
              key={2}
              name={"group 2"}
              icon={realtimeWeather.data.values.weatherCode}
              precipitationProbability={realtimeWeather.data.values.precipitationProbability}
              rainIntensity={realtimeWeather.data.values.rainIntensity}
              humidity={realtimeWeather.data.values.humidity}
              temperature={Math.round(realtimeWeather.data.values.temperature)}
              temperatureApparent={Math.round(realtimeWeather.data.values.temperatureApparent)}
              windSpeed={realtimeWeather.data.values.windSpeed}
              weatherCode={realtimeWeather.data.values.weatherCode}
              cloudCover={realtimeWeather.data.values.cloudCover}
              rainAccumulation={realtimeWeather.data.values.rainAccumulation}
              uvIndex={realtimeWeather.data.values.uvIndex}
            />
          </div>
        </div>
      </div>
  )
}

export default Weather