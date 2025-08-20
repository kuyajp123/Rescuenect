import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { GlassCard } from '../../components/card/GlassCard';
import HourlyForecastItem, { HourlyForecastItemProps } from './HourlyForecastItem';

export type TwentyFourHourForecastProps = {
    hourlyData?: HourlyForecastItemProps[];
};

// Sample data for demonstration
const defaultHourlyData: HourlyForecastItemProps[] = [
    { time: "Now", temperature: "39°C", weatherCode: 10000 },
    { time: "2 PM", temperature: "40°C", weatherCode: 11000 },
    { time: "3 PM", temperature: "38°C", weatherCode: 11010 },
    { time: "4 PM", temperature: "37°C", weatherCode: 4000 },
    { time: "5 PM", temperature: "35°C", weatherCode: 4001 },
    { time: "6 PM", temperature: "33°C", weatherCode: 8000 },
    { time: "7 PM", temperature: "31°C", weatherCode: 11000 },
    { time: "8 PM", temperature: "29°C", weatherCode: 10001 },
    { time: "9 PM", temperature: "28°C", weatherCode: 10001 },
    { time: "10 PM", temperature: "27°C", weatherCode: 11001 },
];

export const TwentyFourHourForecast = ({ hourlyData = defaultHourlyData }: TwentyFourHourForecastProps) => {
    
    const renderHourlyItem = ({ item }: { item: HourlyForecastItemProps }) => (
        <HourlyForecastItem
            time={item.time}
            temperature={item.temperature}
            weatherCode={item.weatherCode}
        />
    );

    return (
        <GlassCard style={styles.container} title="24-hours Forecast" size="small">
            <FlatList
                data={hourlyData}
                renderItem={renderHourlyItem}
                keyExtractor={(item, index) => `hour-${index}`}
                horizontal={true}
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.listContainer}
                style={styles.flatList}
            />
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'flex-start',
    },
    flatList: {
        flexGrow: 0,
    },
    listContainer: {
        paddingHorizontal: 5,
        paddingVertical: 10,
    },
});

export default TwentyFourHourForecast;
