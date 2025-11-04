import { IconButton, PrimaryButton } from '@/components/components/button/Button';
import { GlassCard } from '@/components/components/card/GlassCard';
import { getWeatherCondition, isDayTime } from '@/components/helper/WeatherLogic';
import { useUserData } from '@/components/store/useBackendResponse';
import { useWeatherStore } from '@/components/store/useWeatherStore';
import { Divider } from '@/components/ui/divider';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, LocateFixed, TriangleAlert } from 'lucide-react-native';
import React from 'react';
import { ImageBackground, SafeAreaView, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FiveDaysForecast } from './FiveDaysForecast';
import TwentyFourHourForecast from './TwentyFourHourForecast';

export const MainPage = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const weatherData = useWeatherStore(state => state.weather);
  const userData = useUserData(state => state.userData);

  const linerColorLight = ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)'] as const;
  const linerColorDark = ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.6)'] as const;

  const ClearDay = require('@/assets/images/weather/image/ClearDay.png');
  const ClearNight = require('@/assets/images/weather/image/ClearNight.png');
  const CloudyDay = require('@/assets/images/weather/image/CloudyDay.png');
  const CloudyNight = require('@/assets/images/weather/image/CloudyNight.png');
  const Rainy = require('@/assets/images/weather/image/Rain.png');
  const ThunderStorm = require('@/assets/images/weather/image/ThunderStorm.png');

  const date = new Date();

  function getImageBackground() {
    const isDay: boolean = isDayTime(date);

    if (weatherData?.realtime && weatherData.realtime.length > 0) {
      switch (getWeatherCondition(weatherData.realtime[0].weatherCode)) {
        case 'Clear':
          return isDay ? ClearDay : ClearNight;
        case 'Partly Cloudy':
        case 'Cloudy':
          return isDay ? CloudyDay : CloudyNight;
        case 'Rain':
        case 'Light Rain':
          return Rainy;
        case 'ThunderStorm':
          return ThunderStorm;
        case 'Foggy':
          return isDay ? CloudyDay : CloudyNight;
        default:
          return ClearDay;
      }
    }
  }

  React.useEffect(() => {}, []);

  return (
    <View style={styles.container}>
      <ImageBackground source={getImageBackground()} style={styles.imageBackground} blurRadius={20} resizeMode="cover">
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

          {/* Search Section */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <TextInput
                placeholder="Search for a location"
                style={[
                  styles.searchInput,
                  { backgroundColor: isDark ? Colors.border.dark : '#f0f0f0', color: isDark ? '#fff' : '#000' },
                ]}
                placeholderTextColor={isDark ? Colors.text.dark : '#888'}
              />
            </View>
            <View style={styles.buttonContainer}>
              <PrimaryButton onPress={() => console.log('Search pressed')} style={styles.locationButton}>
                <LocateFixed size={20} color={'#ffffff'} />
              </PrimaryButton>
            </View>
          </View>

          {weatherData?.realtime ? (
            <View style={styles.weatherInfo}>
              <Text size="6xl" style={styles.temperatureText}>
                {Math.round(weatherData.realtime[0].temperature)}°C
              </Text>
              <Text style={styles.locationText}>
                Brgy {userData.barangay} • {getWeatherCondition(weatherData.realtime[0].weatherCode)}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Weather Data Unavailable</Text>
            </>
          )}

          <View style={styles.weatherCards}>
            <View style={styles.cardRow}>
              <GlassCard style={{ ...styles.weatherCard, padding: 20 }} size="small">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: '100%' }}>
                  <TriangleAlert size={20} color={Colors.text.dark} />
                  <Text style={{ color: Colors.text.dark, width: '89%' }}>Weather Notification here.</Text>
                </View>
              </GlassCard>
            </View>

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
  searchSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  searchContainer: {
    width: '80%',
  },
  searchInput: {
    borderRadius: 8,
    padding: 10,
    paddingLeft: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '15%',
  },
  locationButton: {
    borderRadius: 100,
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
