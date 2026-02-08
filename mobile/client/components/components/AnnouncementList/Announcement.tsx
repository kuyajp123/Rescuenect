import { Text } from '@/components/ui/text';
import { API_ROUTES } from '@/config/endpoints';
import { useTheme } from '@/contexts/ThemeContext';
import { AnnouncementDataCard } from '@/types/components';
import axios from 'axios';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, View } from 'react-native';

const formatAnnouncementDate = (createdAt: AnnouncementDataCard['createdAt']): string => {
  const seconds = createdAt?._seconds ?? createdAt?.seconds;

  if (typeof seconds !== 'number') {
    return 'Date unavailable';
  }

  return new Date(seconds * 1000).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const Announcement = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<AnnouncementDataCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const getAnnouncements = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await axios.get(API_ROUTES.ANNOUNCEMENT.GET_ANNOUNCEMENTS);
        const payload = Array.isArray(response.data) ? response.data : [];

        setAnnouncements(payload);
      } catch (error) {
        console.error('Failed to fetch announcements', error);
        setErrorMessage('Failed to fetch announcements');
        setAnnouncements([]);
      } finally {
        setIsLoading(false);
      }
    };

    getAnnouncements();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={isDark ? '#3B82F6' : '#1D4ED8'} />
        <Text size="sm" style={[styles.loadingText, { color: isDark ? '#FFFFFF' : '#1F2937' }]}>
          Loading announcements...
        </Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.errorContainer}>
          <Text size="md" bold style={styles.errorTitle}>
            Oops!
          </Text>
          <Text size="sm" style={styles.errorText}>
            {errorMessage}
          </Text>
          <Text size="xs" style={styles.errorSubtext}>
            Please try again later
          </Text>
        </View>
      </View>
    );
  }

  if (!announcements.length) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.emptyContainer}>
          <Text size="lg" style={styles.emptyEmoji}>
            📢
          </Text>
          <Text size="md" bold style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#1F2937' }]}>
            No announcements yet
          </Text>
          <Text size="sm" style={[styles.emptySubtext, { color: isDark ? '#D1D5DB' : '#6B7280' }]}>
            Stay tuned for updates!
          </Text>
        </View>
      </View>
    );
  }

  const handleAnnouncementPress = (announcementId: string) => {
    // Navigate to announcement detail page
    router.push({
      pathname: '/announcements',
      params: { announcementId: announcementId },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F9FAFB' }]}>
      <View style={styles.header}>
        <Text size="lg" bold style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#1F2937' }]}>
          📢 Announcements
        </Text>
        <Text size="sm" style={[styles.headerSubtitle, { color: isDark ? '#D1D5DB' : '#6B7280' }]}>
          {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {announcements.map((announcement, index) => (
        <React.Fragment key={announcement.id + index}>
          <Pressable
            onPress={() => handleAnnouncementPress(announcement.id)}
            style={({ pressed }) => [
              styles.announcementCard,
              {
                backgroundColor: isDark ? '#374151' : '#FFFFFF',
                borderColor: isDark ? '#4B5563' : '#E5E7EB',
                transform: [{ scale: pressed ? 0.98 : 1 }],
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.textContent}>
                <Text
                  size="md"
                  bold
                  style={[styles.announcementTitle, { color: isDark ? '#FFFFFF' : '#1F2937' }]}
                  numberOfLines={2}
                >
                  {announcement.title}
                </Text>
                <Text
                  size="sm"
                  style={[styles.announcementSubtitle, { color: isDark ? '#E5E7EB' : '#4B5563' }]}
                  numberOfLines={2}
                >
                  {announcement.subtitle}
                </Text>
                <Text size="xs" style={[styles.announcementDate, { color: isDark ? '#60A5FA' : '#2563EB' }]}>
                  {formatAnnouncementDate(announcement.createdAt)}
                </Text>
              </View>
              <View style={styles.imageContent}>
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: announcement.thumbnail }}
                    contentFit="cover"
                    transition={200}
                    style={styles.thumbnail}
                  />
                </View>
              </View>
            </View>
          </Pressable>
          
          {/* Add divider between announcements, but not after the last one */}
          {index < announcements.length - 1 && (
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: isDark ? '#4B5563' : '#E5E7EB' }]} />
            </View>
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(156, 163, 175, 0.3)',
  },
  headerTitle: {
    fontSize: 20,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  announcementCard: {
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textContent: {
    flex: 1,
    marginRight: 12,
  },
  announcementTitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6,
    fontWeight: '600',
  },
  announcementSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontWeight: '400',
  },
  announcementDate: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  imageContent: {
    alignItems: 'center',
  },
  thumbnailContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.2)',
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorTitle: {
    color: '#ef4444',
    marginBottom: 8,
    fontSize: 18,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 4,
  },
  errorSubtext: {
    color: '#ef4444',
    textAlign: 'center',
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
  },
  dividerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
    maxWidth: 200,
    opacity: 0.3,
  },
});

export default Announcement;
