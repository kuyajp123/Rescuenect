import { getWeatherCondition, getWeatherIcons } from '@/components/helper/WeatherLogic';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { GlassCard } from '../card/GlassCard';
import { Text } from '../text';

export type HourlyForecastItemProps = {
    time: string;
    temperature: string;
    weatherCode?: number;
};

export const HourlyForecastItem = ({ time, temperature, weatherCode = 10000 }: HourlyForecastItemProps) => {
    const WeatherIcon = getWeatherIcons(weatherCode);
    const weatherCondition = getWeatherCondition(weatherCode);

    return (
        <TouchableOpacity onPress={() => 
        alert('Navigate to 24-hour forecast')}
        >
            <GlassCard style={styles.hourlyCard} size="small">
                <View style={styles.cardContent}>
                    {/* Temperature at top */}
                    <Text size="lg" bold style={styles.temperature}>
                        {temperature}
                    </Text>
                    
                    {/* Weather icon and condition in center */}
                    <View style={styles.weatherSection}>
                        <WeatherIcon width={32} height={32} />
                        <Text style={styles.condition}>
                            {weatherCondition}
                        </Text>
                    </View>
                    
                    {/* Time at bottom */}
                    <Text size="xs" emphasis='light' style={styles.time}>
                        {time}
                    </Text>
                </View>
            </GlassCard>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    hourlyCard: {
        minWidth: 100,
        maxWidth: 140,
        height: 'auto',
        marginHorizontal: 5,
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    cardContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    temperature: {
        color: '#ffffff',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    weatherSection: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        marginVertical: 10,
    },
    condition: {
        color: '#ffffff',
        textAlign: 'center',
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    time: {
        color: '#ffffff',
        textAlign: 'center',
        opacity: 0.9,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
});

export default HourlyForecastItem;
