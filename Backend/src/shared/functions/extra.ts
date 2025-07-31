const weatherLocations = {
    coastal_west: '14.311667, 120.751944',
    coastal_east: '14.333333, 120.771389',
    central_naic: '14.302222, 120.771944',
    sabang: '14.320000, 120.805833',
    farm_area: '14.289444, 120.793889',
    naic_boundary: '14.260278, 120.820278',
};

type WeatherType = 'forecast' | 'realtime';

export const getWeatherAPIEndpoints = (
    location: keyof typeof weatherLocations, 
    type: WeatherType
): string => {
    const API_KEY = process.env.WEATHER_API_KEY!;

    const coordinates = weatherLocations[location];
    if (!coordinates) {
        throw new Error(`Invalid location: ${location}`);
    }

    if (type === 'forecast'){
        return `https://api.tomorrow.io/v4/weather/forecast?location=${coordinates}&timesteps=1h&timesteps=1d&apikey=${API_KEY}`;
    } else if (type === 'realtime') {
        return `https://api.tomorrow.io/v4/weather/realtime?location=${coordinates}&apikey=${API_KEY}`;
    }else {
        throw new Error('Invalid type');
    }   
}
