import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Map } from '@/components/ui/Map';
import { API_ENDPOINTS } from '@/config/endPoints';
import { auth } from '@/lib/firebaseConfig';
import { useNotificationStore } from '@/stores/useNotificationStore';
import type {
  BaseNotification,
  EarthquakeNotificationData,
  MapMarkerData,
  WeatherNotificationData,
} from '@/types/types';
import { Card, Chip, Divider, Spinner } from '@heroui/react';
import axios from 'axios';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  CloudRain,
  Droplets,
  Eye,
  Gauge,
  Info,
  MapPin,
  Megaphone,
  Shield,
  Sun,
  Thermometer,
  TrendingUp,
  Users,
  Wind,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const NotificationDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const uid = auth.currentUser?.uid;

  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const { markAsRead } = useNotificationStore();

  // Get notification from state or store
  const notification = location.state?.notification as BaseNotification | undefined;

  useEffect(() => {
    if (!notification || !uid) return;

    // Mark as read when user views the details
    const markNotificationAsRead = async () => {
      const isRead = notification.readBy?.includes(uid);
      if (isRead) return;

      setIsMarkingAsRead(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        await axios.post(
          API_ENDPOINTS.NOTIFICATION.MARK_AS_READ,
          {
            notificationId: notification.id,
            uid: uid,
          },
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        markAsRead(notification.id, uid);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      } finally {
        setIsMarkingAsRead(false);
      }
    };

    markNotificationAsRead();
  }, [notification, uid, markAsRead]);

  if (!notification) {
    return (
      <Card className="w-full border border-default-100" shadow="none">
        <div className="p-6 text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-danger" />
          <p className="text-lg font-semibold">Notification not found</p>
          <p className="text-sm text-default-500 mt-2">The notification you're looking for doesn't exist.</p>
          <PrimaryButton className="mt-4" onPress={() => navigate('/notification')}>
            Back to Notifications
          </PrimaryButton>
        </div>
      </Card>
    );
  }

  // Get notification icon based on type
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'earthquake':
        return <Activity size={32} className="text-orange-500" />;
      case 'weather':
        const weatherData = notification.data as WeatherNotificationData;
        if (weatherData?.severity === 'CRITICAL') {
          return <AlertTriangle size={32} className="text-red-500" />;
        }
        return <CloudRain size={32} className="text-blue-500" />;
      case 'announcement':
        return <Megaphone size={32} className="text-purple-500" />;
      case 'emergency':
        return <Shield size={32} className="text-red-600" />;
      case 'typhoon':
        return <Wind size={32} className="text-blue-600" />;
      case 'flood':
        return <CloudRain size={32} className="text-cyan-600" />;
      default:
        return <Bell size={32} className="text-gray-500" />;
    }
  };

  // Get chip color
  const getChipColor = (): 'danger' | 'warning' | 'primary' | 'default' | 'success' => {
    if (notification.type === 'earthquake') {
      const earthquakeData = notification.data as EarthquakeNotificationData;
      if (earthquakeData?.priority === 'critical') return 'danger';
      if (earthquakeData?.priority === 'high') return 'warning';
      return 'primary';
    }

    if (notification.type === 'weather') {
      const weatherData = notification.data as WeatherNotificationData;
      if (weatherData?.severity === 'CRITICAL') return 'danger';
      if (weatherData?.severity === 'WARNING') return 'warning';
      if (weatherData?.severity === 'ADVISORY') return 'primary';
      return 'success';
    }

    if (notification.type === 'emergency') return 'danger';
    return 'primary';
  };

  // Format timestamp
  const formatDateTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render earthquake details
  const renderEarthquakeDetails = () => {
    const earthquakeData = notification.data as EarthquakeNotificationData;
    if (!earthquakeData) return null;

    return (
      <div className="space-y-4">
        {/* Magnitude and Severity */}
        <Card className="border border-default-200" shadow="none">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Earthquake Information</h3>
              <Chip color={getChipColor()} variant="flat">
                {earthquakeData.severity?.toUpperCase()}
              </Chip>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Gauge size={20} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-default-500">Magnitude</p>
                  <p className="text-2xl font-bold">{earthquakeData.magnitude?.toFixed(1)}</p>
                </div>
              </div>

              {earthquakeData.coordinates?.depth && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <TrendingUp size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-default-500">Depth</p>
                    <p className="text-2xl font-bold">{earthquakeData.coordinates.depth?.toFixed(1)} km</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Map Visualization */}
        {earthquakeData.coordinates && (
          <Card className="border border-default-200" shadow="none">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={18} className="text-default-500" />
                <h4 className="font-semibold">Impact Map</h4>
              </div>
              <div className="h-[400px] rounded-lg overflow-hidden">
                <Map
                  center={[earthquakeData.coordinates.latitude, earthquakeData.coordinates.longitude]}
                  zoom={10}
                  minZoom={8}
                  maxZoom={10}
                  height="100%"
                  width="100%"
                  markerType="earthquake"
                  earthquakeData={[
                    {
                      uid: notification.id,
                      lat: earthquakeData.coordinates.latitude,
                      lng: earthquakeData.coordinates.longitude,
                      severity: earthquakeData.severity,
                      magnitude: earthquakeData.magnitude,
                      impact_radii: earthquakeData.impact_radii,
                    } as MapMarkerData,
                  ]}
                  popupType="custom"
                  renderPopup={(item: MapMarkerData) => (
                    <div className="space-y-2">
                      <div>
                        <strong className="text-lg">M{earthquakeData.magnitude?.toFixed(1)} Earthquake</strong>
                      </div>
                      <div>
                        <strong>Location:</strong> {earthquakeData.place}
                      </div>
                      <div>
                        <strong>Severity:</strong> <span className="capitalize">{earthquakeData.severity}</span>
                      </div>
                      <div>
                        <strong>Depth:</strong> {earthquakeData.coordinates.depth?.toFixed(1)} km
                      </div>
                      {earthquakeData.impact_radii && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <strong className="text-sm">Impact Radii:</strong>
                          <div className="text-sm mt-1 space-y-1">
                            <div>🔴 Strong: {earthquakeData.impact_radii.strong_shaking_radius_km?.toFixed(1)} km</div>
                            <div>
                              🟠 Moderate: {earthquakeData.impact_radii.moderate_shaking_radius_km?.toFixed(1)} km
                            </div>
                            <div>🟡 Felt: {earthquakeData.impact_radii.felt_radius_km?.toFixed(1)} km</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  hasMapStyleSelector={true}
                  zoomControl={true}
                  dragging={false}
                  hasMapControl={false}
                />
              </div>
              {earthquakeData.impact_radii && (
                <div className="mt-3 p-3 bg-default-50 dark:bg-default-100/50 rounded-lg">
                  <p className="text-xs text-default-600 mb-2 font-semibold">Impact Zones:</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500/60 border-2 border-red-500"></div>
                      <span>Strong: {earthquakeData.impact_radii.strong_shaking_radius_km?.toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-orange-500/60 border-2 border-orange-500"></div>
                      <span>Moderate: {earthquakeData.impact_radii.moderate_shaking_radius_km?.toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60 border-2 border-yellow-500"></div>
                      <span>Felt: {earthquakeData.impact_radii.felt_radius_km?.toFixed(1)} km</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Location */}
        <Card className="border border-default-200" shadow="none">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={18} className="text-default-500" />
              <h4 className="font-semibold">Location Details</h4>
            </div>
            <p className="text-default-700">{earthquakeData.place}</p>
            {earthquakeData.distanceFromNaic && (
              <p className="text-sm text-default-500 mt-2">
                📍 {earthquakeData.distanceFromNaic.toFixed(1)} km from Naic, Cavite
              </p>
            )}
          </div>
        </Card>

        {/* Coordinates */}
        {earthquakeData.coordinates && (
          <Card className="border border-default-200" shadow="none">
            <div className="p-4">
              <h4 className="font-semibold mb-3">Coordinates</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-default-500">Latitude</p>
                  <p className="font-mono">{earthquakeData.coordinates.latitude?.toFixed(4)}°</p>
                </div>
                <div>
                  <p className="text-default-500">Longitude</p>
                  <p className="font-mono">{earthquakeData.coordinates.longitude?.toFixed(4)}°</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tsunami Warning */}
        {earthquakeData.tsunamiWarning && (
          <Card className="border-2 border-danger bg-danger-50 dark:bg-danger-900/20" shadow="none">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-danger" />
                <div>
                  <p className="font-semibold text-danger">Tsunami Warning</p>
                  <p className="text-sm text-default-600">Please follow evacuation procedures</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* External Links */}
        {(earthquakeData.usgsUrl || earthquakeData.phivolcsUrl) && (
          <Card className="border border-default-200" shadow="none">
            <div className="p-4">
              <h4 className="font-semibold mb-3">External Resources</h4>
              <div className="space-y-2">
                {earthquakeData.usgsUrl && (
                  <a
                    href={earthquakeData.usgsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-primary hover:underline text-sm"
                  >
                    🔗 View on USGS
                  </a>
                )}
                {earthquakeData.phivolcsUrl && (
                  <a
                    href={earthquakeData.phivolcsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-primary hover:underline text-sm"
                  >
                    🔗 View on PHIVOLCS
                  </a>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  // Render weather details
  const renderWeatherDetails = () => {
    const weatherData = notification.data as WeatherNotificationData;
    if (!weatherData) return null;

    return (
      <div className="space-y-4">
        {/* Weather Overview */}
        <Card className="border border-default-200" shadow="none">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Weather Information</h3>
              <Chip color={getChipColor()} variant="flat">
                {weatherData.severity}
              </Chip>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Chip size="sm" variant="flat">
                {weatherData.category}
              </Chip>
              <Chip size="sm" variant="flat">
                {weatherData.weatherType?.replace('_', ' ').toUpperCase()}
              </Chip>
            </div>

            {weatherData.forecastTime && (
              <div className="flex items-center gap-2 text-sm text-default-500">
                <Clock size={14} />
                <span>Forecast for {new Date(weatherData.forecastTime).toLocaleString()}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Temperature */}
        {(weatherData.temperature || weatherData.temperatureApparent) && (
          <Card className="border border-default-200" shadow="none">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer size={18} className="text-red-500" />
                <h4 className="font-semibold">Temperature</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {weatherData.temperature && (
                  <div>
                    <p className="text-xs text-default-500">Actual</p>
                    <p className="text-3xl font-bold">{weatherData.temperature.toFixed(1)}°C</p>
                  </div>
                )}
                {weatherData.temperatureApparent && (
                  <div>
                    <p className="text-xs text-default-500">Feels Like</p>
                    <p className="text-3xl font-bold">{weatherData.temperatureApparent.toFixed(1)}°C</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Rain Information */}
        {(weatherData.rainIntensity || weatherData.rainAccumulation || weatherData.precipitationProbability) && (
          <Card className="border border-default-200" shadow="none">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CloudRain size={18} className="text-blue-500" />
                <h4 className="font-semibold">Precipitation</h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {weatherData.rainIntensity !== undefined && (
                  <div>
                    <p className="text-xs text-default-500">Intensity</p>
                    <p className="text-lg font-semibold">{weatherData.rainIntensity.toFixed(2)} mm/h</p>
                  </div>
                )}
                {weatherData.rainAccumulation !== undefined && (
                  <div>
                    <p className="text-xs text-default-500">Accumulation</p>
                    <p className="text-lg font-semibold">{weatherData.rainAccumulation.toFixed(1)} mm</p>
                  </div>
                )}
                {weatherData.precipitationProbability !== undefined && (
                  <div>
                    <p className="text-xs text-default-500">Probability</p>
                    <p className="text-lg font-semibold">{weatherData.precipitationProbability.toFixed(0)}%</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Wind Information */}
        {(weatherData.windSpeed || weatherData.windGust) && (
          <Card className="border border-default-200" shadow="none">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wind size={18} className="text-green-500" />
                <h4 className="font-semibold">Wind</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {weatherData.windSpeed !== undefined && (
                  <div>
                    <p className="text-xs text-default-500">Speed</p>
                    <p className="text-lg font-semibold">{weatherData.windSpeed.toFixed(1)} km/h</p>
                  </div>
                )}
                {weatherData.windGust !== undefined && (
                  <div>
                    <p className="text-xs text-default-500">Gust</p>
                    <p className="text-lg font-semibold">{weatherData.windGust.toFixed(1)} km/h</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Other Metrics */}
        <Card className="border border-default-200" shadow="none">
          <div className="p-4">
            <h4 className="font-semibold mb-3">Other Conditions</h4>
            <div className="grid grid-cols-2 gap-4">
              {weatherData.humidity !== undefined && (
                <div className="flex items-center gap-2">
                  <Droplets size={16} className="text-blue-400" />
                  <div>
                    <p className="text-xs text-default-500">Humidity</p>
                    <p className="font-semibold">{weatherData.humidity.toFixed(0)}%</p>
                  </div>
                </div>
              )}
              {weatherData.uvIndex !== undefined && (
                <div className="flex items-center gap-2">
                  <Sun size={16} className="text-yellow-500" />
                  <div>
                    <p className="text-xs text-default-500">UV Index</p>
                    <p className="font-semibold">{weatherData.uvIndex.toFixed(0)}</p>
                  </div>
                </div>
              )}
              {weatherData.visibility !== undefined && (
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-default-500">Visibility</p>
                    <p className="font-semibold">{weatherData.visibility.toFixed(1)} km</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const isRead = notification.readBy?.includes(uid || '');

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <Card className="border border-default-100" shadow="none">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <SecondaryButton isIconOnly size="sm" className="rounded-full" onPress={() => navigate('/notification')}>
              <ArrowLeft size={18} />
            </SecondaryButton>
            <h1 className="text-2xl font-bold">Notification Details</h1>
            {isMarkingAsRead && <Spinner size="sm" />}
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <Card className="border border-default-100" shadow="none">
        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-default-100">{getNotificationIcon()}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">{notification.title}</h2>
                {isRead ? (
                  <Chip size="sm" color="success" variant="flat" startContent={<CheckCircle size={14} />}>
                    Read
                  </Chip>
                ) : (
                  <Chip size="sm" color="primary" variant="flat">
                    New
                  </Chip>
                )}
              </div>
              <p className="text-default-600 text-lg">{notification.message}</p>
            </div>
          </div>

          <Divider className="my-6" />

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-default-400" />
              <div>
                <p className="text-xs text-default-500">Date & Time</p>
                <p className="font-medium">{formatDateTime(notification.timestamp)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-default-400" />
              <div>
                <p className="text-xs text-default-500">Location</p>
                {notification.type === 'weather' ? (
                  <p className="font-medium capitalize">{notification.location}</p>
                ) : notification.type === 'earthquake' ? (
                  <p className="font-medium capitalize">{(notification.data as EarthquakeNotificationData)?.place || 'N/A'}</p>
                ) : (
                  <p className="font-medium capitalize">N/A</p>
                )}
              </div>
            </div>

            {notification.barangays && notification.barangays.length > 0 && (
              <div className="flex items-center gap-3 md:col-span-2">
                <Info size={18} className="text-default-400" />
                <div>
                  <p className="text-xs text-default-500">Affected Barangays</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {notification.barangays.map((barangay, idx) => (
                      <Chip key={idx} size="sm" variant="flat">
                        {barangay}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Divider className="my-6" />

          {/* Type-specific details */}
          {notification.type === 'earthquake' && renderEarthquakeDetails()}
          {notification.type === 'weather' && renderWeatherDetails()}

          {/* Delivery Status */}
          {notification.deliveryStatus && (
            <>
              <Divider className="my-6" />
              <Card className="border border-default-200" shadow="none">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={18} className="text-default-500" />
                    <h4 className="font-semibold">Delivery Status</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-default-700">{notification.sentTo}</p>
                      <p className="text-xs text-default-500">Sent To</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-success">{notification.deliveryStatus.success}</p>
                      <p className="text-xs text-default-500">Delivered</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-danger">{notification.deliveryStatus.failure}</p>
                      <p className="text-xs text-default-500">Failed</p>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
