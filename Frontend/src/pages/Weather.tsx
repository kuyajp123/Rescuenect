import { WeatherCard, FiveDayForecastCard, DayForecastData } from "@/components/ui/weather"
import weatherData from "@/data/phTimeZoneWeather.json"
import realtimeWeather from "@/data/realtimeWeather.json"
import GlassCard from "@/components/ui/card/GlassCard";
import { Table, TableHeader, TableColumn, TableBody } from "@heroui/table";
import { GetDateAndTime } from "@/components/helper/DateAndTime";
import { useState, useEffect } from "react";

const Weather = () => {
  const getTime = GetDateAndTime({ hour: 'numeric', minute: '2-digit', hour12: true })
  const getDate = GetDateAndTime({ weekday: 'short', year: 'numeric', month: 'long', day: '2-digit' })
  
  const [time, setTime] = useState<string>(getTime);
  const [date, setDate] = useState<string>(getDate);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(GetDateAndTime({ hour: 'numeric', minute: '2-digit', hour12: true }))
      setDate(GetDateAndTime({ weekday: 'short', year: 'numeric', month: 'long', day: '2-digit' }))

       return () => clearInterval(interval);
    }, 1000)
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
        <WeatherCard
          key={realtimeWeather.location.lat + " " + realtimeWeather.location.lon}
          name={"bancaan"}
          icon={realtimeWeather.data.values.weatherCode}
          precipitationProbability={realtimeWeather.data.values.precipitationProbability}
          rainIntensity={realtimeWeather.data.values.rainIntensity}
          humidity={realtimeWeather.data.values.humidity}
          temperature={Math.round(realtimeWeather.data.values.temperature)}
          temperatureApparent={Math.round(realtimeWeather.data.values.temperatureApparent)}
          windSpeed={realtimeWeather.data.values.windSpeed}
          weatherCode={realtimeWeather.data.values.weatherCode}
          cloudCover={realtimeWeather.data.values.cloudCover}
        />

          {/* 5 day forecast */}
          <div className="flex flex-col mt-5 gap-6">
            <div><p><b>5-Day Forecast</b></p></div>
            <div className="flex flex-row flex-wrap gap-0 ">
              <FiveDayForecastCard
                key={weatherData.timelines.daily[0].time}
                time={weatherData.timelines.daily[0].time}
                temperature={Math.round(weatherData.timelines.daily[0].values.temperatureAvg)}
                weatherCode={weatherData.timelines.daily[0].values.weatherCodeMax}
              />
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
            />
          </div>
        </div>
      </div>
  )
}

export default Weather