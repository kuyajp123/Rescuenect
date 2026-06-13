import { HoveredButton } from '@/components/components/button/Button';
import { formatToCapitalized } from '@/helper/commonHelpers';
import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';
import { useNotificationStore } from '@/store/useNotificationStore';
import Body from '@/components/ui/layout/Body';
import { MapView } from '@/components/ui/map/MapView';
import { Text } from '@/components/ui/text';
import { API_ROUTES } from '@/config/endpoints';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import type {
  BaseNotification,
  DangerZoneNotificationData,
  EarthquakeNotificationData,
  WeatherNotificationData,
} from '@/types/notification';
import { getNotificationDisplayTimestamp } from '@/helper/notificationTime';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Activity,
  AlertCircle,
  Bell,
  Calendar,
  ChevronLeft,
  Cloud,
  MapPin,
  Thermometer,
  TriangleAlert,
  Wind,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

const EARTHQUAKE_NOTIFICATION_MAP_ZOOM = 6.4;
const EARTHQUAKE_NOTIFICATION_MIN_ZOOM = 5.5;
const EARTHQUAKE_NOTIFICATION_MAX_ZOOM = 8;

const NotificationDetails = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const { notificationId } = useLocalSearchParams<{ notificationId: string }>();
  const authUser = useAuth(state => state.authUser);
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const notificationData = useNotificationStore(state => state.notifications);
  const userData = useUserData((state: any) => state.userData);

  const [notification, setNotification] = useState<BaseNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const foundNotification = notificationData.find(n => n.id === notificationId);

  useEffect(() => {
    if (!notificationId) {
      setError('No notification ID provided');
      return;
    }

    setNotification(foundNotification || null);

    // Mark as read if user is logged in
    if (authUser?.uid && foundNotification && !foundNotification?.readBy?.includes(authUser.uid)) {
      markAsRead(foundNotification.id, authUser.uid);
    } else if (!authUser?.uid && foundNotification) {
      // Check if already read by guest before marking?
      // The action handles idempotency, so safe to call.
      useNotificationStore.getState().markAsGuestRead(foundNotification.id);
    }

    if (foundNotification) setLoading(false);
  }, [notificationId, authUser?.uid, markAsRead, setNotification]);

  useEffect(() => {
    const markNotificationAsRead = async () => {
      if (!authUser?.uid || !notificationId || !notification) return;

      const idToken = await authUser?.getIdToken();
      try {
        await axios.post(
          API_ROUTES.NOTIFICATION.MARK_AS_READ,
          {
            notificationId,
            uid: authUser?.uid,
          },
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );

        markAsRead(notificationId, authUser.uid);
      } catch (error) {
        console.error('❌ Error marking notification as read:', error);
      }
    };

    const markNotificationAsReadInStatusResolved = async () => {
      if (!authUser?.uid || !notificationId) return;

      const idToken = await authUser?.getIdToken();
      try {
        await axios.post(
          API_ROUTES.NOTIFICATION.MARK_AS_READ_IN_STATUS_RESOLVED,
          {
            notificationId,
            uid: authUser?.uid,
          },
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );

        markAsRead(notificationId, authUser.uid);
      } catch (error) {
        console.error('❌ Error marking notification as read:', error);
      }
    };

    if (notification?.type === 'status_resolved' && authUser?.uid) {
      markNotificationAsReadInStatusResolved();
    } else if (authUser?.uid) {
      markNotificationAsRead();
    } else {
      // Guest handling
      useNotificationStore.getState().markAsGuestRead(notificationId);
    }
  }, [notification, authUser?.uid, notificationId]);

  // Get icon based on notification type
  const getNotificationIcon = (type: BaseNotification['type']) => {
    const iconColor = isDark ? Colors.icons.dark : Colors.icons.light;
    const size = 32;

    switch (type) {
      case 'earthquake':
        return <Activity color={iconColor} size={size} />;
      case 'weather':
        return <Cloud color={iconColor} size={size} />;
      case 'emergency':
        return <AlertCircle color={iconColor} size={size} />;
      case 'danger_zone':
        return <TriangleAlert color={iconColor} size={size} />;
      case 'status_resolved':
        return <MapPin color={iconColor} size={size} />;
      default:
        return <Bell color={iconColor} size={size} />;
    }
  };

  // Format timestamp
  const formatFullDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatOptionalDate = (value?: string | null) => {
    if (!value) return 'No expiry';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No expiry';
    return date.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDangerLabel = (value?: string) =>
    value
      ? value
          .split('_')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
      : 'Danger zone';

  const formatDangerEvent = (value?: string) => {
    switch (value) {
      case 'report_verified':
        return 'Resident report verified';
      case 'official_created':
        return 'Official danger zone';
      case 'road_segment_blocked':
        return 'Road segment affected';
      case 'resolved':
        return 'Danger zone resolved';
      case 'expired':
        return 'Danger zone expired';
      default:
        return 'Danger-zone update';
    }
  };

  if (loading) {
    return (
      <Body style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.brand.dark} />
          <Text size="md" style={{ marginTop: 16 }}>
            Loading notification...
          </Text>
        </View>
      </Body>
    );
  }

  if (error || !notification) {
    return (
      <Body style={styles.container}>
        <HoveredButton onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={isDark ? Colors.icons.dark : Colors.icons.light} />
        </HoveredButton>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={Colors.semantic.error} />
          <Text size="lg" style={{ marginTop: 16 }}>
            Error
          </Text>
          <Text size="sm" style={{ marginTop: 8, opacity: 0.7 }}>
            {error || 'Notification not found'}
          </Text>
        </View>
      </Body>
    );
  }

  const isEarthquake = notification.type === 'earthquake';
  const isWeather = notification.type === 'weather';
  const isDangerZone = notification.type === 'danger_zone';
  const earthquakeData = isEarthquake ? (notification.data as EarthquakeNotificationData) : null;
  const weatherData = isWeather ? (notification.data as WeatherNotificationData) : null;
  const dangerZoneData = isDangerZone ? (notification.data as DangerZoneNotificationData) : null;
  const displayTimestamp = getNotificationDisplayTimestamp(notification);

  return (
    <Body style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text size="2xl" bold>
            Notification Details
          </Text>
        </View>

        {/* Notification Card */}
        <View
          style={[
            styles.notificationCard,
            {
              backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
              borderLeftColor:
                notification.type === 'earthquake'
                  ? Colors.semantic.error
                  : notification.type === 'weather'
                  ? Colors.semantic.info
                  : notification.type === 'danger_zone'
                  ? Colors.semantic.warning
                  : Colors.brand.dark,
            },
          ]}
        >
          {/* Icon and Type */}
          <View style={styles.iconRow}>
            {getNotificationIcon(notification.type)}
            <View style={styles.typeContainer}>
              <Text size="xs" emphasis="light" style={{ textTransform: 'uppercase' }}>
                {notification.type.replace('_', ' ')}
              </Text>
              <Text size="sm" emphasis="light">
                {formatFullDate(displayTimestamp)}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text size="xl" bold style={styles.title}>
            {notification.title}
          </Text>

          {/* Message */}
          <Text size="md" style={styles.message}>
            {notification.message}
          </Text>

          {/* Location */}
          <View style={styles.locationRow}>
            {notification.type === 'earthquake' ? null : notification.type === 'status_resolved' ? null : (
              <>
                <MapPin size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text size="sm">
                  {notification.type === 'weather'
                    ? formatToCapitalized(userData.barangay)
                    : notification.type === 'danger_zone'
                    ? formatDangerLabel(dangerZoneData?.dangerType)
                    : notification.location?.replace('_', ' ').toUpperCase()}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Earthquake Specific Data */}
        {isEarthquake && earthquakeData && (
          <>
            {/* Map Visualization */}
            {earthquakeData.coordinates && (
              <View style={styles.mapContainer}>
                <View style={styles.mapHeader}>
                  <MapPin size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                  <Text size="lg" bold>
                    Impact Map
                  </Text>
                </View>
                <View style={styles.map}>
                  <MapView
                    centerCoordinate={[earthquakeData.coordinates.longitude, earthquakeData.coordinates.latitude]}
                    zoomLevel={EARTHQUAKE_NOTIFICATION_MAP_ZOOM}
                    minZoomLevel={EARTHQUAKE_NOTIFICATION_MIN_ZOOM}
                    maxZoomLevel={EARTHQUAKE_NOTIFICATION_MAX_ZOOM}
                    cameraTriggerKey={`${notification.id}-earthquake-preview`}
                    earthquakeData={{
                      coordinates: earthquakeData.coordinates,
                      severity: earthquakeData.severity,
                      magnitude: earthquakeData.magnitude,
                      impact_radii: earthquakeData.impact_radii,
                    }}
                    showButtons={false}
                    showStyleSelector={false}
                    interactive={false}
                    show3DBuildings={false}
                    scrollEnabled={false}
                    rotateEnabled={false}
                    zoomEnabled={false}
                    compassEnabled={false}
                    pitchEnabled={false}
                    maxBounds={[
                      [-180, -90],
                      [180, 90],
                    ]}
                  />
                </View>
                {earthquakeData.impact_radii && (
                  <View style={styles.legendContainer}>
                    <Text size="xs" bold style={{ marginBottom: 8 }}>
                      Impact Zones:
                    </Text>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: 'rgba(255, 0, 0, 0.35)' }]} />
                      <Text size="xs">
                        Strong: {earthquakeData.impact_radii.strong_shaking_radius_km.toFixed(1)} km
                      </Text>
                    </View>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: 'rgba(255, 165, 0, 0.35)' }]} />
                      <Text size="xs">
                        Moderate: {earthquakeData.impact_radii.moderate_shaking_radius_km.toFixed(1)} km
                      </Text>
                    </View>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: 'rgba(255, 215, 0, 0.35)' }]} />
                      <Text size="xs">Felt: {earthquakeData.impact_radii.felt_radius_km.toFixed(1)} km</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            <View style={styles.dataCard}>
              <Text size="lg" bold style={styles.sectionTitle}>
                Earthquake Details
              </Text>

              <View style={styles.dataRow}>
                <Text size="sm" emphasis="light">
                  Magnitude:
                </Text>
                <Text size="md" bold>
                  {earthquakeData.magnitude}
                </Text>
              </View>

              <View style={styles.dataRow}>
                <Text size="sm" emphasis="light">
                  Event Time:
                </Text>
                <Text size="sm">{formatFullDate(displayTimestamp)}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text size="sm" emphasis="light">
                  Location:
                </Text>
                <Text size="sm" style={{ flex: 1, textAlign: 'right' }}>
                  {earthquakeData.place}
                </Text>
              </View>

              <View style={styles.dataRow}>
                <Text size="sm" emphasis="light">
                  Depth:
                </Text>
                <Text size="sm">{earthquakeData.coordinates.depth} km</Text>
              </View>

              <View style={styles.dataRow}>
                <Text size="sm" emphasis="light">
                  Severity:
                </Text>
                <Text size="sm" style={{ textTransform: 'capitalize' }}>
                  {earthquakeData.severity}
                </Text>
              </View>

              {earthquakeData.tsunamiWarning && (
                <View style={[styles.warningBanner, { backgroundColor: Colors.semantic.error }]}>
                  <AlertCircle size={20} color="white" />
                  <Text size="sm" bold style={{ color: 'white', marginLeft: 8 }}>
                    TSUNAMI WARNING
                  </Text>
                </View>
              )}

              {earthquakeData.distanceFromNaic && (
                <View style={styles.dataRow}>
                  <Text size="sm" emphasis="light">
                    Distance from Naic:
                  </Text>
                  <Text size="sm">{earthquakeData.distanceFromNaic.toFixed(1)} km</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Weather Specific Data */}
        {isWeather && weatherData && (
          <View style={styles.dataCard}>
            <Text size="lg" bold style={styles.sectionTitle}>
              Weather Details
            </Text>

            <View style={styles.dataRow}>
              <Text size="sm" emphasis="light">
                Severity:
              </Text>
              <Text
                size="md"
                bold
                style={{
                  color:
                    weatherData.severity === 'CRITICAL'
                      ? Colors.semantic.error
                      : weatherData.severity === 'WARNING'
                      ? Colors.semantic.warning
                      : weatherData.severity === 'ADVISORY'
                      ? Colors.semantic.info
                      : Colors.text.dark,
                }}
              >
                {weatherData.severity}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text size="sm" emphasis="light">
                Category:
              </Text>
              <Text size="sm">{weatherData.category}</Text>
            </View>

            {weatherData.temperature && (
              <View style={[styles.dataRow, { justifyContent: 'flex-start', gap: 8 }]}>
                <Thermometer size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text size="sm" emphasis="light" style={{ flex: 1 }}>
                  Temperature:
                </Text>
                <Text size="sm">{weatherData.temperature}°C</Text>
              </View>
            )}

            {weatherData.windSpeed && (
              <View style={styles.dataRow}>
                <Wind size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text size="sm" emphasis="light">
                  Wind Speed:
                </Text>
                <Text size="sm">{weatherData.windSpeed} km/h</Text>
              </View>
            )}

            {weatherData.rainIntensity && (
              <View style={styles.dataRow}>
                <Text size="sm" emphasis="light">
                  Rain Intensity:
                </Text>
                <Text size="sm">{weatherData.rainIntensity} mm/h</Text>
              </View>
            )}

            {weatherData.forecastTime && (
              <View style={styles.dataRow}>
                <Calendar size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
                <Text size="sm" emphasis="light">
                  Forecast Time:
                </Text>
                <Text size="sm">{new Date(weatherData.forecastTime).toLocaleString()}</Text>
              </View>
            )}

            {weatherData.humidity && (
              <View style={styles.dataRow}>
                {/* <Calendar size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} /> */}
                <Text size="sm" emphasis="light">
                  Humidity:
                </Text>
                <Text size="sm">{weatherData.humidity}%</Text>
              </View>
            )}

            {weatherData.uvIndex && (
              <View style={styles.dataRow}>
                {/* <Calendar size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} /> */}
                <Text size="sm" emphasis="light">
                  UV Index:
                </Text>
                <Text size="sm">{weatherData.uvIndex}</Text>
              </View>
            )}
          </View>
        )}

        {isDangerZone && dangerZoneData && (
          <View style={styles.dataCard}>
            <Text size="lg" bold style={styles.sectionTitle}>
              Danger Zone Details
            </Text>

            <View style={styles.dataRow}>
              <Text size="sm" emphasis="light">
                Update:
              </Text>
              <Text size="sm" style={{ flex: 1, textAlign: 'right' }}>
                {formatDangerEvent(dangerZoneData.eventType)}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text size="sm" emphasis="light">
                Type:
              </Text>
              <Text size="sm">{formatDangerLabel(dangerZoneData.dangerType)}</Text>
            </View>

            <View style={styles.dataRow}>
              <Text size="sm" emphasis="light">
                Severity:
              </Text>
              <Text size="sm" style={{ textTransform: 'capitalize' }}>
                {dangerZoneData.severity}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text size="sm" emphasis="light">
                Status:
              </Text>
              <Text size="sm" style={{ textTransform: 'capitalize' }}>
                {dangerZoneData.status}
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text size="sm" emphasis="light">
                Expiry:
              </Text>
              <Text size="sm" style={{ flex: 1, textAlign: 'right' }}>
                {formatOptionalDate(dangerZoneData.expiresAt)}
              </Text>
            </View>

            {dangerZoneData.description ? (
              <View style={[styles.dataRow, { alignItems: 'flex-start' }]}>
                <Text size="sm" emphasis="light">
                  Description:
                </Text>
                <Text size="sm" style={{ flex: 1, textAlign: 'right' }}>
                  {dangerZoneData.description}
                </Text>
              </View>
            ) : null}

            <HoveredButton
              style={[styles.viewMapButton, { backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light }]}
              onPress={() =>
                router.push({
                  pathname: '/evacuation' as any,
                  params: { dangerZoneId: dangerZoneData.dangerZoneId },
                })
              }
            >
              <MapPin size={18} color="#fff" />
              <Text size="sm" bold style={{ color: '#fff' }}>
                View on map
              </Text>
            </HoveredButton>
          </View>
        )}
      </ScrollView>
    </Body>
  );
};

export default NotificationDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  notificationCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  typeContainer: {
    flex: 1,
  },
  title: {
    marginBottom: 12,
  },
  message: {
    marginBottom: 16,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dataCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  mapContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    paddingBottom: 8,
  },
  map: {
    height: 300,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  legendContainer: {
    padding: 12,
    paddingTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#888',
  },
  viewMapButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
