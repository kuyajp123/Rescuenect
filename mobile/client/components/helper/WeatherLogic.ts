import index from '@/components/components/weather/index';
const { 
    ClearDay, 
    ClearNight, 
    Cloudy, 
    DrizzleRain, 
    Fog, 
    PartlyCloudyDay, 
    PartlyCloudyNight, 
    Rainy, 
    ThunderStorm, 
} = index;

// Helper function to determine if it's day or night
const isDayTime = (time?: string | Date): boolean => {
    const now = time ? new Date(time) : new Date();
    const hour = now.getHours();
    // Consider day time from 6 AM to 6 PM (18:00)
    return hour >= 6 && hour < 18;
};

export const getWeatherIcons = (code: number, time?: string | Date) => {
    const isDay = isDayTime(time);

    switch (code) {
        // ☀️ Clear conditions - auto detect day/night
        case 10000:
        case 10001:
        case 1000:
            return isDay ? ClearDay : ClearNight;

        // ⛅ Partly Cloudy conditions - auto detect day/night
        case 11000:
        case 11010:
        case 11020:
        case 11001:
        case 11011:
        case 11021:
        case 1100:
        case 1101:
        case 1102:
            return isDay ? PartlyCloudyDay : PartlyCloudyNight;

        // ☁️ Cloudy conditions - same for day/night
        case 1001:
            return Cloudy;

        // 🌫️ Fog
        case 2100:
        case 2000:
            return Fog;

        // 🌦️ Drizzle Rain
        case 4000:
        case 4200:
            return DrizzleRain;

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