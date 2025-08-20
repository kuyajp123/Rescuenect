import { IconButton, PrimaryButton } from '@/components/components/button/Button'
import { GlassCard } from '@/components/components/card/GlassCard'
import { Divider } from '@/components/ui/divider'
import { Text } from '@/components/ui/text'
import { Colors } from '@/constants/Colors'
import { useTheme } from '@/contexts/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { ChevronLeft, LocateFixed, TriangleAlert } from 'lucide-react-native'
import React from 'react'
import { ImageBackground, SafeAreaView, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FiveDaysForecast } from './FiveDaysForecast'
import TwentyFourHourForecast from './TwentyFourHourForecast'

export const MainPage = () => {
    const router = useRouter()
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const linerColorLight = ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)'] as const;
    const linerColorDark = ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.6)'] as const;
    
  return (
    <View style={styles.container}>
        <ImageBackground
            source={require('@/assets/images/weather/image/Rain.png')}
            style={styles.imageBackground}
            blurRadius={20}
            resizeMode='cover'
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
                        
                        {/* Search Section */}
                        <View style={styles.searchSection}>
                            <View style={styles.searchContainer}>
                                <TextInput
                                    placeholder="Search for a location"
                                    style={[styles.searchInput, { backgroundColor: isDark ? Colors.border.dark : '#f0f0f0', color: isDark ? '#fff' : '#000' }]}
                                    placeholderTextColor={isDark ? Colors.text.dark : '#888'}
                                />
                            </View>
                            <View style={styles.buttonContainer}>
                                <PrimaryButton
                                    onPress={() => console.log('Search pressed')}
                                    style={styles.locationButton}
                                >
                                    <LocateFixed size={20} color={'#ffffff'} />
                                </PrimaryButton>
                            </View>
                        </View>
                        
                        {/* Weather Info Section */}
                        <View style={styles.weatherInfo}>
                            <Text size='6xl' style={styles.temperatureText}>
                                39°C
                            </Text>
                            <Text style={styles.locationText}>
                                Brgy here  •  Partly Cloudy
                            </Text>
                        </View>

                        {/* Weather Data Cards */}
                        <View style={styles.weatherCards}>
                            
                            {/* Notification alert */}
                            <View style={styles.cardRow}>
                                <GlassCard style={{ ...styles.weatherCard, padding: 20, }} size='small'>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: '100%' }}>
                                        <TriangleAlert size={20} color={Colors.text.dark} />
                                        <Text style={{ color: Colors.text.dark, width: '89%' }}>
                                            Weather data is not accurate, please check your internet connection.
                                        </Text>
                                    </View>
                                </GlassCard>
                            </View>
                            
                            {/* First Row */}
                            <View style={styles.cardRow}>
                                <GlassCard 
                                    title="Feels Like" 
                                    value="40°C" 
                                    size="small"
                                    style={styles.weatherCard}
                                />
                                <GlassCard 
                                    title="UV Index" 
                                    value="7" 
                                    size="small"
                                    style={styles.weatherCard}
                                />
                            </View>

                            {/* Second Row */}
                            <View style={styles.cardRow}>
                                <GlassCard 
                                    title="Humidity" 
                                    value="84%" 
                                    size="small"
                                    style={styles.weatherCard}
                                />
                                <GlassCard 
                                    title="Cloud Cover" 
                                    value="100%" 
                                    size="small"
                                    style={styles.weatherCard}
                                />
                            </View>

                            {/* Third Row */}
                            <View style={styles.cardRow}>
                                <GlassCard 
                                    title="Chance of Rain" 
                                    value="50%" 
                                    size="small"
                                    style={styles.weatherCard}
                                />
                                <GlassCard 
                                    title="Rain Intensity" 
                                    value="1.1 mm/h" 
                                    size="small"
                                    style={styles.weatherCard}
                                />
                            </View>

                            {/* fourth Row */}
                            <View style={styles.cardRow}>
                                <GlassCard 
                                    title="Rain Acc." 
                                    value="5 mm" 
                                    size="small"
                                    style={styles.weatherCard}
                                />
                                <GlassCard 
                                    title="Wind Speed" 
                                    value="15 km/h" 
                                    size="small"
                                    style={styles.weatherCard}
                                />
                            </View>

                            {/* 24-hours Forecast */}
                            <View style={styles.fullWidthCard}>
                                <TwentyFourHourForecast />
                            </View>

                            {/* 5 Days Forecast */}
                            <View style={styles.fullWidthCard}>
                                <GlassCard style={styles.forecastCard} title="5 Days Forecast" size='small'>
                                    <View style={[styles.bottomSpacer]} />

                                    <FiveDaysForecast 
                                        day="Today"
                                        date="Oct 1"
                                        weatherCode={10000}
                                        temperature="39°C"
                                    />

                                    <Divider style={{ marginVertical: 10, backgroundColor: Colors.icons.dark }} />

                                    <FiveDaysForecast 
                                        day="Thu"
                                        date="Oct 2"
                                        weatherCode={11000}
                                        temperature="35°C"
                                    />
                                </GlassCard>    

                            </View>
                        </View>
                        
                        {/* Bottom padding for tab navigation */}
                        <View style={[styles.bottomSpacer, { paddingBottom: insets.bottom }]} />
                    </ScrollView>
                </SafeAreaView>
            {/* </LinearGradient> */}
        {/* // </ImageBackground> */}
    </View>
  )
}

export default MainPage

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
})