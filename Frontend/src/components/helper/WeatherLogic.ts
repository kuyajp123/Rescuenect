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

export const getWeatherIcons = (code: number) => {
    switch (code) {
        // ☀️ Clear Day
        case 10000:
            return ClearDayIcon;
        
        // 🌙 Clear Night
        case 10001:
            return ClearNightIcon;

        // ⛅ Partly Cloudy Day
        case 11000:
        case 11010:
        case 11020:
            return PartlyCloudyDayIcon;
        
        // 🌙⛅ Partly Cloudy Night
        case 11001:
        case 11011:
        case 11021:
            return PartlyCloudyNightIcon;

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
            return "Cloudy";
    }
}