import index from '@/components/ui/weather/index';
import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import GlassCard from '../card/GlassCard';
import { Divider } from '../divider';
import { Text } from '../text';
const { 
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
} = index;
Divider
Colors

export type FiveDaysForecastProps = {
    day?: string;
    date?: string;
    weatherCode?: number;
    temperature?: string;
    isNight?: boolean;
}

export const FiveDaysForecast = ({ day, date, weatherCode, temperature, isNight }: FiveDaysForecastProps) => {

  return (
    <GlassCard style={styles.forecastCard} title="5 Days Forecast" size='small'>
        <TouchableOpacity onPress={() => alert('Navigate to 5 days forecast')}>
            <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                <View style={{ alignItems: 'center', minWidth: 40 }}>
                    <Text emphasis='light' style={{ color: '#ffffff' }}>{day}</Text>
                    <Text bold style={{ color: '#ffffff' }}>{date}</Text>
                </View>
                <View>
                    <PartlyCloudyDay width={40} height={50} />
                </View>
                <View style={{ minWidth: 140,  }}>
                    <Text style={{ color: '#ffffff' }}>Partly Cloudy</Text>
                </View>
                <View >
                    <Text size='lg' bold style={{ textAlign: 'right', color: '#ffffff' }}>{temperature}</Text>
                </View>
            </View>
        </TouchableOpacity>

        {/* <Divider style={{ marginVertical: 10, backgroundColor: Colors.icons.dark }} /> */}
    </GlassCard>
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