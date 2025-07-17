import ClearDay from '@/assets/images/weather/icons/ClearDay10000.svg';
import ClearNight from '@/assets/images/weather/icons/ClearNight10001.svg';
import Cloudy from '@/assets/images/weather/icons/Cloudy1001.svg';
import DrizleRain from '@/assets/images/weather/icons/DrizzleLightRain4000_4200.svg';
import Fog from '@/assets/images/weather/icons/Fog2000_2100.svg';
import HeavyGust from '@/assets/images/weather/icons/HeavyGust.svg';
import PartlyCloudyDay from '@/assets/images/weather/icons/PartlyCloudyDay11010.svg';
import PartlyCloudyNight from '@/assets/images/weather/icons/PartlyCloudyNight11011.svg';
import Rainy from '@/assets/images/weather/icons/RainyHeavyRain4001_ 4201.svg';
import ThunderStorm from '@/assets/images/weather/icons/ThunderStorm8000.svg';
import Windy from '@/assets/images/weather/icons/Windy.svg';

// Weather Icons Export - Usage Examples:
// 
// 1. BASIC USAGE:
// import WeatherIcons from '@/components/ui/weather';
// 
// const WeatherComponent = () => {
//   return (
//     <View>
//       <WeatherIcons.ClearDay width={50} height={50} />
//       <WeatherIcons.Rainy width={40} height={40} fill="#0066CC" />
//     </View>
//   );
// };
//
// 2. DESTRUCTURED USAGE:
// import WeatherIcons from '@/components/ui/weather';
// const { ClearDay, Rainy, ThunderStorm } = WeatherIcons;
//
// const MyComponent = () => {
//   return (
//     <View>
//       <ClearDay width={60} height={60} />
//       <Rainy width={60} height={60} />
//       <ThunderStorm width={60} height={60} />
//     </View>
//   );
// };
//
// 3. DYNAMIC WEATHER ICON BASED ON CONDITION:
// import WeatherIcons from '@/components/ui/weather';
// 
// const getWeatherIcon = (condition: string, isNight: boolean = false) => {
//   const iconMap = {
//     'clear': isNight ? WeatherIcons.ClearNight : WeatherIcons.ClearDay,
//     'cloudy': WeatherIcons.Cloudy,
//     'partly-cloudy': isNight ? WeatherIcons.PartlyCloudyNight : WeatherIcons.PartlyCloudyDay,
//     'rain': WeatherIcons.Rainy,
//     'drizzle': WeatherIcons.DrizleRain,
//     'thunderstorm': WeatherIcons.ThunderStorm,
//     'fog': WeatherIcons.Fog,
//     'windy': WeatherIcons.Windy,
//     'heavy-gust': WeatherIcons.HeavyGust,
//   };
//   return iconMap[condition] || WeatherIcons.ClearDay;
// };
//
// const WeatherDisplay = ({ condition, isNight, temperature }) => {
//   const WeatherIcon = getWeatherIcon(condition, isNight);
//   return (
//     <View style={{ alignItems: 'center' }}>
//       <WeatherIcon width={80} height={80} />
//       <Text>{temperature}°C</Text>
//       <Text>{condition}</Text>
//     </View>
//   );
// };
//
// 4. TOMORROW.IO WEATHER CODE MAPPING:
// import WeatherIcons from '@/components/ui/weather';
//
// const mapTomorrowIOCodeToIcon = (weatherCode: number, isNight: boolean = false) => {
//   const codeMap = {
//     // Clear
//     10000: isNight ? WeatherIcons.ClearNight : WeatherIcons.ClearDay,
//     10001: isNight ? WeatherIcons.ClearNight : WeatherIcons.ClearDay,
//     
//     // Cloudy
//     1001: WeatherIcons.Cloudy,
//     1100: isNight ? WeatherIcons.PartlyCloudyNight : WeatherIcons.PartlyCloudyDay,
//     1101: isNight ? WeatherIcons.PartlyCloudyNight : WeatherIcons.PartlyCloudyDay,
//     1102: isNight ? WeatherIcons.PartlyCloudyNight : WeatherIcons.PartlyCloudyDay,
//     
//     // Rain
//     4000: WeatherIcons.DrizleRain,
//     4001: WeatherIcons.Rainy,
//     4200: WeatherIcons.DrizleRain,
//     4201: WeatherIcons.Rainy,
//     
//     // Fog
//     2000: WeatherIcons.Fog,
//     2100: WeatherIcons.Fog,
//     
//     // Thunderstorm
//     8000: WeatherIcons.ThunderStorm,
//     8001: WeatherIcons.ThunderStorm,
//     8002: WeatherIcons.ThunderStorm,
//   };
//   
//   return codeMap[weatherCode] || WeatherIcons.ClearDay;
// };
//
// const WeatherFromAPI = ({ weatherCode, isNight }) => {
//   const WeatherIcon = mapTomorrowIOCodeToIcon(weatherCode, isNight);
//   return <WeatherIcon width={60} height={60} />;
// };
//
// 5. RESCUENECT WEATHER CARD COMPONENT:
// import WeatherIcons from '@/components/ui/weather';
//
// const WeatherCard = ({ weatherData }) => {
//   const WeatherIcon = mapTomorrowIOCodeToIcon(weatherData.weatherCode, weatherData.isNight);
//   
//   return (
//     <Card>
//       <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
//         <WeatherIcon width={50} height={50} />
//         <View style={{ marginLeft: 12 }}>
//           <Text size="lg">{weatherData.temperature}°C</Text>
//           <Text size="sm" emphasis="light">{weatherData.condition}</Text>
//           <Text size="xs" emphasis="light">Feels like {weatherData.feelsLike}°C</Text>
//         </View>
//       </View>
//     </Card>
//   );
// };
//
// 6. WEATHER ALERT COMPONENT:
// import WeatherIcons from '@/components/ui/weather';
//
// const WeatherAlert = ({ alertType, severity }) => {
//   const getAlertIcon = (type) => {
//     switch(type) {
//       case 'heavy-rain': return WeatherIcons.Rainy;
//       case 'thunderstorm': return WeatherIcons.ThunderStorm;
//       case 'strong-winds': return WeatherIcons.HeavyGust;
//       case 'fog': return WeatherIcons.Fog;
//       default: return WeatherIcons.Cloudy;
//     }
//   };
//
//   const AlertIcon = getAlertIcon(alertType);
//   const alertColor = severity === 'high' ? '#FF4444' : '#FF8800';
//
//   return (
//     <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: alertColor + '20', borderRadius: 8 }}>
//       <AlertIcon width={32} height={32} fill={alertColor} />
//       <Text style={{ marginLeft: 8, color: alertColor, fontWeight: 'bold' }}>
//         Weather Alert: {alertType}
//       </Text>
//     </View>
//   );
// };

export default { 
    ClearDay, 
    ClearNight, 
    Cloudy, 
    DrizleRain, 
    Fog, 
    HeavyGust, 
    PartlyCloudyDay, 
    PartlyCloudyNight, 
    Rainy, 
    ThunderStorm, 
    Windy,
};