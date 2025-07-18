import { getWeatherCondition, getWeatherIcons } from "@/components/helper/WeatherLogic";
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../text';

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
    <TouchableOpacity onPress={() => alert('Navigate to 5 days forecast')}>
        <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
            <View style={{ alignItems: 'center', minWidth: 40 }}>
                <Text emphasis='light' style={{ color: '#ffffff' }}>{day}</Text>
                <Text size="2xs" bold style={{ color: '#ffffff' }}>{date}</Text>
            </View>
            <View>
                <WeatherIcon width={40} height={50} />
            </View>
            <View style={{ minWidth: 110,  }}>
                <Text style={{ color: '#ffffff' }}>{weatherCondition}</Text>
            </View>
            <View >
                <Text size='lg' bold style={{ textAlign: 'right', color: '#ffffff' }}>{temperature}</Text>
            </View>
        </View>
    </TouchableOpacity>    
  )
}

export default FiveDaysForecast

const styles = StyleSheet.create({
    forecastCard: {
        width: '100%',
        textAlign: 'left',
        alignItems: 'flex-start',
    },
})