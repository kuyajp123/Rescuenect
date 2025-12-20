import { IconButton } from '@/components/components/button/Button';
import { GlassCard } from '@/components/components/card/GlassCard';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getImageBackground, getWeatherCondition, getWeatherIcons } from '@/helper/WeatherLogic';
import { DailyWeather } from '@/types/weather';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Cloud, CloudRain, Droplets, Sun, Sunrise, Sunset, Thermometer, Wind } from 'lucide-react-native';
import React from 'react';
import { ImageBackground, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DailyForecastDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const weatherData: DailyWeather | null = params.data ? JSON.parse(params.data as string) : null;

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
  const parseDate = (dateString: string) => {
    let date = new Date(dateString);
    if (isNaN(date.getTime()) && dateString.includes('/')) {
      const [datePart, timePart] = dateString.split(', ');
      const [month, day, year] = datePart.split('/');

      // Even though Daily might not care about time, parsing it robustly ensures we get a valid Date object
      if (timePart) {
        const [time, period] = timePart.split(' ');
        const [hours, minutes, seconds] = time.split(':');
        let hour24 = parseInt(hours);
        if (period === 'PM' && hour24 !== 12) hour24 += 12;
        if (period === 'AM' && hour24 === 12) hour24 = 0;
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minutes));
      } else {
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
    return date;
  };

  const dateObj = parseDate(weatherData.time);
  const displayDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;
  const dateString = isNaN(dateObj.getTime())
    ? 'Invalid Date'
    : displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Get Icons
  // Use Max weather code for "Day" icon largely
  const WeatherIcon = getWeatherIcons(weatherData.weatherCodeMax || 1000);
  const conditionText = getWeatherCondition(weatherData.weatherCodeMax || 1000);

  // Helper for formatting large details
  const DetailRow = ({
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
    <View style={styles.detailRow}>
      <View style={styles.detailRowLeft}>
        <View style={styles.iconCircle}>
          <Icon size={20} color="#fff" />
        </View>
        <Text size="md" style={styles.detailRowLabel}>
          {label}
        </Text>
      </View>
      <Text size="lg" bold style={styles.detailRowValue}>
        {value}
        {unit}
      </Text>
    </View>
  );

  // Format Time Helper
  const formatSunTime = (isoString: string) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={getImageBackground({ realtime: [{ weatherCode: weatherData.weatherCodeMax }] })}
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
            <Text style={styles.headerTitle}>Daily Forecast</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Main Summary Card */}
            <GlassCard style={styles.mainCard} size="large">
              <View style={styles.mainInfoContainer}>
                <Text size="lg" style={styles.dateText}>
                  {dateString}
                </Text>

                <View style={styles.conditionRow}>
                  <WeatherIcon width={80} height={80} />
                  <View>
                    <View style={styles.tempRangeRow}>
                      <Text size="4xl" bold style={styles.tempText}>
                        {Math.round(weatherData.temperatureMax)}°
                      </Text>
                      <Text size="2xl" style={styles.tempMinText}>
                        / {Math.round(weatherData.temperatureMin)}°
                      </Text>
                    </View>
                    <Text size="lg" style={styles.conditionText}>
                      {conditionText}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryStats}>
                  <View style={styles.statItem}>
                    <Droplets size={20} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.statValue} bold>
                      {weatherData.precipitationProbabilityMax}%
                    </Text>
                    <Text style={styles.statLabel}>Rain</Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.statItem}>
                    <Wind size={20} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.statValue} bold>
                      {weatherData.windSpeedMax} m/s
                    </Text>
                    <Text style={styles.statLabel}>Wind</Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.statItem}>
                    <Sun size={20} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.statValue} bold>
                      {weatherData.uvIndexMax}
                    </Text>
                    <Text style={styles.statLabel}>UV Index</Text>
                  </View>
                </View>
              </View>
            </GlassCard>

            {/* Sun & Moon Cycle */}
            <Text style={styles.sectionTitle}>Celestial Cycle</Text>
            <View style={styles.sunMoonContainer}>
              <GlassCard style={styles.sunCard} size="small">
                <View style={styles.sunContent}>
                  <Sunrise size={28} color="#FFD700" />
                  <Text style={styles.sunLabel}>Sunrise</Text>
                  <Text style={styles.sunTime} bold>
                    {formatSunTime(weatherData.sunriseTime)}
                  </Text>
                </View>
              </GlassCard>
              <GlassCard style={styles.sunCard} size="small">
                <View style={styles.sunContent}>
                  <Sunset size={28} color="#FFA500" />
                  <Text style={styles.sunLabel}>Sunset</Text>
                  <Text style={styles.sunTime} bold>
                    {formatSunTime(weatherData.sunsetTime)}
                  </Text>
                </View>
              </GlassCard>
            </View>

            {/* Detailed Metrics */}
            <Text style={styles.sectionTitle}>Details</Text>
            <GlassCard style={styles.detailListCard} size="medium">
              <DetailRow
                icon={Thermometer}
                label="Feels Like Max"
                value={Math.round(weatherData.temperatureApparentMax)}
                unit="°"
              />
              <View style={styles.innerDivider} />
              <DetailRow
                icon={Thermometer}
                label="Feels Like Min"
                value={Math.round(weatherData.temperatureApparentMin)}
                unit="°"
              />
              <View style={styles.innerDivider} />
              <DetailRow icon={Droplets} label="Humidity Avg" value={Math.round(weatherData.humidityAvg)} unit="%" />
              <View style={styles.innerDivider} />
              <DetailRow icon={CloudRain} label="Rain Amount" value={weatherData.rainAccumulationSum} unit=" mm" />
              <View style={styles.innerDivider} />
              <DetailRow icon={Cloud} label="Cloud Cover Avg" value={Math.round(weatherData.cloudCoverAvg)} unit="%" />
            </GlassCard>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default DailyForecastDetails;

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
    padding: 24,
    marginBottom: 24,
  },
  mainInfoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  dateText: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  tempRangeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  tempText: {
    color: '#fff',
    lineHeight: 48,
  },
  tempMinText: {
    color: 'rgba(255,255,255,0.6)',
  },
  conditionText: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sunMoonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  sunCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  sunContent: {
    alignItems: 'center',
    gap: 4,
  },
  sunLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  sunTime: {
    color: '#fff',
    fontSize: 16,
  },
  detailListCard: {
    padding: 0, // Reset padding for list items
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    width: '100%',
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 20,
  },
  detailRowLabel: {
    color: 'rgba(255,255,255,0.8)',
  },
  detailRowValue: {
    color: '#fff',
  },
  innerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    marginLeft: 56, // Indent for style
  },
});
