// Weather Notification Logic System for RescueNect
// TypeScript/Node.js Implementation

// ============================================
// TYPE DEFINITIONS
// ============================================

interface WeatherData {
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
}

export type NotificationLevel = 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO';
type NotificationCategory = 'Heat' | 'Rain' | 'Wind' | 'Visibility' | 'UV' | 'Storm' | 'Flood' | 'Combined';

export interface WeatherNotification {
  level: NotificationLevel;
  category: NotificationCategory;
  title: string;
  message: string;
  priority: number;
  timestamp: Date;
  data?: Record<string, any>;
}

// ============================================
// WEATHER NOTIFICATION CLASS
// ============================================

export class WeatherNotificationSystem {
  private notifications: WeatherNotification[] = [];

  /**
   * Main method to check all weather conditions and generate notifications
   */
  public checkWeatherConditions(weatherData: WeatherData): WeatherNotification[] {
    this.notifications = []; // Reset notifications

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

    // EXTREME HEAT WARNING (Life-threatening)
    if (temperatureApparent >= 40) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Heat',
        title: '🔥 EXTREME HEAT ALERT',
        message: `Feels like temperature is ${temperatureApparent}°C! CRITICAL RISK of heatstroke. Stay indoors, stay hydrated, and avoid all outdoor activities.`,
        priority: 1,
        data: { temperature, temperatureApparent, humidity },
      });
    }
    // SEVERE HEAT WARNING
    else if (temperatureApparent >= 38 || (temperature >= 35 && humidity >= 70)) {
      this.addNotification({
        level: 'WARNING',
        category: 'Heat',
        title: '🥵 Severe Heat Warning',
        message: `Temperature: ${temperature}°C, Feels like: ${temperatureApparent}°C with ${humidity}% humidity. High risk of heat exhaustion. Limit outdoor exposure and drink plenty of water.`,
        priority: 2,
        data: { temperature, temperatureApparent, humidity },
      });
    }
    // HIGH HEAT ADVISORY
    else if (temperature >= 35 || temperatureApparent >= 36) {
      this.addNotification({
        level: 'ADVISORY',
        category: 'Heat',
        title: '🌡️ High Heat Advisory',
        message: `Hot day ahead at ${temperature}°C (feels like ${temperatureApparent}°C). Stay hydrated and seek shade during peak hours (11 AM - 3 PM).`,
        priority: 3,
        data: { temperature, temperatureApparent },
      });
    }

    // COMBINED HEAT + UV WARNING
    if (temperature >= 32 && uvIndex >= 8) {
      this.addNotification({
        level: 'WARNING',
        category: 'Combined',
        title: '☀️ Heat & UV Alert',
        message: `High temperature (${temperature}°C) combined with very high UV Index (${uvIndex}). Double protection needed: stay cool AND use sun protection (SPF 30+, hat, sunglasses).`,
        priority: 2,
        data: { temperature, uvIndex },
      });
    }
  }

  // ============================================
  // 2. RAIN & PRECIPITATION ALERTS
  // ============================================
  private checkRainConditions(data: WeatherData): void {
    const { precipitationProbability, rainIntensity, rainAccumulation } = data;

    // HEAVY RAIN WARNING
    if (rainIntensity >= 7) {
      this.addNotification({
        level: 'WARNING',
        category: 'Rain',
        title: '🌧️ Heavy Rain Alert',
        message: `Heavy rain detected (${rainIntensity.toFixed(
          1
        )} mm/h). Avoid low-lying areas and be cautious on the roads. Flash flooding possible.`,
        priority: 2,
        data: { rainIntensity },
      });
    }
    // MODERATE RAIN ADVISORY
    else if (rainIntensity >= 2.5 && rainIntensity < 7) {
      this.addNotification({
        level: 'ADVISORY',
        category: 'Rain',
        title: '🌦️ Moderate Rain',
        message: `Moderate rain (${rainIntensity.toFixed(
          1
        )} mm/h) in your area. Please be cautious on the roads and carry an umbrella.`,
        priority: 4,
        data: { rainIntensity },
      });
    }

    // HIGH CHANCE OF RAIN
    if (precipitationProbability >= 70) {
      this.addNotification({
        level: 'INFO',
        category: 'Rain',
        title: '☔ High Chance of Rain',
        message: `${precipitationProbability}% chance of rain. Bring an umbrella and plan accordingly.`,
        priority: 5,
        data: { precipitationProbability },
      });
    }

    // ACCUMULATED RAINFALL (Potential flooding)
    if (rainAccumulation >= 50) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Rain',
        title: '⚠️ EXTREME RAINFALL ALERT',
        message: `Dangerous rainfall accumulation of ${rainAccumulation.toFixed(
          1
        )}mm detected. SEVERE FLOODING LIKELY. Evacuate low-lying areas immediately.`,
        priority: 1,
        data: { rainAccumulation },
      });
    } else if (rainAccumulation >= 30) {
      this.addNotification({
        level: 'WARNING',
        category: 'Rain',
        title: '🌊 High Rainfall Accumulation',
        message: `${rainAccumulation.toFixed(
          1
        )}mm of rain has fallen. Flooding possible in vulnerable areas. Monitor water levels closely.`,
        priority: 2,
        data: { rainAccumulation },
      });
    }
  }

  // ============================================
  // 3. WIND ALERTS
  // ============================================
  private checkWindConditions(data: WeatherData): void {
    const { windSpeed, windGust, windDirection } = data;
    const windDirectionLabel = this.getWindDirectionLabel(windDirection);

    // DANGEROUS WIND GUSTS
    if (windGust >= 20) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Wind',
        title: '🌪️ DANGEROUS WIND ALERT',
        message: `Extreme wind gusts up to ${windGust.toFixed(1)} m/s (${(windGust * 3.6).toFixed(
          0
        )} km/h) from the ${windDirectionLabel}. SEVERE DAMAGE POSSIBLE. Stay indoors and away from windows.`,
        priority: 1,
        data: { windGust, windDirection },
      });
    } else if (windGust >= 15) {
      this.addNotification({
        level: 'WARNING',
        category: 'Wind',
        title: '💨 Strong Wind Gust Warning',
        message: `Strong wind gusts up to ${windGust.toFixed(1)} m/s (${(windGust * 3.6).toFixed(
          0
        )} km/h) expected from the ${windDirectionLabel}. Secure loose objects and avoid coastal areas.`,
        priority: 2,
        data: { windGust, windDirection },
      });
    }

    // SUSTAINED HIGH WINDS
    if (windSpeed >= 14) {
      this.addNotification({
        level: 'WARNING',
        category: 'Wind',
        title: '🌬️ High Wind Warning',
        message: `Sustained winds at ${windSpeed.toFixed(1)} m/s (${(windSpeed * 3.6).toFixed(
          0
        )} km/h) from the ${windDirectionLabel}. Dangerous conditions - falling trees and debris possible.`,
        priority: 2,
        data: { windSpeed, windDirection },
      });
    } else if (windSpeed >= 8) {
      this.addNotification({
        level: 'ADVISORY',
        category: 'Wind',
        title: '💨 Strong Wind Advisory',
        message: `Strong winds at ${windSpeed.toFixed(1)} m/s (${(windSpeed * 3.6).toFixed(
          0
        )} km/h) from the ${windDirectionLabel}. Secure lightweight objects outdoors.`,
        priority: 3,
        data: { windSpeed, windDirection },
      });
    }
  }

  // ============================================
  // 4. VISIBILITY ALERTS
  // ============================================
  private checkVisibilityConditions(data: WeatherData): void {
    const { visibility, rainIntensity } = data;

    // DANGEROUS VISIBILITY
    if (visibility < 0.2) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Visibility',
        title: '🚨 SEVERE VISIBILITY HAZARD',
        message: `Extremely low visibility (${(visibility * 1000).toFixed(
          0
        )}m). Travel NOT advised. If you must travel, use extreme caution and headlights.`,
        priority: 1,
        data: { visibility },
      });
    }
    // POOR VISIBILITY
    else if (visibility < 1) {
      this.addNotification({
        level: 'WARNING',
        category: 'Visibility',
        title: '🌫️ Poor Visibility Warning',
        message: `Low visibility at ${visibility.toFixed(1)} km due to ${
          rainIntensity > 0 ? 'heavy rain' : 'fog'
        }. Drive carefully and use headlights.`,
        priority: 2,
        data: { visibility },
      });
    }
    // REDUCED VISIBILITY
    else if (visibility < 4) {
      this.addNotification({
        level: 'ADVISORY',
        category: 'Visibility',
        title: '⚠️ Reduced Visibility',
        message: `Visibility reduced to ${visibility.toFixed(1)} km. Exercise caution while traveling.`,
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

    // Only alert if cloud cover is low (sun is visible)
    if (cloudCover < 70) {
      if (uvIndex >= 11) {
        this.addNotification({
          level: 'WARNING',
          category: 'UV',
          title: '🔆 EXTREME UV ALERT',
          message: `UV Index is ${uvIndex} (EXTREME). Severe risk of skin damage. Stay indoors between 11 AM-3 PM. If outside, use SPF 50+, wear protective clothing.`,
          priority: 2,
          data: { uvIndex },
        });
      } else if (uvIndex >= 8) {
        this.addNotification({
          level: 'ADVISORY',
          category: 'UV',
          title: '☀️ Very High UV Warning',
          message: `UV Index is ${uvIndex} (Very High). Minimize sun exposure. Wear sunscreen SPF 30+, hat, and sunglasses.`,
          priority: 3,
          data: { uvIndex },
        });
      } else if (uvIndex >= 6) {
        this.addNotification({
          level: 'INFO',
          category: 'UV',
          title: '🌞 High UV Advisory',
          message: `UV Index is ${uvIndex} (High). Sun protection recommended if staying outdoors for extended periods.`,
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

    // THUNDERSTORM
    if (weatherCode === 8000) {
      this.addNotification({
        level: 'WARNING',
        category: 'Storm',
        title: '⛈️ THUNDERSTORM ALERT',
        message: `Thunderstorm detected in your area. Stay indoors, avoid open fields and tall objects. Unplug electrical devices.`,
        priority: 2,
        data: { weatherCode },
      });
    }

    // COMBINED SEVERE WEATHER (High winds + Heavy rain)
    if (windSpeed >= 12 && rainIntensity >= 5) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Storm',
        title: '🌀 SEVERE STORM WARNING',
        message: `Dangerous storm conditions: Heavy rain (${rainIntensity.toFixed(
          1
        )} mm/h) with strong winds (${windSpeed.toFixed(
          1
        )} m/s). Stay indoors and away from windows. Flooding and damage likely.`,
        priority: 1,
        data: { windSpeed, rainIntensity },
      });
    }
  }

  // ============================================
  // 7. FLOOD RISK ASSESSMENT
  // ============================================
  private checkFloodRiskConditions(data: WeatherData): void {
    const { rainAccumulation, rainIntensity, precipitationProbability } = data;

    // HIGH FLOOD RISK (Multiple factors)
    if (rainAccumulation >= 25 && rainIntensity >= 5) {
      this.addNotification({
        level: 'CRITICAL',
        category: 'Flood',
        title: '🌊 FLOOD WARNING',
        message: `HIGH FLOOD RISK: ${rainAccumulation.toFixed(
          1
        )}mm accumulated with ongoing heavy rain (${rainIntensity.toFixed(
          1
        )} mm/h). Avoid low-lying areas and flooded roads. Do not attempt to cross flowing water.`,
        priority: 1,
        data: { rainAccumulation, rainIntensity },
      });
    }
    // MODERATE FLOOD RISK
    else if (rainAccumulation >= 15 && precipitationProbability >= 70) {
      this.addNotification({
        level: 'WARNING',
        category: 'Flood',
        title: '⚠️ Flood Watch',
        message: `Moderate flood risk: ${rainAccumulation.toFixed(
          1
        )}mm rain accumulated with more rain likely (${precipitationProbability}% chance). Monitor local waterways and be prepared to evacuate if needed.`,
        priority: 2,
        data: { rainAccumulation, precipitationProbability },
      });
    }
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
    const directions = ['North', 'NE', 'East', 'SE', 'South', 'SW', 'West', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
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
    };

    return weatherDescriptions[weatherCode] || 'Unknown Weather';
  }

  /**
   * Filter notifications by level
   */
  public filterByLevel(level: NotificationLevel): WeatherNotification[] {
    return this.notifications.filter(n => n.level === level);
  }

  /**
   * Get only critical and warning notifications
   */
  public getUrgentNotifications(): WeatherNotification[] {
    return this.notifications.filter(n => n.level === 'CRITICAL' || n.level === 'WARNING');
  }
}

// ============================================
// USAGE EXAMPLE
// ============================================

/*
// Initialize the system
const weatherNotifier = new WeatherNotificationSystem();

// Sample weather data from Tomorrow.io
const currentWeather: WeatherData = {
  temperature: 35,
  humidity: 78,
  precipitationProbability: 85,
  rainIntensity: 8.5,
  windSpeed: 6.5,
  weatherCode: 4201,
  uvIndex: 9,
  rainAccumulation: 28.3,
  windGust: 12.3,
  windDirection: 270,
  cloudCover: 75,
  temperatureApparent: 39,
  visibility: 1.2
};

// Check conditions and get notifications
const notifications = weatherNotifier.checkWeatherConditions(currentWeather);

// Display all notifications
console.log(`Found ${notifications.length} weather notifications:`);
notifications.forEach(notif => {
  console.log(`\n[${notif.level}] ${notif.title}`);
  console.log(notif.message);
});

// Get only urgent notifications
const urgent = weatherNotifier.getUrgentNotifications();
console.log(`\n${urgent.length} urgent notifications need immediate attention!`);

// Send to your notification service
// urgent.forEach(notif => sendPushNotification(notif));
*/
