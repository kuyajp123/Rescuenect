import WeatherCard from "@/components/ui/weather/WeatherCard"
import weatherData from "@/data/phTimeZoneWeather.json"

const Weather = () => {

  return (
    <div className="flex flex-row gap-4 h-auto w-full p-4">
      <div className="h-full w-full">
        <WeatherCard
          name={"bancaan"}
          icon={weatherData.timelines.hourly[3].values.weatherCode}
          precipitationProbability={weatherData.timelines.hourly[3].values.precipitationProbability}
          rainAccumulation={weatherData.timelines.hourly[3].values.rainAccumulation}
          rainIntensity={weatherData.timelines.hourly[3].values.rainIntensity}
          humidity={weatherData.timelines.hourly[3].values.humidity}
          temperature={weatherData.timelines.hourly[3].values.temperature}
          temperatureApparent={weatherData.timelines.hourly[3].values.temperatureApparent}
          windSpeed={weatherData.timelines.hourly[3].values.windSpeed}
          weatherCode={weatherData.timelines.hourly[3].values.weatherCode}
          cloudCover={weatherData.timelines.hourly[3].values.cloudCover}
        />
      </div>
      
      <div className="border-1 h-auto w-[50%]"></div>
    </div>
  )
}

export default Weather