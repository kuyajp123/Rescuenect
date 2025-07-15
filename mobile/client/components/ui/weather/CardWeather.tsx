import { GetDate, GetTime } from '@/components/helper/DateAndTime';
import { Text } from '@/components/ui/text';
import index from '@/components/ui/weather/index';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { Divider } from '../divider';
const { PartlyCloudyDay } = index;

export const CardWeather = () => {
  const { isDark } = useTheme();
  const [time, setTime] = useState(GetTime());
  const [date, setDate] = useState(GetDate({ weekday: 'short', month: 'short' }));
  
  const linerColorLight = ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)'] as const;
  const linerColorDark = ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.6)'] as const;

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(GetTime());
      setDate(GetDate({ weekday: 'short', month: 'short' }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View>
        <ImageBackground
          source={require('@/assets/images/weather/image/Cloudy.png')}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
          blurRadius={20}
        >
          <LinearGradient
            colors={isDark ? linerColorDark : linerColorLight}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientOverlay}
          >
            {/* Weather Icon and Temperature Section */}
            <View>
              <PartlyCloudyDay width={75} height={60} />
              <Text 
                size='3xl' 
                bold 
                style={styles.temperatureText}
              >
                39°C
              </Text>
            </View>

            {/* Time, Date and Location Section */}
            <View style={styles.rightSection}>
              <View style={styles.timeContainer}>
                <Text 
                  size="xl" 
                  style={styles.timeText}
                >
                  {time}
                </Text>
                <Text style={styles.dateText}>
                  {date}
                </Text>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.locationContainer}>
                <Text size='2xs' style={styles.locationText}>
                  Brgy here  •  Partly Cloudy
                </Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    </View>
  )
}

export default CardWeather

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
  },
  imageBackground: {
    borderRadius: 20,
  },
  imageStyle: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  gradientOverlay: {
    padding: 20,
    borderRadius: 20,
    justifyContent: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  temperatureText: {
    color: 'white',
    textShadowColor: 'black',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 10,
  },
  rightSection: {
    maxWidth: '61%',
    width: 'auto',
  },
  timeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    maxWidth: '100%',
    flexWrap: 'wrap',
  },
  timeText: {
    color: 'white',
    textShadowColor: 'black',
    maxWidth: '100%',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 5,
    fontFamily: 'monospace', // Monospace font for consistent time display
  },
  dateText: {
    color: 'white',
    textShadowColor: 'black',
    maxWidth: '100%',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 5,
    fontFamily: 'monospace', // Monospace font for consistent date display
  },
  divider: {
    marginVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  locationContainer: {
    // Empty container style - preserved from original
  },
  locationText: {
    color: 'white',
    maxWidth: '100%',
    textShadowColor: 'black',
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 5,
  },
})