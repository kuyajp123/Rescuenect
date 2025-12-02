// ============================================
// NOTIFICATION SYSTEM USAGE EXAMPLES
// ============================================

import { initializeFirebase } from './firestore-client.ts';
import { NotificationService } from './notification-service.ts';

// Initialize the service
const db = initializeFirebase();
const notificationService = new NotificationService(db);

// ============================================
// EXAMPLE 1: Create Weather Notification
// ============================================

async function exampleCreateWeatherNotification() {
  const notificationId = await notificationService.createWeatherNotification({
    title: '🔥 Extreme Heat Warning',
    message: 'Heat index has reached 42°C. Stay indoors and keep hydrated.',
    location: 'central_naic',
    audience: 'both',
    sentTo: 150,
    weatherData: {
      weatherType: 'current',
      severity: 'CRITICAL',
      category: 'Heat',
      temperature: 38,
      temperatureApparent: 42,
      humidity: 75,
      uvIndex: 11,
      priority: 1,
      source: 'weather_api',
    },
    deliveryStatus: {
      success: 148,
      failure: 2,
      errors: ['Invalid token: abc123', 'Token expired: xyz789'],
    },
  });

  console.log('Weather notification created:', notificationId);
  // Output: weather_central_naic_1701513600000
}

// ============================================
// EXAMPLE 2: Create Earthquake Notification
// ============================================

async function exampleCreateEarthquakeNotification() {
  const notificationId = await notificationService.createEarthquakeNotification({
    title: '🚨 CRITICAL EARTHQUAKE - Magnitude 6.5',
    message: 'CRITICAL: Magnitude 6.5 earthquake 25km SE of Naic, Cavite at 3:45 PM. TAKE IMMEDIATE SHELTER!',
    location: 'central_naic',
    audience: 'both',
    sentTo: 500,
    earthquakeData: {
      earthquakeId: 'us7000k9h2',
      magnitude: 6.5,
      place: '25km SE of Naic, Cavite',
      coordinates: {
        latitude: 14.3167,
        longitude: 120.7667,
        depth: 15.2,
      },
      severity: 'strong',
      tsunamiWarning: false,
      priority: 'critical',
      usgsUrl: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000k9h2',
      source: 'usgs',
      distanceFromNaic: 25,
    },
    deliveryStatus: {
      success: 495,
      failure: 5,
    },
  });

  console.log('Earthquake notification created:', notificationId);
  // Output: earthquake_central_naic_1701513600000
}

// ============================================
// EXAMPLE 3: Create Announcement Notification
// ============================================

async function exampleCreateAnnouncementNotification() {
  const notificationId = await notificationService.createAnnouncementNotification({
    title: '📢 Community Health Event',
    message: 'Free health screening at Barangay Hall this Saturday, 8AM-5PM. All residents are welcome!',
    location: 'central_naic',
    audience: 'users',
    sentTo: 300,
    announcementData: {
      category: 'event',
      priority: 'medium',
      expiresAt: new Date('2024-12-10').toISOString(),
      imageUrl: 'https://example.com/health-event.jpg',
      actionUrl: 'https://example.com/register',
      actionLabel: 'Register Now',
      source: 'admin',
      metadata: {
        eventDate: '2024-12-07',
        eventLocation: 'Central Naic Barangay Hall',
        organizer: 'Naic Health Office',
      },
    },
    deliveryStatus: {
      success: 298,
      failure: 2,
    },
  });

  console.log('Announcement notification created:', notificationId);
}

// ============================================
// EXAMPLE 4: Query Notifications
// ============================================

async function exampleQueryNotifications() {
  // Get all weather notifications from last 24 hours
  const weatherNotifications = await notificationService.queryNotifications({
    type: 'weather',
    startTime: Date.now() - 24 * 60 * 60 * 1000,
    limit: 50,
  });

  console.log(`Found ${weatherNotifications.length} weather notifications`);

  // Get critical notifications from specific location
  const criticalNotifications = await notificationService.queryNotifications({
    location: 'coastal_west',
    severity: ['CRITICAL', 'WARNING'],
    startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
  });

  console.log(`Found ${criticalNotifications.length} critical notifications`);

  // Get unread notifications for a user
  const unreadNotifications = await notificationService.queryNotifications({
    userId: 'user123',
    onlyUnread: true,
    excludeHidden: true,
    limit: 20,
  });

  console.log(`User has ${unreadNotifications.length} unread notifications`);

  // Get notifications for specific barangay
  const barangayNotifications = await notificationService.getNotificationsForBarangay('sabang', 30);
  console.log(`Sabang has ${barangayNotifications.length} notifications`);
}

// ============================================
// EXAMPLE 5: Mark Notifications as Read/Hidden
// ============================================

async function exampleMarkNotifications() {
  const userId = 'user123';
  const notificationId = 'weather_central_naic_1701513600000';

  // Mark single notification as read
  await notificationService.markAsRead(notificationId, userId);

  // Mark notification as hidden
  await notificationService.markAsHidden(notificationId, userId);

  // Bulk mark as read
  const notificationIds = [
    'weather_coastal_west_1701513600000',
    'weather_coastal_east_1701513700000',
    'earthquake_central_naic_1701513800000',
  ];
  await notificationService.bulkMarkAsRead(notificationIds, userId);

  // Unhide a notification
  await notificationService.unhideNotification(notificationId, userId);

  // Mark as unread
  await notificationService.markAsUnread(notificationId, userId);
}

// ============================================
// EXAMPLE 6: Get Statistics
// ============================================

async function exampleGetStatistics() {
  // Get overall stats for last 30 days
  const stats = await notificationService.getStats({
    startTime: Date.now() - 30 * 24 * 60 * 60 * 1000,
  });

  console.log('Notification Statistics:');
  console.log(`Total: ${stats.total}`);
  console.log('By Type:', stats.byType);
  console.log('By Location:', stats.byLocation);
  console.log('By Severity:', stats.bySeverity);

  // Get stats for specific user
  const userStats = await notificationService.getStats({
    userId: 'user123',
    startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
  });

  console.log(`User unread count: ${userStats.unreadCount}`);

  // Get unread count
  const unreadCount = await notificationService.getUnreadCount('user123');
  console.log(`User has ${unreadCount} unread notifications`);
}

// ============================================
// EXAMPLE 7: Get Recent Critical Notifications
// ============================================

async function exampleGetCriticalNotifications() {
  // Get critical notifications from last 24 hours
  const criticalNotifications = await notificationService.getRecentCriticalNotifications(24, 10);

  console.log(`Found ${criticalNotifications.length} critical notifications:`);
  criticalNotifications.forEach(n => {
    console.log(`- [${n.type.toUpperCase()}] ${n.title}`);
    console.log(`  Location: ${n.location}, Sent to: ${n.sentTo} users`);
    console.log(`  Time: ${new Date(n.timestamp).toLocaleString()}`);
  });
}

// ============================================
// EXAMPLE 8: Cleanup Old Notifications
// ============================================

async function exampleCleanupOldNotifications() {
  // Delete notifications older than 30 days
  const deletedCount = await notificationService.cleanupOldNotifications(30);
  console.log(`Cleaned up ${deletedCount} old notifications`);

  // Delete notifications older than 90 days
  const deletedCount90 = await notificationService.cleanupOldNotifications(90);
  console.log(`Cleaned up ${deletedCount90} very old notifications`);
}

// ============================================
// EXAMPLE 9: Admin Operations
// ============================================

async function exampleAdminOperations() {
  // Get a single notification
  const notification = await notificationService.getNotification('weather_central_naic_1701513600000');

  if (notification) {
    console.log('Notification details:', notification);
    console.log(`Read by ${notification.readBy?.length || 0} users`);
    console.log(`Hidden by ${notification.hiddenBy?.length || 0} users`);
  }

  // Delete a single notification
  await notificationService.deleteNotification('old_notification_id');

  // Bulk delete notifications
  const idsToDelete = ['weather_coastal_west_1701000000000', 'weather_coastal_east_1701000000001'];
  await notificationService.bulkDeleteNotifications(idsToDelete);
}

// ============================================
// EXAMPLE 10: Query by Multiple Criteria
// ============================================

async function exampleAdvancedQueries() {
  // Get all earthquake and weather notifications from multiple locations
  const multiTypeNotifications = await notificationService.queryNotifications({
    type: ['earthquake', 'weather'],
    location: ['central_naic', 'coastal_west', 'coastal_east'],
    startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
    limit: 100,
  });

  console.log(`Found ${multiTypeNotifications.length} notifications`);

  // Get all notifications sent to users (not admin)
  const userNotifications = await notificationService.queryNotifications({
    audience: 'users',
    startTime: Date.now() - 24 * 60 * 60 * 1000,
  });

  console.log(`Found ${userNotifications.length} user-targeted notifications`);

  // Complex filter: Unread weather warnings from last 48 hours
  const unreadWarnings = await notificationService.queryNotifications({
    type: 'weather',
    severity: ['CRITICAL', 'WARNING'],
    userId: 'user123',
    onlyUnread: true,
    excludeHidden: true,
    startTime: Date.now() - 48 * 60 * 60 * 1000,
  });

  console.log(`User has ${unreadWarnings.length} unread weather warnings`);
}

// ============================================
// USAGE IN WEATHER NOTIFICATION PROCESSOR
// ============================================

export async function saveWeatherNotificationExample(
  weatherNotification: any,
  location: string,
  audience: 'admin' | 'users' | 'both',
  fcmResult: { success: number; failure: number; errors: string[] }
) {
  const notificationService = new NotificationService(db);

  await notificationService.createWeatherNotification({
    title: weatherNotification.title,
    message: weatherNotification.message,
    location,
    audience,
    sentTo: fcmResult.success + fcmResult.failure,
    weatherData: {
      weatherType: 'current',
      severity: weatherNotification.level,
      category: weatherNotification.category,
      priority: weatherNotification.priority,
      source: 'weather_api',
      temperature: weatherNotification.data?.temperature,
      humidity: weatherNotification.data?.humidity,
      rainIntensity: weatherNotification.data?.rainIntensity,
      windSpeed: weatherNotification.data?.windSpeed,
    },
    deliveryStatus: fcmResult,
  });
}

// Export all examples
export {
  exampleAdminOperations,
  exampleAdvancedQueries,
  exampleCleanupOldNotifications,
  exampleCreateAnnouncementNotification,
  exampleCreateEarthquakeNotification,
  exampleCreateWeatherNotification,
  exampleGetCriticalNotifications,
  exampleGetStatistics,
  exampleMarkNotifications,
  exampleQueryNotifications,
};
