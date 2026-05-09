import { HeaderBackButton } from '@/components/components/button/Button';
import { Text } from '@/components/ui/text';
import { API_ROUTES } from '@/config/endpoints';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { AnnouncementDataCard } from '@/types/components';
import axios from 'axios';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const handleBack = () => {
  router.back();
};

const formatAnnouncementDate = (createdAt: AnnouncementDataCard['createdAt']): string => {
  const seconds = createdAt?._seconds ?? createdAt?.seconds;

  if (typeof seconds !== 'number') {
    return 'Date unavailable';
  }

  return new Date(seconds * 1000).toLocaleString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const buildHtmlDocument = (htmlContent: string, isDark: boolean): string => {
  const textColor = isDark ? '#F2F2F2' : '#111827';
  const backgroundColor = isDark ? '#171717' : '#FFFFFF';
  const mutedColor = isDark ? '#A6A6A6' : '#6B7280';

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        margin: 0;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: ${textColor};
        background-color: ${backgroundColor};
        line-height: 1.6;
      }
      img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
      }
      h1, h2, h3, h4, h5, h6 {
        margin: 0 0 10px 0;
        color: ${textColor};
      }
      p {
        margin: 0 0 10px 0;
        color: ${textColor};
      }
      a {
        color: ${mutedColor};
      }
    </style>
  </head>
  <body>
    ${htmlContent || '<p>No content available.</p>'}
  </body>
</html>
  `;
};

const WEBVIEW_AUTO_HEIGHT_SCRIPT = `
  (function () {
    var lastHeight = 0;
    function postHeight() {
      var doc = document.documentElement;
      var body = document.body;
      if (!doc || !body || !window.ReactNativeWebView) return;

      var height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        doc.clientHeight,
        doc.scrollHeight,
        doc.offsetHeight
      );

      if (height && height !== lastHeight) {
        lastHeight = height;
        window.ReactNativeWebView.postMessage(String(height));
      }
    }

    function attachImageListeners() {
      var images = document.images;
      for (var i = 0; i < images.length; i++) {
        images[i].addEventListener('load', postHeight);
        images[i].addEventListener('error', postHeight);
      }
    }

    window.addEventListener('load', function () {
      attachImageListeners();
      postHeight();
      setTimeout(postHeight, 50);
      setTimeout(postHeight, 300);
    });

    window.addEventListener('resize', postHeight);

    var observer = new MutationObserver(function () {
      attachImageListeners();
      postHeight();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    attachImageListeners();
    postHeight();
  })();
  true;
`;

export const AnnouncementsScreen = () => {
  const { isDark } = useTheme();
  const { announcementId } = useLocalSearchParams<{ announcementId?: string | string[] }>();
  const [announcement, setAnnouncement] = useState<AnnouncementDataCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [webViewHeight, setWebViewHeight] = useState(200);

  const parsedAnnouncementId = useMemo(() => {
    if (Array.isArray(announcementId)) {
      return announcementId[0];
    }
    return announcementId;
  }, [announcementId]);

  useEffect(() => {
    const fetchAnnouncementDetails = async () => {
      if (!parsedAnnouncementId) {
        setErrorMessage('No announcement selected.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await axios.get(API_ROUTES.ANNOUNCEMENT.GET_ANNOUNCEMENT_DETAILS(parsedAnnouncementId));
        setAnnouncement(response.data);
      } catch (error) {
        console.error('Failed to fetch announcement details', error);
        setErrorMessage('Failed to load announcement details.');
        setAnnouncement(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncementDetails();
  }, [parsedAnnouncementId]);

  useEffect(() => {
    setWebViewHeight(200);
  }, [parsedAnnouncementId]);

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    const nextHeight = Number.parseInt(event.nativeEvent.data, 10);

    if (!Number.isFinite(nextHeight) || nextHeight <= 0) {
      return;
    }

    setWebViewHeight(currentHeight => {
      if (Math.abs(currentHeight - nextHeight) < 2) {
        return currentHeight;
      }
      return nextHeight;
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Announcement Details',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
          },
          headerTintColor: isDark ? Colors.text.dark : Colors.text.light,
          headerLeft: () => <HeaderBackButton router={handleBack} />,
        }}
      />

      {isLoading && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={isDark ? Colors.brand.dark : Colors.brand.light} />
          <Text size="sm" style={{ marginTop: 10 }}>
            Loading announcement...
          </Text>
        </View>
      )}

      {!isLoading && errorMessage && (
        <View style={styles.centerContent}>
          <Text size="sm" style={{ color: Colors.semantic.error }}>
            {errorMessage}
          </Text>
        </View>
      )}

      {!isLoading && !errorMessage && announcement && (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.headerCard,
              {
                borderColor: isDark ? Colors.border.dark : Colors.border.light,
                backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF',
              },
            ]}
          >
            {!!announcement.thumbnail && <Image source={{ uri: announcement.thumbnail }} style={styles.thumbnail} />}

            <Text size="lg" bold numberOfLines={2}>
              {announcement.title}
            </Text>

            <Text size="sm" style={{ color: isDark ? Colors.muted.dark.text : Colors.muted.light.text }}>
              {announcement.subtitle}
            </Text>

            <View style={styles.metaRow}>
              <Text size="xs" style={{ color: isDark ? Colors.muted.dark.text : Colors.muted.light.text }}>
                {formatAnnouncementDate(announcement.createdAt)}
              </Text>
              <Text
                size="xs"
                style={{ color: isDark ? Colors.muted.dark.text : Colors.muted.light.text, textTransform: 'uppercase' }}
              >
                {announcement.category}
              </Text>
            </View>
          </View>

          <WebView
            source={{ html: buildHtmlDocument(announcement.content, isDark) }}
            originWhitelist={['*']}
            startInLoadingState
            javaScriptEnabled
            injectedJavaScript={WEBVIEW_AUTO_HEIGHT_SCRIPT}
            onMessage={handleWebViewMessage}
            scrollEnabled={false}
            style={[
              styles.webView,
              {
                height: webViewHeight,
                backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
              },
            ]}
          />
        </ScrollView>
      )}
    </View>
  );
};

export default AnnouncementsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerCard: {
    borderWidth: 1,
    borderRadius: 12,
    margin: 16,
    marginBottom: 10,
    padding: 12,
    gap: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  webView: {
    width: '100%',
  },
  thumbnail: {
    width: '100%',
    height: 170,
    borderRadius: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
});
