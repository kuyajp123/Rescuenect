# API Integration Guide - RescueNect System

## Overview

This document provides detailed implementation guides for integrating external APIs into the RescueNect disaster management system. Each API serves a specific purpose and has unique integration requirements.

## 1. Tomorrow.io Weather API Integration

### Purpose
- Provide real-time weather data for disaster preparedness
- Generate weather-based alerts for the community
- Maintain weather history for analysis

### API Limitations
- **Free Tier**: 1,000 requests/day
- **Rate Limit**: 25 requests/hour
- **Fields**: Limited to essential weather parameters

### Implementation Strategy

#### Admin Backend Service
```javascript
// weatherService.js
const axios = require('axios');
const { WeatherHistory } = require('../models/Weather');
const { firestore } = require('../config/firebase');

class WeatherService {
  constructor() {
    this.apiKey = process.env.TOMORROW_IO_API_KEY;
    this.baseURL = 'https://api.tomorrow.io/v4';
    this.location = { lat: 14.3169, lng: 120.7598 }; // Naic, Cavite
  }

  async fetchWeatherData() {
    try {
      const response = await axios.get(`${this.baseURL}/weather/realtime`, {
        headers: { 'apikey': this.apiKey },
        params: {
          location: `${this.location.lat},${this.location.lng}`,
          fields: [
            'precipitationProbability',
            'rainAccumulation',
            'rainIntensity',
            'humidity',
            'temperature',
            'temperatureApparent',
            'uvIndex',
            'windSpeed',
            'windGust',
            'windDirection',
            'weatherCode',
            'cloudCover',
            'visibility'
          ].join(',')
        }
      });

      await this.processWeatherData(response.data);
      return response.data;
    } catch (error) {
      console.error('Weather API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async processWeatherData(weatherData) {
    const processedData = {
      location: 'Naic, Cavite',
      data: weatherData.data.values,
      timestamp: new Date(weatherData.data.time),
      source: 'tomorrow.io'
    };

    // Store in MongoDB for historical data
    await WeatherHistory.create(processedData);

    // Analyze for alerts
    const alertData = this.analyzeWeatherRisk(processedData);
    
    if (alertData.shouldAlert) {
      await this.sendWeatherAlert(alertData);
    }

    return processedData;
  }

  analyzeWeatherRisk(weatherData) {
    const { data } = weatherData;
    let riskLevel = 'low';
    let alerts = [];

    // Heavy rain alert
    if (data.rainIntensity > 10) {
      riskLevel = 'high';
      alerts.push({
        type: 'heavy_rain',
        message: 'Heavy rain expected. Prepare for possible flooding.',
        severity: 'high'
      });
    }

    // Strong wind alert
    if (data.windSpeed > 25) {
      riskLevel = 'medium';
      alerts.push({
        type: 'strong_wind',
        message: 'Strong winds detected. Secure loose objects.',
        severity: 'medium'
      });
    }

    // Temperature extreme alert
    if (data.temperature > 35) {
      alerts.push({
        type: 'heat_index',
        message: 'High temperature warning. Stay hydrated.',
        severity: 'medium'
      });
    }

    return {
      shouldAlert: alerts.length > 0,
      riskLevel,
      alerts,
      weatherData: data
    };
  }

  async sendWeatherAlert(alertData) {
    const alertDoc = {
      type: 'weather',
      title: 'Weather Alert',
      alerts: alertData.alerts,
      riskLevel: alertData.riskLevel,
      location: 'Naic, Cavite',
      timestamp: new Date(),
      isActive: true,
      weatherData: alertData.weatherData
    };

    // Store in Firestore for real-time updates
    await firestore.collection('alerts').add(alertDoc);
    
    // Trigger push notifications
    await this.notificationService.sendWeatherAlert(alertDoc);
  }

  // Scheduled job to fetch weather data
  startWeatherMonitoring() {
    // Run every 15 minutes to stay within rate limits
    setInterval(async () => {
      try {
        await this.fetchWeatherData();
        console.log('Weather data updated successfully');
      } catch (error) {
        console.error('Scheduled weather update failed:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes
  }
}

module.exports = WeatherService;
```

#### Client-Side Data Consumption
```javascript
// weatherContext.js (React Native)
import { createContext, useContext, useEffect, useState } from 'react';
import { firestore } from '../config/firebase';

const WeatherContext = createContext();

export const WeatherProvider = ({ children }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for real-time weather alerts
    const unsubscribeAlerts = firestore
      .collection('alerts')
      .where('type', '==', 'weather')
      .where('isActive', '==', true)
      .orderBy('timestamp', 'desc')
      .limit(5)
      .onSnapshot(snapshot => {
        const alertsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAlerts(alertsData);
      });

    // Fetch latest weather data from API
    fetchLatestWeatherData();

    return () => {
      unsubscribeAlerts();
    };
  }, []);

  const fetchLatestWeatherData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/weather/latest`);
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WeatherContext.Provider value={{
      weatherData,
      alerts,
      loading,
      refreshWeatherData: fetchLatestWeatherData
    }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within WeatherProvider');
  }
  return context;
};
```

## 2. Earthquake API Integration (USGS + EMSC)

### Purpose
- Monitor earthquake activity near Naic, Cavite
- Provide real-time earthquake alerts
- Maintain earthquake history for analysis

### Implementation Strategy

#### Earthquake Monitoring Service
```javascript
// earthquakeService.js
const axios = require('axios');
const { firestore } = require('../config/firebase');
const { EarthquakeHistory } = require('../models/Earthquake');

class EarthquakeService {
  constructor() {
    this.usgsAPI = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
    this.emscAPI = 'https://www.seismicportal.eu/fdsnws/event/1/query';
    this.targetLocation = { lat: 14.3169, lng: 120.7598 }; // Naic, Cavite
    this.radiusKm = 100; // 100km radius
  }

  async fetchEarthquakeData() {
    try {
      // Try USGS first
      const usgsData = await this.fetchFromUSGS();
      return await this.processEarthquakeData(usgsData, 'USGS');
    } catch (error) {
      console.log('USGS API failed, trying EMSC fallback...');
      try {
        const emscData = await this.fetchFromEMSC();
        return await this.processEarthquakeData(emscData, 'EMSC');
      } catch (fallbackError) {
        console.error('Both earthquake APIs failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  async fetchFromUSGS() {
    const params = {
      format: 'geojson',
      starttime: this.getTimeWindow(),
      latitude: this.targetLocation.lat,
      longitude: this.targetLocation.lng,
      maxradiuskm: this.radiusKm,
      minmagnitude: 3.0 // Only significant earthquakes
    };

    const response = await axios.get(this.usgsAPI, { params });
    return response.data;
  }

  async fetchFromEMSC() {
    const params = {
      format: 'json',
      starttime: this.getTimeWindow(),
      latitude: this.targetLocation.lat,
      longitude: this.targetLocation.lng,
      maxradius: this.radiusKm / 111, // Convert km to degrees
      minmagnitude: 3.0
    };

    const response = await axios.get(this.emscAPI, { params });
    return response.data;
  }

  getTimeWindow() {
    // Get earthquakes from last 24 hours
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return yesterday.toISOString().split('T')[0];
  }

  async processEarthquakeData(data, source) {
    const earthquakes = source === 'USGS' ? data.features : data.events;
    const significantEarthquakes = [];

    for (const earthquake of earthquakes) {
      const processed = this.processEarthquakeEvent(earthquake, source);
      
      if (processed.magnitude >= 4.0) {
        significantEarthquakes.push(processed);
        
        // Store in MongoDB for history
        await EarthquakeHistory.create(processed);
        
        // Send immediate alert
        await this.sendEarthquakeAlert(processed);
      }
    }

    return significantEarthquakes;
  }

  processEarthquakeEvent(earthquake, source) {
    let magnitude, location, time, coordinates;

    if (source === 'USGS') {
      magnitude = earthquake.properties.mag;
      location = earthquake.properties.place;
      time = new Date(earthquake.properties.time);
      coordinates = earthquake.geometry.coordinates;
    } else {
      magnitude = earthquake.magnitude;
      location = earthquake.region;
      time = new Date(earthquake.time);
      coordinates = [earthquake.longitude, earthquake.latitude];
    }

    return {
      magnitude,
      location,
      time,
      coordinates: {
        lng: coordinates[0],
        lat: coordinates[1]
      },
      source,
      distance: this.calculateDistance(
        this.targetLocation,
        { lat: coordinates[1], lng: coordinates[0] }
      )
    };
  }

  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  async sendEarthquakeAlert(earthquake) {
    const severity = this.determineSeverity(earthquake);
    
    const alertDoc = {
      type: 'earthquake',
      title: 'Earthquake Alert',
      magnitude: earthquake.magnitude,
      location: earthquake.location,
      distance: earthquake.distance,
      time: earthquake.time,
      severity,
      coordinates: earthquake.coordinates,
      source: earthquake.source,
      timestamp: new Date(),
      isActive: true
    };

    // Store in Firestore for real-time updates
    await firestore.collection('alerts').add(alertDoc);
    
    // Trigger push notifications
    await this.notificationService.sendEarthquakeAlert(alertDoc);
  }

  determineSeverity(earthquake) {
    if (earthquake.magnitude >= 7.0) return 'critical';
    if (earthquake.magnitude >= 6.0) return 'high';
    if (earthquake.magnitude >= 5.0) return 'medium';
    return 'low';
  }

  // Start continuous monitoring
  startEarthquakeMonitoring() {
    // Check every 5 minutes
    setInterval(async () => {
      try {
        await this.fetchEarthquakeData();
        console.log('Earthquake monitoring updated');
      } catch (error) {
        console.error('Earthquake monitoring failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

module.exports = EarthquakeService;
```

## 3. Mapbox Integration

### Purpose
- Interactive maps for status reporting
- Visualize community status on admin dashboard
- Provide location selection interface

### Implementation Strategy

#### Client-Side Status Reporting
```javascript
// StatusReportMap.js (React Native)
import React, { useState, useRef } from 'react';
import MapboxGL from '@rnmapbox/maps';
import { View, StyleSheet, Alert } from 'react-native';

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

const StatusReportMap = ({ onLocationSelect }) => {
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const mapRef = useRef(null);

  const handleMapPress = async (event) => {
    const coordinates = event.geometry.coordinates;
    setSelectedCoordinates(coordinates);

    try {
      // Use LocationIQ for reverse geocoding
      const address = await reverseGeocode(coordinates);
      setSelectedAddress(address);
      
      onLocationSelect({
        coordinates: {
          lng: coordinates[0],
          lat: coordinates[1]
        },
        address
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to get address for selected location');
    }
  };

  const reverseGeocode = async (coordinates) => {
    const [lng, lat] = coordinates;
    const response = await fetch(
      `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lng}&format=json`
    );
    const data = await response.json();
    return data.display_name;
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        onPress={handleMapPress}
        compassEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <MapboxGL.Camera
          zoomLevel={14}
          centerCoordinate={[120.7598, 14.3169]} // Naic, Cavite
        />
        
        {selectedCoordinates && (
          <MapboxGL.PointAnnotation
            id="selected-location"
            coordinate={selectedCoordinates}
          >
            <View style={styles.marker}>
              <View style={styles.markerInner} />
            </View>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B6B',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
});

export default StatusReportMap;
```

#### Admin Dashboard Map Viewer
```javascript
// AdminMapViewer.js (React.js)
import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { firestore } from '../config/firebase';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const AdminMapViewer = () => {
  const [map, setMap] = useState(null);
  const [statusReports, setStatusReports] = useState([]);

  useEffect(() => {
    const initializeMap = () => {
      const mapInstance = new mapboxgl.Map({
        container: 'map-container',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [120.7598, 14.3169], // Naic, Cavite
        zoom: 12
      });

      mapInstance.on('load', () => {
        setMap(mapInstance);
        loadStatusReports(mapInstance);
      });

      return mapInstance;
    };

    const mapInstance = initializeMap();

    // Listen for real-time status updates
    const unsubscribe = firestore
      .collection('liveStatus')
      .where('isActive', '==', true)
      .onSnapshot(snapshot => {
        const reports = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStatusReports(reports);
        updateMapMarkers(mapInstance, reports);
      });

    return () => {
      mapInstance.remove();
      unsubscribe();
    };
  }, []);

  const loadStatusReports = async (mapInstance) => {
    const snapshot = await firestore
      .collection('liveStatus')
      .where('isActive', '==', true)
      .get();

    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    updateMapMarkers(mapInstance, reports);
  };

  const updateMapMarkers = (mapInstance, reports) => {
    // Clear existing markers
    if (mapInstance.getLayer('status-reports')) {
      mapInstance.removeLayer('status-reports');
    }
    if (mapInstance.getSource('status-reports')) {
      mapInstance.removeSource('status-reports');
    }

    // Add new markers
    const geojsonData = {
      type: 'FeatureCollection',
      features: reports.map(report => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [report.location.longitude, report.location.latitude]
        },
        properties: {
          id: report.id,
          status: report.status,
          userId: report.userId,
          description: report.description,
          numberOfPeople: report.numberOfPeople,
          timestamp: report.timestamp
        }
      }))
    };

    mapInstance.addSource('status-reports', {
      type: 'geojson',
      data: geojsonData
    });

    mapInstance.addLayer({
      id: 'status-reports',
      type: 'circle',
      source: 'status-reports',
      paint: {
        'circle-radius': 8,
        'circle-color': [
          'match',
          ['get', 'status'],
          'safe', '#4CAF50',
          'evacuated', '#FF9800',
          'affected', '#F44336',
          'missing', '#9C27B0',
          '#757575'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#FFFFFF'
      }
    });

    // Add click event for markers
    mapInstance.on('click', 'status-reports', (e) => {
      const properties = e.features[0].properties;
      showStatusPopup(mapInstance, e.lngLat, properties);
    });
  };

  const showStatusPopup = (mapInstance, lngLat, properties) => {
    const popup = new mapboxgl.Popup()
      .setLngLat(lngLat)
      .setHTML(`
        <div style="padding: 10px;">
          <h3>Status Report</h3>
          <p><strong>Status:</strong> ${properties.status}</p>
          <p><strong>People:</strong> ${properties.numberOfPeople}</p>
          <p><strong>Description:</strong> ${properties.description}</p>
          <p><strong>Time:</strong> ${new Date(properties.timestamp).toLocaleString()}</p>
        </div>
      `)
      .addTo(mapInstance);
  };

  return (
    <div 
      id="map-container" 
      style={{ width: '100%', height: '500px' }}
    />
  );
};

export default AdminMapViewer;
```

## 4. LocationIQ Geocoding Integration

### Purpose
- Convert coordinates to readable addresses
- Reduce Mapbox API usage for geocoding
- Provide address suggestions

### Implementation Strategy

```javascript
// geocodingService.js
const axios = require('axios');

class GeocodingService {
  constructor() {
    this.apiKey = process.env.LOCATIONIQ_API_KEY;
    this.baseURL = 'https://us1.locationiq.com/v1';
  }

  async reverseGeocode(lat, lng) {
    try {
      const response = await axios.get(`${this.baseURL}/reverse.php`, {
        params: {
          key: this.apiKey,
          lat,
          lon: lng,
          format: 'json',
          'accept-language': 'en'
        }
      });

      return {
        address: response.data.display_name,
        components: {
          house_number: response.data.address.house_number,
          road: response.data.address.road,
          suburb: response.data.address.suburb,
          city: response.data.address.city,
          province: response.data.address.state,
          country: response.data.address.country
        }
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      throw error;
    }
  }

  async forwardGeocode(address) {
    try {
      const response = await axios.get(`${this.baseURL}/search.php`, {
        params: {
          key: this.apiKey,
          q: address,
          format: 'json',
          countrycodes: 'ph', // Philippines only
          limit: 5
        }
      });

      return response.data.map(result => ({
        address: result.display_name,
        coordinates: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        },
        boundingBox: result.boundingbox
      }));
    } catch (error) {
      console.error('Forward geocoding failed:', error);
      throw error;
    }
  }
}

module.exports = GeocodingService;
```

## 5. Philippine Standard Geographic Code API

### Purpose
- Provide standardized location data for Philippines
- Auto-complete location fields in registration
- Ensure consistent location naming

### Implementation Strategy

```javascript
// philippineLocationService.js
const axios = require('axios');

class PhilippineLocationService {
  constructor() {
    this.baseURL = 'https://psgc.gitlab.io/api';
  }

  async getRegions() {
    try {
      const response = await axios.get(`${this.baseURL}/regions/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch regions:', error);
      throw error;
    }
  }

  async getProvinces(regionCode) {
    try {
      const response = await axios.get(`${this.baseURL}/regions/${regionCode}/provinces/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
      throw error;
    }
  }

  async getCities(provinceCode) {
    try {
      const response = await axios.get(`${this.baseURL}/provinces/${provinceCode}/cities-municipalities/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cities:', error);
      throw error;
    }
  }

  async getBarangays(cityCode) {
    try {
      const response = await axios.get(`${this.baseURL}/cities-municipalities/${cityCode}/barangays/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch barangays:', error);
      throw error;
    }
  }

  // Get location hierarchy for Cavite
  async getCaviteLocations() {
    try {
      // Cavite is in Region IV-A (CALABARZON)
      const regionCode = '040000000'; // CALABARZON
      const provinceCode = '042100000'; // Cavite
      
      const cities = await this.getCities(provinceCode);
      const naicCity = cities.find(city => city.name === 'Naic');
      
      if (naicCity) {
        const barangays = await this.getBarangays(naicCity.code);
        return {
          region: 'CALABARZON',
          province: 'Cavite',
          city: 'Naic',
          barangays
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get Cavite locations:', error);
      throw error;
    }
  }
}

module.exports = PhilippineLocationService;
```

## API Rate Limiting and Optimization

### Rate Limiting Strategy
```javascript
// rateLimiter.js
const Redis = require('redis');
const redis = Redis.createClient();

class RateLimiter {
  constructor() {
    this.limits = {
      'tomorrow.io': { requests: 1000, window: 24 * 60 * 60 }, // 1000/day
      'mapbox': { requests: 50000, window: 30 * 24 * 60 * 60 }, // 50k/month
      'locationiq': { requests: 5000, window: 24 * 60 * 60 } // 5000/day
    };
  }

  async checkLimit(apiName, userId = 'system') {
    const key = `rate_limit:${apiName}:${userId}`;
    const limit = this.limits[apiName];
    
    if (!limit) return true;

    const current = await redis.get(key);
    
    if (!current) {
      await redis.setex(key, limit.window, 1);
      return true;
    }

    if (parseInt(current) >= limit.requests) {
      return false;
    }

    await redis.incr(key);
    return true;
  }

  async getRemainingRequests(apiName, userId = 'system') {
    const key = `rate_limit:${apiName}:${userId}`;
    const limit = this.limits[apiName];
    const current = await redis.get(key) || 0;
    
    return Math.max(0, limit.requests - parseInt(current));
  }
}

module.exports = RateLimiter;
```

This comprehensive API integration guide provides the foundation for implementing all external services in your RescueNect system while respecting rate limits and optimizing for performance.
