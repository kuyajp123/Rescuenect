import { IconButton } from '@/components/components/button/Button';
import { GlassCard } from '@/components/components/card/GlassCard';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getImageBackground, getWeatherCondition, getWeatherIcons } from '@/helper/WeatherLogic';
import { HourlyWeather } from '@/types/weather';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Cloud, Droplets, Eye, Gauge, Thermometer, Wind } from 'lucide-react-native';
import React from 'react';
import { ImageBackground, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HourlyDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const weatherData: HourlyWeather | null = params.data ? JSON.parse(params.data as string) : null;

  const linerColorLight = ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)'] as const;
  const linerColorDark = ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.6)'] as const;

  if (!weatherData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>No data available</Text>
      </View>
    );
  }

  // Robust Date Parsing Helper
  const parseTime = (timeString: string) => {
    let date = new Date(timeString);
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

  const dateObj = parseTime(weatherData.time);
  const timeString = isNaN(dateObj.getTime())
    ? '--:--'
    : dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateString = isNaN(dateObj.getTime())
    ? 'Invalid Date'
    : dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Get Icons
  const WeatherIcon = getWeatherIcons(weatherData.weatherCode || 1000);
  const conditionText = getWeatherCondition(weatherData.weatherCode || 1000);

  // Helper for grid items
  const DetailItem = ({
    icon: Icon,
    label,
    value,
    unit,
  }: {
    icon: any;
    label: string;
    value: string | number;
    unit?: string;
  }) => (
    <GlassCard style={styles.detailCard} size="small">
      <View style={styles.detailContent}>
        <View style={styles.iconContainer}>
          <Icon size={24} color="#fff" />
        </View>
        <Text size="xs" style={styles.detailLabel}>
          {label}
        </Text>
        <Text size="lg" bold style={styles.detailValue}>
          {value}
          {unit && (
            <Text size="sm" style={styles.unitText}>
              {unit}
            </Text>
          )}
        </Text>
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={getImageBackground({ realtime: [{ weatherCode: weatherData.weatherCode }] })}
        style={styles.imageBackground}
        blurRadius={20}
        resizeMode="cover"
      >
        <LinearGradient
          colors={isDark ? linerColorDark : linerColorLight}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        />

        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <IconButton style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={Colors.text.dark} />
            </IconButton>
            <Text style={styles.headerTitle}>Hourly Forecast</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Main Info Card */}
            <GlassCard style={styles.mainCard} size="large">
              <View style={styles.mainInfoContainer}>
                <Text size="lg" style={styles.dateText}>
                  {dateString}
                </Text>
                <Text size="4xl" bold style={styles.timeText}>
                  {timeString}
                </Text>

                <View style={styles.conditionRow}>
                  <WeatherIcon width={60} height={60} />
                  <View>
                    <Text size="2xl" bold style={styles.tempText}>
                      {Math.round(weatherData.temperature)}°
                    </Text>
                    <Text size="md" style={styles.conditionText}>
                      {conditionText}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text size="sm" style={styles.summaryLabel}>
                      Feels Like
                    </Text>
                    <Text size="lg" bold style={styles.summaryValue}>
                      {Math.round(weatherData.temperatureApparent)}°
                    </Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.summaryItem}>
                    <Text size="sm" style={styles.summaryLabel}>
                      Rain Chance
                    </Text>
                    <Text size="lg" bold style={styles.summaryValue}>
                      {weatherData.precipitationProbability}%
                    </Text>
                  </View>
                </View>
              </View>
            </GlassCard>

            {/* Details Grid */}
            <View style={styles.gridContainer}>
              <DetailItem icon={Wind} label="Wind Speed" value={weatherData.windSpeed} unit="m/s" />
              <DetailItem icon={Droplets} label="Humidity" value={weatherData.humidity} unit="%" />
              <DetailItem icon={Thermometer} label="Dew Point" value={Math.round(weatherData.dewPoint)} unit="°" />
              <DetailItem icon={Eye} label="Visibility" value={weatherData.visibility} unit="km" />
              <DetailItem icon={Cloud} label="Cloud Cover" value={weatherData.cloudCover} unit="%" />
              <DetailItem icon={Gauge} label="Pressure" value={weatherData.pressureSurfaceLevel} unit="hPa" />
              {/* Philippines Specific / Extra */}
              <DetailItem icon={Thermometer} label="UV Index" value={weatherData.uvIndex} />
              <DetailItem icon={Droplets} label="Rain Intensity" value={weatherData.rainIntensity} unit="mm/h" />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default HourlyDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  mainCard: {
    marginBottom: 20,
    padding: 24,
  },
  mainInfoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  dateText: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeText: {
    color: '#fff',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  tempText: {
    color: '#fff',
    lineHeight: 42,
  },
  conditionText: {
    color: 'rgba(255,255,255,0.9)',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  summaryItem: {
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  summaryValue: {
    color: '#fff',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailCard: {
    width: '48%', // Approx 2 columns
    aspectRatio: 1.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 50,
    marginBottom: 4,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  detailValue: {
    color: '#fff',
    textAlign: 'center',
  },
  unitText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 2,
  },
});
