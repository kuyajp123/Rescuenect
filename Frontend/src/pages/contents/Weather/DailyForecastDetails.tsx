import GlassCard from '@/components/ui/card/GlassCard';
import WeatherBackgroundLayout from '@/components/ui/weather/WeatherBackgroundLayout';
import { GetDateAndTime } from '@/helper/DateAndTime';
import { getWeatherCondition, getWeatherIcons } from '@/helper/WeatherLogic';
import { useWeatherStore } from '@/stores/useWeatherStores';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';
import {
    ArrowLeft,
    Cloud,
    Droplets,
    Eye,
    Moon,
    Sun,
    Sunrise,
    Sunset,
    Thermometer,
    Wind
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const DailyForecastDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const data = useWeatherStore(state => state.weather);

  const forecast = data?.daily?.find(d => d.id === id);

  if (!forecast) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <h2 className="text-xl">Forecast not found</h2>
        <Button onPress={() => navigate('/weather')} className="mt-4" color="primary">
          Back to Weather
        </Button>
      </div>
    );
  }

  const gridItems = [
    {
      title: 'Wind',
      icon: <Wind className="w-5 h-5 text-blue-400" />,
      items: [
        { label: 'Speed', value: `${forecast.windSpeedAvg} km/h` },
        { label: 'Direction', value: `${forecast.windDirectionAvg}°` },
        { label: 'Gusts', value: `${forecast.windGustMax} km/h` },
      ],
    },
    {
      title: 'Atmosphere',
      icon: <Cloud className="w-5 h-5 text-gray-400" />,
      items: [
        { label: 'Humidity', value: `${forecast.humidityAvg}%` },
        { label: 'Pressure', value: `${forecast.pressureSeaLevelAvg} hPa` },
        { label: 'Dew Point', value: `${forecast.dewPointAvg}°C` },
      ],
    },
    {
      title: 'Precipitation',
      icon: <Droplets className="w-5 h-5 text-blue-500" />,
      items: [
        { label: 'Probability', value: `${forecast.precipitationProbabilityAvg}%` },
        { label: 'Rain Acc.', value: `${forecast.rainAccumulationSum} mm` },
        { label: 'Intensity', value: `${forecast.rainIntensityAvg} mm/h` },
      ],
    },
    {
      title: 'Conditions',
      icon: <Eye className="w-5 h-5 text-yellow-500" />,
      items: [
        { label: 'UV Index', value: forecast.uvIndexMax },
        { label: 'Visibility', value: `${forecast.visibilityAvg} km` },
        { label: 'Cloud Cover', value: `${forecast.cloudCoverAvg}%` },
      ],
    },
      {
          title: 'Temperature',
          icon: <Thermometer className="w-5 h-5 text-red-500" />,
          items: [
              { label: 'Min', value: `${forecast.temperatureMin}°C` },
              { label: 'Max', value: `${forecast.temperatureMax}°C` },
              { label: 'Feels Like', value: `${forecast.temperatureApparentAvg}°C` },
          ],
      }
  ];

  return (
    <WeatherBackgroundLayout weatherCode={forecast.weatherCodeMax} time={forecast.time}>
      <div className="flex flex-col h-full w-full p-4 gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button isIconOnly variant="light" onPress={() => navigate('/weather')}>
          <ArrowLeft className="w-6 h-6 text-white" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Daily Forecast Details</h1>
          <p className="text-sm opacity-70">
            {GetDateAndTime({ date: forecast.time, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Card */}
        <div className="lg:col-span-1 h-full">
            <GlassCard className="h-full p-8 flex flex-col items-center justify-center gap-6">
                <div className="flex flex-col items-center">
                    {getWeatherIcons(forecast.weatherCodeMax, forecast.time)({ height: 120, width: 120 })}
                    <div className="mt-4 text-center">
                         <h2 className="text-6xl font-bold">{Math.round(forecast.temperatureAvg)}°C</h2>
                         <p className="text-xl mt-2 text-default-500">{getWeatherCondition(forecast.weatherCodeMax)}</p>
                    </div>
                </div>
                 <div className="w-full grid grid-cols-2 gap-4 mt-4">
                    <div className='flex flex-col items-center p-3 bg-default-100 rounded-xl'>
                        <span className='text-sm text-default-600 dark:text-default-400'>High</span>
                        <span className='text-xl font-semibold text-default-900 dark:text-white'>{forecast.temperatureMax}°C</span>
                    </div>
                     <div className='flex flex-col items-center p-3 bg-default-100 rounded-xl'>
                        <span className='text-sm text-default-600 dark:text-default-400'>Low</span>
                        <span className='text-xl font-semibold text-default-900 dark:text-white'>{forecast.temperatureMin}°C</span>
                    </div>
                </div>
            </GlassCard>
        </div>

        {/* Details Grid */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Sun & Moon */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Card className="p-4 border border-default-200 dark:border-default-100 bg-white/50 dark:bg-black/20 backdrop-blur-md">
                     <CardBody>
                         <div className="flex items-center gap-2 mb-4">
                             <Sun className="text-orange-500 w-5 h-5"/>
                             <h3 className="font-semibold">Sun Cycle</h3>
                         </div>
                         <div className="flex justify-between items-center px-4">
                             <div className="flex flex-col items-center">
                                 <Sunrise className="w-8 h-8 text-orange-400 mb-2"/>
                                 <span className="text-xs opacity-70">Sunrise</span>
                                 <span className="font-medium">
                                     {new Date(forecast.sunriseTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </span>
                             </div>
                             <div className="h-px w-full bg-gradient-to-r from-orange-400/20 via-orange-500/50 to-orange-400/20 mx-4 relative top-[-10px]"></div>
                             <div className="flex flex-col items-center">
                                 <Sunset className="w-8 h-8 text-orange-600 mb-2"/>
                                 <span className="text-xs opacity-70">Sunset</span>
                                 <span className="font-medium">
                                      {new Date(forecast.sunsetTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </span>
                             </div>
                         </div>
                     </CardBody>
                 </Card>
                  <Card className="p-4 border border-default-200 dark:border-default-100 bg-white/50 dark:bg-black/20 backdrop-blur-md">
                     <CardBody>
                         <div className="flex items-center gap-2 mb-4">
                             <Moon className="text-blue-300 w-5 h-5"/>
                             <h3 className="font-semibold">Moon Cycle</h3>
                         </div>
                         <div className="flex justify-between items-center px-4">
                             <div className="flex flex-col items-center">
                                 <div className="w-8 h-8 rounded-full border-2 border-slate-400 flex items-center justify-center mb-2 bg-slate-800">
                                     <div className="w-4 h-4 bg-slate-200 rounded-full blur-[1px]"></div>
                                 </div>
                                 <span className="text-xs opacity-70">Moonrise</span>
                                 <span className="font-medium">
                                     {new Date(forecast.moonriseTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </span>
                             </div>
                             
                             <div className="flex flex-col items-center">
                                  <div className="w-8 h-8 rounded-full border-2 border-slate-400 flex items-center justify-center mb-2 bg-slate-800 opacity-50">
                                 </div>
                                 <span className="text-xs opacity-70">Moonset</span>
                                 <span className="font-medium">
                                      {new Date(forecast.moonsetTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </span>
                             </div>
                         </div>
                     </CardBody>
                 </Card>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                 {gridItems.map((group, index) => (
                     <Card key={index} className="border border-default-200 dark:border-default-100 bg-white/50 dark:bg-black/20 backdrop-blur-md">
                         <CardBody className="p-4">
                             <div className="flex items-center gap-2 mb-4">
                                 {group.icon}
                                 <h3 className="font-semibold text-sm">{group.title}</h3>
                             </div>
                             <div className="space-y-3">
                                 {group.items.map((item, i) => (
                                     <div key={i} className="flex justify-between items-center text-sm">
                                         <span className="opacity-70">{item.label}</span>
                                         <span className="font-medium">{item.value}</span>
                                     </div>
                                 ))}
                             </div>
                         </CardBody>
                     </Card>
                 ))}
             </div>
        </div>
      </div>
    </div>
    </WeatherBackgroundLayout>
  );
};

export default DailyForecastDetails;