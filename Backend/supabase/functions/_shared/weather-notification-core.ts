// Weather Notification Core Logic - Shared Module
// Supabase Edge Function Compatible Version

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitationProbability: number;
  rainIntensity: number;
  windSpeed: number;
  weatherCode: number;
  uvIndex: number;
  rainAccumulation: number;
  windGust: number;
  windDirection: number;
  cloudCover: number;
  temperatureApparent: number;
  visibility: number;
  time?: string; // ISO string
}

export type NotificationLevel = 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO';
export type NotificationCategory =
  | 'Heat'
  | 'Rain'
  | 'Wind'
  | 'Visibility'
  | 'UV'
  | 'Storm'
  | 'Flood'
  | 'Clear'
  | 'Cloudy'
  | 'Tropical'
  | 'Combined';

export interface WeatherNotification {
  level: NotificationLevel;
  category: NotificationCategory;
  title: string;
  message: string;
  priority: number;
  timestamp: Date;
  data?: Record<string, unknown>;
}

// ============================================
// WEATHER THRESHOLDS CONFIGURATION
// ============================================

export const WEATHER_THRESHOLDS = {
  // Heat-related thresholds (°C)
  HEAT: {
    CRITICAL: {
      temperatureApparent: 40,
      combinedRisk: { temperature: 35, humidity: 70 },
    },
    WARNING: {
      temperatureApparent: 38,
      temperature: 35,
      combinedUV: { temperature: 32, uvIndex: 8 },
    },
    ADVISORY: {
      temperature: 35,
      temperatureApparent: 36,
    },
  },

  // Precipitation thresholds (mm/h for intensity, mm for accumulation)
  RAIN: {
    CRITICAL: {
      rainIntensity: 50, // Flash flood risk
      rainAccumulation: 50, // Severe flooding likely
      combinedRisk: { accumulation: 25, intensity: 5 },
    },
    WARNING: {
      rainIntensity: 7, // Heavy rain
      rainAccumulation: 30, // Flooding possible
      stormCondition: { windSpeed: 12, rainIntensity: 5 },
    },
    ADVISORY: {
      rainIntensity: 2.5, // Moderate rain
      precipitationProbability: 70, // High chance of rain
    },
  },

  // Wind thresholds (m/s)
  WIND: {
    CRITICAL: {
      windGust: 20, // Extreme danger
      sustainedWind: 17, // Severe damage possible
    },
    WARNING: {
      windGust: 15, // Strong gusts
      sustainedWind: 14, // Dangerous conditions
    },
    ADVISORY: {
      windSpeed: 8, // Strong wind advisory
    },
  },

  // Visibility thresholds (km)
  VISIBILITY: {
    CRITICAL: 0.2, // Extremely dangerous
    WARNING: 1.0, // Poor visibility
    ADVISORY: 4.0, // Reduced visibility
  },

  // UV Index thresholds
  UV: {
    WARNING: 11, // Extreme UV
    ADVISORY: 8, // Very high UV
    INFO: 6, // High UV
  },

  // Combined conditions for storms
  STORM: {
    CRITICAL: {
      windSpeed: 12,
      rainIntensity: 5,
    },
  },
};

// ============================================
// WEATHER NOTIFICATION SYSTEM CLASS
// ============================================

export class WeatherNotificationSystem {
  private notifications: WeatherNotification[] = [];

  /**
   * Main method to check all weather conditions and generate notifications
   */
  public checkWeatherConditions(weatherData: WeatherData): WeatherNotification[] {
    this.notifications = []; // Reset notifications

    // Validate data freshness (optional)
    if (!this.isDataFresh(weatherData)) {
      console.warn('Weather data is not fresh, notifications may be inaccurate');
    }

    // Run all condition checks
    this.checkHeatConditions(weatherData);
    this.checkRainConditions(weatherData);
    this.checkWindConditions(weatherData);
    this.checkVisibilityConditions(weatherData);
    this.checkUVConditions(weatherData);
    this.checkStormConditions(weatherData);
    this.checkFloodRiskConditions(weatherData);

    // Sort by priority (1 = highest)
    return this.notifications.sort((a, b) => a.priority - b.priority);
  }

  // ============================================
  // 1. HEAT-RELATED ALERTS
  // ============================================
  private checkHeatConditions(data: WeatherData): void {
    const { temperature, temperatureApparent, humidity, uvIndex } = data;
    const thresholds = WEATHER_THRESHOLDS.HEAT;

    // EXTREME HEAT WARNING (Life-threatening)
    if (temperatureApparent >= thresholds.CRITICAL.temperatureApparent) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Heat',
        title: '🔥 EXTREME HEAT EMERGENCY',
        message: `LIFE-THREATENING heat! Feels like ${temperatureApparent.toFixed(
          1
        )}°C. Stay indoors immediately. Risk of heatstroke is EXTREME. Seek air conditioning or cooling centers.`,
        priority: 1,
        data: { temperature, temperatureApparent, humidity, riskLevel: 'extreme' },
      });
    }
    // COMBINED HIGH TEMPERATURE + HUMIDITY (Dangerous heat index)
    else if (
      temperature >= thresholds.CRITICAL.combinedRisk.temperature &&
      humidity >= thresholds.CRITICAL.combinedRisk.humidity
    ) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Heat',
        title: '🥵 DANGEROUS HEAT INDEX',
        message: `Critical combination: ${temperature.toFixed(
          1
        )}°C with ${humidity}% humidity creates dangerous conditions. Heat exhaustion and heatstroke likely. Avoid outdoor activities.`,
        priority: 1,
        data: { temperature, temperatureApparent, humidity, heatIndex: this.calculateHeatIndex(temperature, humidity) },
      });
    }
    // SEVERE HEAT WARNING
    else if (
      temperatureApparent >= thresholds.WARNING.temperatureApparent ||
      temperature >= thresholds.WARNING.temperature
    ) {
      this.addNotification({
        level: 'WARNING',
        category: 'Heat',
        title: '🌡️ SEVERE HEAT WARNING',
        message: `Dangerous heat conditions: ${temperature.toFixed(1)}°C (feels like ${temperatureApparent.toFixed(
          1
        )}°C). High risk of heat-related illness. Limit outdoor exposure and stay hydrated.`,
        priority: 2,
        data: { temperature, temperatureApparent, humidity },
      });
    }
    // HIGH HEAT ADVISORY
    else if (
      temperature >= thresholds.ADVISORY.temperature ||
      temperatureApparent >= thresholds.ADVISORY.temperatureApparent
    ) {
      this.addNotification({
        level: 'ADVISORY',
        category: 'Heat',
        title: '☀️ High Heat Advisory',
        message: `Hot conditions expected: ${temperature.toFixed(1)}°C (feels like ${temperatureApparent.toFixed(
          1
        )}°C). Take precautions during outdoor activities. Stay hydrated and seek shade.`,
        priority: 3,
        data: { temperature, temperatureApparent },
      });
    }

    // COMBINED HEAT + UV WARNING
    if (temperature >= thresholds.WARNING.combinedUV.temperature && uvIndex >= thresholds.WARNING.combinedUV.uvIndex) {
      this.addNotification({
        level: 'WARNING',
        category: 'Combined',
        title: '🔆 HEAT & UV DANGER',
        message: `Double threat: High temperature (${temperature.toFixed(
          1
        )}°C) + Extreme UV (${uvIndex}). Serious skin damage and heat illness risk. Use SPF 50+, wear protective clothing, stay in shade.`,
        priority: 2,
        data: { temperature, uvIndex, combinedRisk: true },
      });
    }
  }

  // ============================================
  // 2. RAIN & PRECIPITATION ALERTS
  // ============================================
  private checkRainConditions(data: WeatherData): void {
    const { precipitationProbability, rainIntensity, rainAccumulation } = data;
    const thresholds = WEATHER_THRESHOLDS.RAIN;

    // FLASH FLOOD EMERGENCY (Extreme rainfall)
    if (rainIntensity >= thresholds.CRITICAL.rainIntensity) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Rain',
        title: '⚡ FLASH FLOOD EMERGENCY',
        message: `EXTREME RAINFALL: ${rainIntensity.toFixed(
          1
        )}mm/h! Flash flooding imminent. DO NOT drive through flooded roads. Seek higher ground immediately.`,
        priority: 1,
        data: { rainIntensity, floodRisk: 'extreme' },
      });
    }
    // HEAVY RAIN WARNING
    else if (rainIntensity >= thresholds.WARNING.rainIntensity) {
      this.addNotification({
        level: 'WARNING',
        category: 'Rain',
        title: '🌧️ HEAVY RAIN WARNING',
        message: `Heavy rainfall detected: ${rainIntensity.toFixed(
          1
        )}mm/h. Flooding possible in low-lying areas. Avoid unnecessary travel. Turn around, don't drown.`,
        priority: 2,
        data: { rainIntensity, floodRisk: 'high' },
      });
    }
    // MODERATE RAIN ADVISORY
    else if (rainIntensity >= thresholds.ADVISORY.rainIntensity) {
      this.addNotification({
        level: 'ADVISORY',
        category: 'Rain',
        title: '🌦️ Moderate Rain Alert',
        message: `Steady rain at ${rainIntensity.toFixed(
          1
        )}mm/h. Roads may become slippery. Drive carefully and allow extra travel time.`,
        priority: 4,
        data: { rainIntensity },
      });
    }

    // HIGH CHANCE OF RAIN (INFO level)
    if (precipitationProbability >= thresholds.ADVISORY.precipitationProbability) {
      this.addNotification({
        level: 'INFO',
        category: 'Rain',
        title: '☔ Rain Expected',
        message: `${precipitationProbability}% chance of rain in your area. Consider bringing an umbrella or raincoat.`,
        priority: 5,
        data: { precipitationProbability },
      });
    }

    // ACCUMULATED RAINFALL WARNINGS
    if (rainAccumulation >= thresholds.CRITICAL.rainAccumulation) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Flood',
        title: '🌊 SEVERE FLOODING ALERT',
        message: `DANGEROUS rainfall accumulation: ${rainAccumulation.toFixed(
          1
        )}mm. Major flooding likely. Evacuate flood-prone areas NOW. Emergency services may be limited.`,
        priority: 1,
        data: { rainAccumulation, evacuationRequired: true },
      });
    } else if (rainAccumulation >= thresholds.WARNING.rainAccumulation) {
      this.addNotification({
        level: 'WARNING',
        category: 'Flood',
        title: '⚠️ Flood Warning',
        message: `Significant rainfall: ${rainAccumulation.toFixed(
          1
        )}mm recorded. Flooding possible in vulnerable areas. Monitor local waterways and be ready to evacuate.`,
        priority: 2,
        data: { rainAccumulation, monitoringRequired: true },
      });
    }
  }

  // ============================================
  // 3. WIND ALERTS
  // ============================================
  private checkWindConditions(data: WeatherData): void {
    const { windSpeed, windGust, windDirection } = data;
    const windDirectionLabel = this.getWindDirectionLabel(windDirection);
    const thresholds = WEATHER_THRESHOLDS.WIND;

    // EXTREME WIND DANGER
    if (windGust >= thresholds.CRITICAL.windGust) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Wind',
        title: '💨 EXTREME WIND EMERGENCY',
        message: `LIFE-THREATENING wind gusts: ${windGust.toFixed(1)}m/s (${(windGust * 3.6).toFixed(
          0
        )}km/h) from ${windDirectionLabel}. Widespread damage expected. Stay indoors away from windows and trees.`,
        priority: 1,
        data: { windGust, windDirection, damageRisk: 'severe' },
      });
    }
    // SUSTAINED DANGEROUS WINDS
    else if (windSpeed >= thresholds.CRITICAL.sustainedWind) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Wind',
        title: '🌪️ DANGEROUS WIND WARNING',
        message: `Sustained dangerous winds: ${windSpeed.toFixed(1)}m/s (${(windSpeed * 3.6).toFixed(
          0
        )}km/h) from ${windDirectionLabel}. Structural damage possible. Secure all loose objects immediately.`,
        priority: 1,
        data: { windSpeed, windDirection, structuralRisk: true },
      });
    }
    // STRONG WIND GUSTS
    else if (windGust >= thresholds.WARNING.windGust) {
      this.addNotification({
        level: 'WARNING',
        category: 'Wind',
        title: '💨 Strong Wind Warning',
        message: `Strong wind gusts up to ${windGust.toFixed(1)}m/s (${(windGust * 3.6).toFixed(
          0
        )}km/h) from ${windDirectionLabel}. Falling branches possible. Secure outdoor items and avoid coastal areas.`,
        priority: 2,
        data: { windGust, windDirection },
      });
    }
    // SUSTAINED HIGH WINDS
    else if (windSpeed >= thresholds.WARNING.sustainedWind) {
      this.addNotification({
        level: 'WARNING',
        category: 'Wind',
        title: '🌬️ High Wind Alert',
        message: `Sustained high winds: ${windSpeed.toFixed(1)}m/s (${(windSpeed * 3.6).toFixed(
          0
        )}km/h) from ${windDirectionLabel}. Difficult driving conditions. Avoid high-profile vehicles on open roads.`,
        priority: 2,
        data: { windSpeed, windDirection },
      });
    }
    // STRONG WIND ADVISORY
    else if (windSpeed >= thresholds.ADVISORY.windSpeed) {
      this.addNotification({
        level: 'ADVISORY',
        category: 'Wind',
        title: '💨 Strong Wind Advisory',
        message: `Strong winds at ${windSpeed.toFixed(1)}m/s (${(windSpeed * 3.6).toFixed(
          0
        )}km/h) from ${windDirectionLabel}. Secure lightweight objects and use caution when driving.`,
        priority: 3,
        data: { windSpeed, windDirection },
      });
    }
  }

  // ============================================
  // 4. VISIBILITY ALERTS
  // ============================================
  private checkVisibilityConditions(data: WeatherData): void {
    const { visibility, rainIntensity, cloudCover } = data;
    const thresholds = WEATHER_THRESHOLDS.VISIBILITY;

    // DANGEROUS VISIBILITY (Critical)
    if (visibility < thresholds.CRITICAL) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Visibility',
        title: '🚨 ZERO VISIBILITY ALERT',
        message: `EXTREMELY dangerous visibility: Only ${(visibility * 1000).toFixed(
          0
        )}m. Travel is NOT SAFE. If driving, pull over safely and wait for conditions to improve.`,
        priority: 1,
        data: { visibility, travelSafety: 'dangerous' },
      });
    }
    // POOR VISIBILITY (Warning)
    else if (visibility < thresholds.WARNING) {
      const cause = rainIntensity > 5 ? 'heavy rain' : cloudCover > 90 ? 'dense fog' : 'weather conditions';

      this.addNotification({
        level: 'WARNING',
        category: 'Visibility',
        title: '🌫️ POOR VISIBILITY WARNING',
        message: `Dangerous visibility: ${visibility.toFixed(
          1
        )}km due to ${cause}. Use headlights, reduce speed, increase following distance. Consider delaying non-essential travel.`,
        priority: 2,
        data: { visibility, cause },
      });
    }
    // REDUCED VISIBILITY (Advisory)
    else if (visibility < thresholds.ADVISORY) {
      this.addNotification({
        level: 'ADVISORY',
        category: 'Visibility',
        title: '⚠️ Reduced Visibility',
        message: `Visibility reduced to ${visibility.toFixed(
          1
        )}km. Drive with caution, use headlights, and maintain safe following distances.`,
        priority: 4,
        data: { visibility },
      });
    }
  }

  // ============================================
  // 5. UV INDEX ALERTS
  // ============================================
  private checkUVConditions(data: WeatherData): void {
    const { uvIndex, cloudCover } = data;
    const thresholds = WEATHER_THRESHOLDS.UV;

    // Only alert if there's significant sun exposure (low cloud cover)
    if (cloudCover < 70) {
      if (uvIndex >= thresholds.WARNING) {
        this.addNotification({
          level: 'WARNING',
          category: 'UV',
          title: '🔆 EXTREME UV DANGER',
          message: `EXTREME UV Index: ${uvIndex}! Severe skin damage in minutes. Stay indoors 11 AM-3 PM. If outside: SPF 50+, long sleeves, wide-brim hat, sunglasses.`,
          priority: 2,
          data: { uvIndex, skinDamageRisk: 'severe' },
        });
      } else if (uvIndex >= thresholds.ADVISORY) {
        this.addNotification({
          level: 'ADVISORY',
          category: 'UV',
          title: '☀️ Very High UV Alert',
          message: `Very High UV Index: ${uvIndex}. Skin damage possible in 15-20 minutes. Use SPF 30+, seek shade during midday, wear protective clothing.`,
          priority: 3,
          data: { uvIndex, protectionNeeded: true },
        });
      } else if (uvIndex >= thresholds.INFO) {
        this.addNotification({
          level: 'INFO',
          category: 'UV',
          title: '🌞 High UV Advisory',
          message: `High UV Index: ${uvIndex}. Sun protection recommended for extended outdoor activities. Apply sunscreen and reapply every 2 hours.`,
          priority: 5,
          data: { uvIndex },
        });
      }
    }
  }

  // ============================================
  // 6. STORM & SEVERE WEATHER ALERTS
  // ============================================
  private checkStormConditions(data: WeatherData): void {
    const { weatherCode, windSpeed, rainIntensity, windGust } = data;
    const stormThreshold = WEATHER_THRESHOLDS.STORM.CRITICAL;

    // THUNDERSTORM ALERT
    if (weatherCode === 8000) {
      this.addNotification({
        level: 'WARNING',
        category: 'Storm',
        title: '⛈️ THUNDERSTORM ALERT',
        message: `Thunderstorm in your area! Lightning danger: Stay indoors, avoid water, unplug electronics. Do not use corded phones or stand under trees.`,
        priority: 2,
        data: { weatherCode, lightningRisk: true },
      });
    }

    // SEVERE STORM (Combined conditions)
    if (windSpeed >= stormThreshold.windSpeed && rainIntensity >= stormThreshold.rainIntensity) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Storm',
        title: '🌀 SEVERE STORM WARNING',
        message: `SEVERE STORM: Heavy rain (${rainIntensity.toFixed(1)}mm/h) with dangerous winds (${windSpeed.toFixed(
          1
        )}m/s). Flooding and wind damage likely. Take shelter immediately.`,
        priority: 1,
        data: { windSpeed, rainIntensity, stormSeverity: 'major' },
      });
    }

    // TROPICAL STORM CONDITIONS (High wind + rain)
    if (windGust >= 17 && rainIntensity >= 10) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Storm',
        title: '🌪️ TROPICAL STORM CONDITIONS',
        message: `Tropical storm-like conditions: Wind gusts ${windGust.toFixed(
          1
        )}m/s with torrential rain. Widespread damage expected. Stay indoors until conditions improve.`,
        priority: 1,
        data: { windGust, rainIntensity, tropicalConditions: true },
      });
    }
  }

  // ============================================
  // 7. FLOOD RISK ASSESSMENT
  // ============================================
  private checkFloodRiskConditions(data: WeatherData): void {
    const { rainAccumulation, rainIntensity, precipitationProbability } = data;
    const criticalThreshold = WEATHER_THRESHOLDS.RAIN.CRITICAL.combinedRisk;

    // FLASH FLOOD EMERGENCY (Multiple risk factors)
    if (rainAccumulation >= criticalThreshold.accumulation && rainIntensity >= criticalThreshold.intensity) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Flood',
        title: '🚨 FLASH FLOOD EMERGENCY',
        message: `FLASH FLOOD EMERGENCY: ${rainAccumulation.toFixed(
          1
        )}mm accumulated + heavy rain (${rainIntensity.toFixed(
          1
        )}mm/h) ongoing. Life-threatening flooding. Move to higher ground NOW!`,
        priority: 1,
        data: {
          rainAccumulation,
          rainIntensity,
          floodSeverity: 'life-threatening',
          evacuationRequired: true,
        },
      });
    }
    // HIGH FLOOD RISK
    else if (rainAccumulation >= 15 && precipitationProbability >= 80) {
      this.addNotification({
        level: 'WARNING',
        category: 'Flood',
        title: '🌊 HIGH FLOOD RISK',
        message: `High flood risk: ${rainAccumulation.toFixed(
          1
        )}mm rain with more expected (${precipitationProbability}% chance). Monitor water levels. Prepare evacuation plan.`,
        priority: 2,
        data: { rainAccumulation, precipitationProbability, preparationNeeded: true },
      });
    }

    // URBAN FLOODING (Lower threshold for urban areas)
    if (rainIntensity >= 20 && rainAccumulation >= 10) {
      this.addNotification({
        level: 'WARNING',
        category: 'Flood',
        title: '🏙️ Urban Flooding Alert',
        message: `Urban flooding likely: Intense rain (${rainIntensity.toFixed(
          1
        )}mm/h) overwhelming drainage. Avoid underpasses and low-lying roads.`,
        priority: 2,
        data: { rainIntensity, rainAccumulation, urbanFlooding: true },
      });
    }
  }

  // ============================================
  // NORMAL WEATHER CONDITIONS (FOR FORECASTS)
  // ============================================

  /**
   * Check for normal/pleasant weather conditions (for forecast notifications)
   */
  public checkNormalWeatherConditions(weatherData: WeatherData): WeatherNotification[] {
    const normalNotifications: WeatherNotification[] = [];

    // Clear/Pleasant Weather
    if (this.isPleasantWeather(weatherData)) {
      normalNotifications.push({
        level: 'INFO',
        category: 'Clear',
        title: '☀️ Pleasant Weather Expected',
        message: this.getPleasantWeatherMessage(weatherData),
        priority: 10, // Low priority
        timestamp: new Date(),
        data: {
          weather_type: 'pleasant',
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          weather_code: weatherData.weatherCode,
        },
      });
    }

    // Tropical Weather (High humidity but otherwise pleasant)
    else if (this.isTropicalWeather(weatherData)) {
      normalNotifications.push({
        level: 'INFO',
        category: 'Tropical',
        title: '🌴 Typical Tropical Weather',
        message: this.getTropicalWeatherMessage(weatherData),
        priority: 10,
        timestamp: new Date(),
        data: {
          weather_type: 'tropical',
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          weather_code: weatherData.weatherCode,
        },
      });
    }

    // Partly Cloudy (Normal)
    else if (this.isPartlyCloudyWeather(weatherData)) {
      normalNotifications.push({
        level: 'INFO',
        category: 'Cloudy',
        title: '⛅ Partly Cloudy Weather',
        message: this.getPartlyCloudyMessage(weatherData),
        priority: 10,
        timestamp: new Date(),
        data: {
          weather_type: 'partly_cloudy',
          temperature: weatherData.temperature,
          cloud_cover: weatherData.cloudCover,
        },
      });
    }

    // Light Rain (Normal)
    else if (this.isLightRainWeather(weatherData)) {
      normalNotifications.push({
        level: 'INFO',
        category: 'Rain',
        title: '🌦️ Light Rain Expected',
        message: this.getLightRainMessage(weatherData),
        priority: 9,
        timestamp: new Date(),
        data: {
          weather_type: 'light_rain',
          rain_intensity: weatherData.rainIntensity,
          precipitation_probability: weatherData.precipitationProbability,
        },
      });
    }

    return normalNotifications;
  }

  /**
   * Check if weather conditions are pleasant (based on meteorological comfort standards)
   * Temperature Comfort Index: 20-26°C optimal for tropical climates
   * Humidity: <80% comfortable, 80-90% acceptable for tropics
   * Cloud Cover: <50% clear to partly cloudy
   * Wind: <12 km/h gentle conditions
   */
  private isPleasantWeather(data: WeatherData): boolean {
    return (
      data.temperature >= 20 &&
      data.temperature <= 26 && // Optimal human comfort range
      data.humidity <= 80 && // Professional comfort standard for tropics
      data.rainIntensity <= 0.5 && // Light precipitation acceptable
      data.windSpeed <= 12 && // Gentle breeze (professional wind scale)
      data.cloudCover <= 50 // Clear to partly cloudy (professional cloud classification)
    );
  }

  /**
   * Check if weather is acceptable (partly cloudy but still comfortable)
   * Extended comfort range for tropical climates
   */
  private isPartlyCloudyWeather(data: WeatherData): boolean {
    return (
      data.temperature >= 18 &&
      data.temperature <= 28 && // Extended comfort range
      data.cloudCover > 50 && // Start where pleasant weather ends
      data.cloudCover <= 75 && // Mostly cloudy but not overcast
      data.rainIntensity <= 1.0 && // Light rain acceptable
      data.windSpeed <= 15 && // Fresh breeze acceptable
      data.humidity <= 85 // Acceptable tropical humidity
    );
  }

  /**
   * Check if weather is typical tropical conditions (high humidity but otherwise pleasant)
   * Professional meteorological classification for tropical maritime climates
   * Humidity 85-95% is normal for Philippines but affects comfort
   */
  private isTropicalWeather(data: WeatherData): boolean {
    return (
      data.temperature >= 22 &&
      data.temperature <= 30 && // Tropical temperature range
      data.humidity > 85 &&
      data.humidity <= 95 && // High but normal tropical humidity
      data.rainIntensity <= 0.5 && // No significant precipitation
      data.windSpeed <= 12 && // Gentle conditions
      data.cloudCover <= 60 // Clear to partly cloudy
    );
  }

  /**
   * Check if it's light rain (not heavy enough for warnings)
   */
  private isLightRainWeather(data: WeatherData): boolean {
    return (
      data.rainIntensity > 0.1 &&
      data.rainIntensity < 2.5 && // Light rain only
      data.precipitationProbability >= 60 &&
      data.windSpeed <= 10 // Not stormy
    );
  }

  /**
   * Generate tropical weather messages (professional meteorological classification)
   */
  private getTropicalWeatherMessage(data: WeatherData): string {
    const temp = Math.round(data.temperature);
    const humidity = Math.round(data.humidity);
    const messages = [
      `Typical tropical weather conditions. Temperature: ${temp}°C with ${humidity}% humidity. Consider indoor activities during peak hours. 🌴`,
      `Standard tropical climate expected: ${temp}°C with high humidity (${humidity}%). Stay hydrated and seek shade when possible. 🌺`,
      `Normal tropical conditions ahead: ${temp}°C, humidity ${humidity}%. Perfect weather for early morning or evening activities. 🌅`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Generate pleasant weather messages
   */
  private getPleasantWeatherMessage(data: WeatherData): string {
    const temp = Math.round(data.temperature);
    const messages = [
      `Perfect weather ahead! Temperature: ${temp}°C with clear skies. Great for outdoor activities! 🌞`,
      `Beautiful day expected with ${temp}°C and sunny conditions. Perfect for going out! ☀️`,
      `Lovely weather coming up! ${temp}°C with comfortable conditions. Enjoy the outdoors! 🌤️`,
      `Clear skies and ${temp}°C temperature ahead. Perfect day for any outdoor plans! 🌟`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Generate partly cloudy messages
   */
  private getPartlyCloudyMessage(data: WeatherData): string {
    const temp = Math.round(data.temperature);
    return `Partly cloudy conditions expected with ${temp}°C. Pleasant weather for most activities. ⛅`;
  }

  /**
   * Generate light rain messages
   */
  private getLightRainMessage(data: WeatherData): string {
    const temp = Math.round(data.temperature);
    const rainChance = Math.round(data.precipitationProbability);
    return `Light rain expected (${rainChance}% chance) with ${temp}°C. Don't forget your umbrella! 🌦️`;
  }

  /**
   * Get all conditions including normal weather (for forecasts)
   */
  public checkAllWeatherConditions(weatherData: WeatherData, includeNormal: boolean = false): WeatherNotification[] {
    // Get existing critical/warning conditions
    const criticalConditions = this.checkWeatherConditions(weatherData);

    if (includeNormal && criticalConditions.length === 0) {
      // Only show normal conditions if no critical/warning conditions exist
      const normalConditions = this.checkNormalWeatherConditions(weatherData);
      return normalConditions;
    }

    return criticalConditions;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private addNotification(notification: Omit<WeatherNotification, 'timestamp'>): void {
    this.notifications.push({
      ...notification,
      timestamp: new Date(),
    });
  }

  private getWindDirectionLabel(degrees: number): string {
    if (degrees < 0 || degrees > 360) return 'Unknown';

    const directions = [
      'North',
      'NNE',
      'NE',
      'ENE',
      'East',
      'ESE',
      'SE',
      'SSE',
      'South',
      'SSW',
      'SW',
      'WSW',
      'West',
      'WNW',
      'NW',
      'NNW',
    ];

    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  /**
   * Calculate heat index for combined temperature and humidity
   */
  private calculateHeatIndex(temperature: number, humidity: number): number {
    // Simplified heat index calculation (°C)
    const T = temperature;
    const RH = humidity;

    if (T < 27) return T; // Heat index not applicable for lower temperatures

    // Heat index formula coefficients
    const c1 = -8.78469475556;
    const c2 = 1.61139411;
    const c3 = 2.33854883889;
    const c4 = -0.14611605;
    const c5 = -0.012308094;
    const c6 = -0.0164248277778;
    const c7 = 0.002211732;
    const c8 = 0.00072546;
    const c9 = -0.000003582;

    const heatIndex =
      c1 +
      c2 * T +
      c3 * RH +
      c4 * T * RH +
      c5 * T * T +
      c6 * RH * RH +
      c7 * T * T * RH +
      c8 * T * RH * RH +
      c9 * T * T * RH * RH;

    return Math.round(heatIndex * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Check if weather data is fresh (within reasonable time limits)
   */
  private isDataFresh(data: WeatherData): boolean {
    if (!data.time) return false;

    const dataTime = new Date(data.time).getTime();
    const now = new Date().getTime();
    const ageInMinutes = (now - dataTime) / (1000 * 60);

    // Data should be no older than 2 hours for accurate notifications
    return ageInMinutes <= 120;
  }

  /**
   * Get a simple weather summary based on weather code
   */
  public getWeatherSummary(weatherCode: number): string {
    const weatherDescriptions: Record<number, string> = {
      0: 'Unknown',
      1000: '☀️ Clear',
      1001: '☁️ Cloudy',
      1100: '🌤️ Mostly Clear',
      1101: '⛅ Partly Cloudy',
      1102: '☁️ Mostly Cloudy',
      4000: '🌧️ Drizzle',
      4001: '🌧️ Rain',
      4200: '🌦️ Light Rain',
      4201: '⛈️ Heavy Rain',
      8000: '⚡ Thunderstorm',
      6000: '🌨️ Freezing Drizzle',
      6001: '❄️ Freezing Rain',
      6200: '🌨️ Light Freezing Rain',
      6201: '❄️ Heavy Freezing Rain',
      7000: '🌨️ Ice Pellets',
      7101: '🌨️ Heavy Ice Pellets',
      7102: '🌨️ Light Ice Pellets',
      5000: '❄️ Snow',
      5001: '🌨️ Flurries',
      5100: '❄️ Light Snow',
      5101: '🌨️ Heavy Snow',
    };

    return weatherDescriptions[weatherCode] || `Unknown Weather (${weatherCode})`;
  }

  /**
   * Filter notifications by level
   */
  public filterByLevel(level: NotificationLevel): WeatherNotification[] {
    return this.notifications.filter(n => n.level === level);
  }

  /**
   * Get only critical and warning notifications (urgent)
   */
  public getUrgentNotifications(): WeatherNotification[] {
    return this.notifications.filter(n => n.level === 'CRITICAL' || n.level === 'WARNING');
  }

  /**
   * Get notifications by category
   */
  public getNotificationsByCategory(category: NotificationCategory): WeatherNotification[] {
    return this.notifications.filter(n => n.category === category);
  }

  /**
   * Check if any critical conditions exist
   */
  public hasCriticalConditions(): boolean {
    return this.notifications.some(n => n.level === 'CRITICAL');
  }

  /**
   * Get the highest priority notification
   */
  public getHighestPriorityNotification(): WeatherNotification | null {
    if (this.notifications.length === 0) return null;
    return this.notifications.reduce((highest, current) => (current.priority < highest.priority ? current : highest));
  }

  /**
   * Format notification for FCM
   */
  public formatForFCM(
    notification: WeatherNotification,
    locationName: string
  ): {
    title: string;
    body: string;
    data: Record<string, string>;
  } {
    return {
      title: `${notification.title} - ${locationName}`,
      body: notification.message,
      data: {
        level: notification.level,
        category: notification.category,
        location: locationName,
        timestamp: notification.timestamp.toISOString(),
        priority: notification.priority.toString(),
        ...(notification.data && Object.fromEntries(Object.entries(notification.data).map(([k, v]) => [k, String(v)]))),
      },
    };
  }
}
