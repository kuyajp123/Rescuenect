import { IconButton } from '@/components/components/button/Button';
import { GlassCard } from '@/components/components/card/GlassCard';
import { Divider } from '@/components/ui/divider';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getImageBackground, getWeatherCondition } from '@/helper/WeatherLogic';
import { useUserData } from '@/store/useBackendResponse';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useWeatherStore } from '@/store/useWeatherStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, TriangleAlert } from 'lucide-react-native';
import React from 'react';
import { ImageBackground, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FiveDaysForecast } from './FiveDaysForecast';
import TwentyFourHourForecast from './TwentyFourHourForecast';

export const MainPage = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const weatherData = useWeatherStore(state => state.weather);
  const userData = useUserData(state => state.userData);
  const notifications = useNotificationStore(state => state.notifications);

  const linerColorLight = ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)'] as const;
  const linerColorDark = ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.6)'] as const;

  // Get the latest weather notification within 30 minutes
  const getLatestFreshNotification = () => {
    const now = Date.now();
    const thirtyMinutesAgo = now - 30 * 60 * 1000; // 30 minutes in milliseconds

    const freshWeatherNotifications = notifications.filter(
      n => n.type === 'weather' && n.timestamp >= thirtyMinutesAgo && n.timestamp <= now
    );

    if (freshWeatherNotifications.length === 0) return null;

    // Sort by timestamp descending (latest first)
    const sorted = freshWeatherNotifications.sort((a, b) => b.timestamp - a.timestamp);

    return sorted[0];
  };

  const latestNotification = getLatestFreshNotification();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={getImageBackground(weatherData)}
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
      </ImageBackground>

      {/* Scrollable Content Overlay */}
      <SafeAreaView style={styles.contentOverlay}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Header with Back Button */}
          <View style={[styles.header, { paddingTop: insets.top * 1.5 }]}>
            <IconButton style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={Colors.text.dark} />
            </IconButton>
          </View>

          {weatherData?.realtime ? (
            <View style={styles.weatherInfo}>
              <Text size="6xl" style={styles.temperatureText}>
                {weatherData?.realtime[0].temperature ? Math.round(Number(weatherData.realtime[0].temperature)) : '--'}
                °C
              </Text>
              <Text size="sm" style={styles.locationText}>
                Brgy {userData.barangay} • {getWeatherCondition(weatherData.realtime[0].weatherCode)}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Weather Data Unavailable</Text>
            </>
          )}

          <View style={styles.weatherCards}>
            {latestNotification && (
              <View style={styles.cardRow}>
                <GlassCard style={{ ...styles.weatherCard, padding: 20 }} size="small">
                  <View style={{ flexDirection: 'column', gap: 8, width: '100%' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TriangleAlert size={20} color={Colors.text.dark} />
                      <Text style={{ color: Colors.text.dark, fontWeight: 'bold', fontSize: 16, flex: 1 }}>
                        Latest Alert
                      </Text>
                    </View>
                    <Text style={{ color: Colors.text.dark, fontWeight: '600', fontSize: 14 }}>
                      {latestNotification.title}
                    </Text>
                    <Text style={{ color: Colors.text.dark, fontSize: 13, lineHeight: 18 }}>
                      {latestNotification.message}
                    </Text>
                    <Text style={{ color: Colors.text.dark, fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                      {new Date(latestNotification.timestamp).toLocaleTimeString('en-PH', {
                        timeZone: 'Asia/Manila',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </GlassCard>
              </View>
            )}

            {weatherData?.realtime ? (
              <>
                <View style={styles.cardRow}>
                  <GlassCard
                    title="Feels Like"
                    value={`${Math.round(weatherData.realtime[0].temperatureApparent)}°C`}
                    size="small"
                    style={styles.weatherCard}
                  />
                  <GlassCard
                    title="UV Index"
                    value={
                      weatherData.realtime[0].uvIndex !== undefined ? weatherData.realtime[0].uvIndex.toString() : 'N/A'
                    }
                    size="small"
                    style={styles.weatherCard}
                  />
                </View>

                <View style={styles.cardRow}>
                  <GlassCard
                    title="Humidity"
                    value={`${weatherData.realtime[0].humidity}%`}
                    size="small"
                    style={styles.weatherCard}
                  />
                  <GlassCard
                    title="Cloud Cover"
                    value={`${weatherData.realtime[0].cloudCover}%`}
                    size="small"
                    style={styles.weatherCard}
                  />
                </View>

                <View style={styles.cardRow}>
                  <GlassCard
                    title="Chance of Rain"
                    value={`${weatherData.realtime[0].precipitationProbability}%`}
                    size="small"
                    style={styles.weatherCard}
                  />
                  <GlassCard
                    title="Rain Intensity"
                    value={`${weatherData.realtime[0].rainIntensity} mm/h`}
                    size="small"
                    style={styles.weatherCard}
                  />
                </View>

                <View style={styles.cardRow}>
                  <GlassCard
                    title="Visibility"
                    value={`${weatherData.realtime[0].visibility} km`}
                    size="small"
                    style={styles.weatherCard}
                  />
                  <GlassCard
                    title="Wind Speed"
                    value={`${weatherData.realtime[0].windSpeed} m/s`}
                    size="small"
                    style={styles.weatherCard}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Weather Data Unavailable</Text>
              </>
            )}

            {/* 24-hours Forecast */}
            <View style={styles.fullWidthCard}>
              <TwentyFourHourForecast hourlyData={weatherData?.hourly} />
            </View>

            {/* 5 Days Forecast */}
            <View style={styles.fullWidthCard}>
              <GlassCard style={styles.forecastCard} title="5 Days Forecast" size="small">
                <View style={[styles.bottomSpacer]} />

                {weatherData?.daily && weatherData.daily.length > 0 ? (
                  <>
                    {weatherData.daily.slice(0, 5).map((dailyItem, index) => {
                      // Parse the date properly - handle different date formats
                      const parseDate = (dateString: string) => {
                        // Try parsing the date string directly first
                        let date = new Date(dateString);

                        // If invalid, try parsing MM/DD/YYYY, HH:MM:SS AM/PM format
                        if (isNaN(date.getTime()) && dateString.includes('/')) {
                          const [datePart] = dateString.split(', ');
                          const [month, day, year] = datePart.split('/');
                          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                        }

                        return date;
                      };

                      const date = parseDate(dailyItem.time);
                      const isToday = index === 0;

                      // Fallback to current date + index if parsing fails
                      const displayDate = isNaN(date.getTime())
                        ? new Date(Date.now() + index * 24 * 60 * 60 * 1000)
                        : date;

                      const dayName = isToday ? 'Today' : displayDate.toLocaleDateString('en-US', { weekday: 'short' });

                      return (
                        <React.Fragment key={dailyItem.id}>
                          <FiveDaysForecast
                            day={dayName}
                            date={displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            weatherCode={dailyItem.weatherCodeMax}
                            temperature={`${Math.round(dailyItem.temperatureMax)}°C`}
                            onPress={() => {
                              router.push({
                                pathname: '/Weather/DailyForecastDetails',
                                params: { data: JSON.stringify(dailyItem) },
                              });
                            }}
                          />
                          {index < Math.min(weatherData.daily.length, 5) - 1 && (
                            <Divider style={{ marginVertical: 10, backgroundColor: Colors.icons.dark }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </>
                ) : (
                  <>
                    <FiveDaysForecast day="Today" date="Nov 4" weatherCode={1001} temperature="25°C" />
                    <Divider style={{ marginVertical: 10, backgroundColor: Colors.icons.dark }} />
                    <FiveDaysForecast day="Thu" date="Nov 5" weatherCode={1001} temperature="26°C" />
                  </>
                )}
              </GlassCard>
            </View>
          </View>

          {/* Bottom padding for tab navigation */}
          <View style={[styles.bottomSpacer, { paddingBottom: insets.bottom }]} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default MainPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 10,
    borderRadius: 50,
  },
  weatherInfo: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
    minHeight: 300,
  },
  temperatureText: {
    color: 'white',
    textShadowColor: 'black',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 10,
    textAlign: 'center',
  },
  locationText: {
    color: 'white',
    textShadowColor: 'black',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 10,
    textAlign: 'center',
    marginTop: 10,
    textTransform: 'capitalize',
  },
  weatherCards: {
    marginTop: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'black',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 5,
    marginBottom: 20,
    textAlign: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  weatherCard: {
    flex: 1,
  },
  fullWidthCard: {
    marginTop: 10,
    width: '100%',
  },
  forecastCard: {
    width: '100%',
    textAlign: 'left',
    alignItems: 'flex-start',
  },
  bottomSpacer: {
    // height: 30,
    marginTop: 10,
  },
});
