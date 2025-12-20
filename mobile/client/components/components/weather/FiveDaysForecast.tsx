import { getWeatherCondition, getWeatherIcons } from "@/helper/WeatherLogic";
import { Text } from '@/components/ui/text';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export type FiveDaysForecastProps = {
    day?: string;
    date?: string;
    weatherCode?: number;
    temperature?: string;
}

export const FiveDaysForecast = ({ day, date, weatherCode, temperature }: FiveDaysForecastProps) => {

    const WeatherIcon = getWeatherIcons(weatherCode || 10000);
    const weatherCondition = getWeatherCondition(weatherCode || 10000);

  return (
    <Pressable 
    onPress={() => alert('Navigate to 5 days forecast')}
    >
        <View style={styles.forecastContainer}>
            <View style={styles.dayDateContainer}>
                <Text emphasis='light' style={styles.dayText}>{day}</Text>
                <Text size="2xs" bold style={styles.dateText}>{date}</Text>
            </View>
            <View>
                <WeatherIcon width={40} height={50} />
            </View>
            <View style={styles.conditionContainer}>
                <Text style={styles.conditionText}>{weatherCondition}</Text>
            </View>
            <View>
                <Text size='lg' bold style={styles.temperatureText}>{temperature}</Text>
            </View>
        </View>
    </Pressable>    
  )
}

export default FiveDaysForecast

const styles = StyleSheet.create({
    forecastCard: {
        width: '100%',
        textAlign: 'left',
        alignItems: 'flex-start',
    },
    forecastContainer: {
        flexDirection: 'row',
        gap: 20,
        alignItems: 'center',
    },
    dayDateContainer: {
        alignItems: 'center',
        minWidth: 40,
    },
    dayText: {
        color: '#ffffff',
    },
    dateText: {
        color: '#ffffff',
    },
    conditionContainer: {
        minWidth: 110,
    },
    conditionText: {
        color: '#ffffff',
    },
    temperatureText: {
        textAlign: 'right',
        color: '#ffffff',
    },
})