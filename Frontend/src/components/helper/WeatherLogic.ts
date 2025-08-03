import {
    ClearDayIcon,
    ClearNightIcon,
    CloudyIcon,
    DrizzleRainIcon,
    FogIcon,
    PartlyCloudyDayIcon,
    PartlyCloudyNightIcon,
    RainyIcon,
    ThunderStormIcon,
    HeavyGustIcon,
    WindyIcon
} from '@/components/ui/weather';

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
            return isDay ? ClearDayIcon : ClearNightIcon;

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
            return isDay ? PartlyCloudyDayIcon : PartlyCloudyNightIcon;

        // ☁️ Cloudy conditions - same for day/night
        case 1001:
            return CloudyIcon;

        // 🌫️ Fog
        case 2100:
        case 2000:
            return FogIcon;

        // 🌦️ Drizzle Rain
        case 4000:
        case 4200:
            return DrizzleRainIcon;

        // 🌧️ Rainy
        case 4001:
        case 4201:
            return RainyIcon;

        // ⛈️ Thunderstorm
        case 8000:
            return ThunderStormIcon;

        // Default fallback - return cloudy for unknown codes
        default:
            return CloudyIcon;
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
            return "custom";
    }
}