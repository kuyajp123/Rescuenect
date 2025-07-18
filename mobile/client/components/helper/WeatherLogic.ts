import index from '@/components/ui/weather/index';
const { 
    ClearDay, 
    ClearNight, 
    Cloudy, 
    DrizleRain, 
    Fog, 
    PartlyCloudyDay, 
    PartlyCloudyNight, 
    Rainy, 
    ThunderStorm, 
} = index;

export const getWeatherIcons = (code: number) => {
    switch (code) {
        // ☀️ Clear Day
        case 10000:
            return ClearDay;
        
        // 🌙 Clear Night
        case 10001:
            return ClearNight;
        
        // ⛅ Partly Cloudy Day
        case 11000:
        case 11010:
        case 11020:
            return PartlyCloudyDay;
        
        // 🌙⛅ Partly Cloudy Night
        case 11001:
        case 11011:
        case 11021:
            return PartlyCloudyNight;
        
        // 🌫️ Fog
        case 2100:
        case 2000:
            return Fog;
        
        // 🌦️ Drizzle Rain
        case 4000:
        case 4200:
            return DrizleRain;
        
        // 🌧️ Rainy
        case 4001:
        case 4201:
            return Rainy;
        
        // ⛈️ Thunderstorm
        case 8000:
            return ThunderStorm;
        
        // Default fallback - return cloudy for unknown codes
        default:
            return Cloudy;
    }
}

// Helper function to get weather condition text from weather code
export const getWeatherCondition = (code: number): string => {
    switch (code) {
        // Clear conditions
        case 10000:
        case 10001:
        case 1000:
            return "Clear";
        
        // Partly Cloudy conditions
        case 1100: 
        case 1101:
        case 1102:
            return "Partly Cloudy";

        // Cloudy conditions
        case 1001:
            return "Cloudy";
        
        // Fog conditions
        case 2100:
        case 2000:
            return "Foggy";
        
        // Drizzle conditions
        case 4000:
        case 4200:
            return "Light Rain";
        
        // Rainy conditions
        case 4001:
        case 4201:
            return "Rainy";
        
        // Thunderstorm conditions
        case 8000:
            return "Thunderstorm";
        
        // Default fallback
        default:
            return "Cloudy";
    }
}

export const getWeatherImage = (code: number) => {
    switch (code) {
        // ☀️ Clear Day
        case 10000:
        case 1000:
            return require('@/assets/images/weather/image/ClearDay.png');
        
        // 🌙 Clear Night
        case 10001:
            return require('@/assets/images/weather/image/ClearNight.png');
        
        // ⛅ Partly Cloudy Day
        case 11000:
        case 11010:
        case 11020:
        case 1100:
        case 1101:
        case 1102:
            return require('@/assets/images/weather/image/CloudyDay.png');
        
        // 🌙⛅ Partly Cloudy Night
        case 11001:
        case 11011:
        case 11021:
            return require('@/assets/images/weather/image/CloudyNight.png');
        
        // 🌫️ Fog (use CloudyDay as fallback)
        case 2100:
        case 2000:
            return require('@/assets/images/weather/image/CloudyDay.png');
        
        // 🌦️🌧️ All Rain Related (Light Rain, Drizzle, Heavy Rain)
        case 4000: // Light Rain
        case 4200: // Light Rain
        case 4001: // Rain
        case 4201: // Heavy Rain
            return require('@/assets/images/weather/image/Rain.png');
        
        // ⛈️ Thunderstorm
        case 8000:
            return require('@/assets/images/weather/image/ThunderStorm.png');
        
        // 🌥️ Default Cloudy (for unknown codes or general cloudy conditions)
        case 1001: // Cloudy
        default:
            return require('@/assets/images/weather/image/CloudyDay.png');
    }
}

export default { getWeatherIcons, getWeatherCondition, getWeatherImage };