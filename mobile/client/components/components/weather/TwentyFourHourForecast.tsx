import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { GlassCard } from '../../components/card/GlassCard';
import HourlyForecastItem, { HourlyForecastItemProps } from './HourlyForecastItem';

import { HourlyForecast } from '@/types/components';

export type TwentyFourHourForecastProps = {
  hourlyData?: HourlyForecast[];
};

// Generate sample hourly forecast data if no data provided
const generateSampleHourlyForecast = (): HourlyForecastItemProps[] => {
  const hours = [];
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const hour = new Date(now.getTime() + i * 60 * 60 * 1000);
    const baseTemp = 25;
    const tempVariation = Math.sin((i * Math.PI) / 12) * 5; // Temperature varies throughout day
    const temp = Math.round(baseTemp + tempVariation);

    hours.push({
      time: i === 0 ? 'Now' : hour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
      temperature: `${temp}°C`,
      weatherCode: 1001,
    });
  }

  return hours;
};

export const TwentyFourHourForecast = ({ hourlyData }: TwentyFourHourForecastProps) => {
  const router = useRouter();

  // Map hourly data to forecast format or use sample data
  const forecastData =
    hourlyData && hourlyData.length > 0
      ? hourlyData.map((item, index) => {
          // Parse the time properly
          const parseTime = (timeString: string) => {
            // Try parsing the time string directly first
            let date = new Date(timeString);

            // If invalid, try parsing MM/DD/YYYY, HH:MM:SS AM/PM format
            if (isNaN(date.getTime()) && timeString.includes('/')) {
              const [datePart, timePart] = timeString.split(', ');
              const [month, day, year] = datePart.split('/');

              if (timePart) {
                const [time, period] = timePart.split(' ');
                const [hours, minutes, seconds] = time.split(':');
                let hour24 = parseInt(hours);

                if (period === 'PM' && hour24 !== 12) hour24 += 12;
                if (period === 'AM' && hour24 === 12) hour24 = 0;

                date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minutes));
              }
            }

            return date;
          };

          const parsedTime = parseTime(item.time);
          const displayTime = isNaN(parsedTime.getTime())
            ? `${index + 1}h` // Fallback to hour offset
            : parsedTime.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

          return {
            time: index === 0 ? 'Now' : displayTime,
            temperature: `${Math.round(item.temperature)}°C`,
            weatherCode: item.weatherCode,
            originalItem: item,
          };
        })
      : generateSampleHourlyForecast();

  const renderHourlyItem = ({ item }: { item: any }) => (
    <HourlyForecastItem
      time={item.time}
      temperature={item.temperature}
      weatherCode={item.weatherCode}
      onPress={() => {
        if (item.originalItem) {
          router.push({
            pathname: '/Weather/HourlyDetails',
            params: { data: JSON.stringify(item.originalItem) },
          });
        }
      }}
    />
  );

  return (
    <GlassCard style={styles.container} title="24-hours Forecast" size="small">
      <FlatList
        data={forecastData}
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
