import { IconButton } from '@/components/components/button/Button';
import { Card } from '@/components/components/card/Card';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { EvacuationCenter } from '@/types/components';
import { Image } from 'expo-image';
import { Chip } from 'heroui-native';
import { House, ImageOff, MapPin, Phone, UsersRound, X } from 'lucide-react-native';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const screenWidth = Dimensions.get('window').width;

interface DetailsCardProps {
  selectedMarker: EvacuationCenter;
  isDark: boolean;
  onClose: () => void;
}

interface Images {
  uri: string;
}

const STANDARD_IMAGE_WIDTH = 960;
const STANDARD_IMAGE_QUALITY = 72;

const getStandardQualityImageUri = (uri: string) => {
  try {
    const url = new URL(uri);
    const publicObjectPath = '/storage/v1/object/public/';
    const signedObjectPath = '/storage/v1/object/sign/';

    if (url.pathname.includes(publicObjectPath)) {
      url.pathname = url.pathname.replace(publicObjectPath, '/storage/v1/render/image/public/');
    } else if (url.pathname.includes(signedObjectPath)) {
      url.pathname = url.pathname.replace(signedObjectPath, '/storage/v1/render/image/sign/');
    } else if (!url.pathname.includes('/storage/v1/render/image/')) {
      return uri;
    }

    url.searchParams.set('width', String(STANDARD_IMAGE_WIDTH));
    url.searchParams.set('quality', String(STANDARD_IMAGE_QUALITY));
    url.searchParams.set('resize', 'cover');

    return url.toString();
  } catch {
    return uri;
  }
};

const ProgressiveEvacuationImage = ({ uri, isActive }: { uri: string; isActive: boolean }) => {
  const standardUri = React.useMemo(() => getStandardQualityImageUri(uri), [uri]);
  const hasOptimizedVariant = standardUri !== uri;
  const [standardLoaded, setStandardLoaded] = React.useState(!hasOptimizedVariant);
  const [standardFailed, setStandardFailed] = React.useState(false);
  const [showOriginal, setShowOriginal] = React.useState(!hasOptimizedVariant);

  React.useEffect(() => {
    setStandardLoaded(!hasOptimizedVariant);
    setStandardFailed(false);
    setShowOriginal(!hasOptimizedVariant);
  }, [hasOptimizedVariant, standardUri, uri]);

  React.useEffect(() => {
    let isCancelled = false;

    if (!hasOptimizedVariant || !standardLoaded || !isActive || standardFailed) {
      return;
    }

    Image.prefetch(uri, 'memory-disk')
      .then(prefetched => {
        if (!isCancelled && prefetched) {
          setShowOriginal(true);
        }
      })
      .catch(() => {
        // Keep the standard-quality image visible when the original cannot be prefetched.
      });

    return () => {
      isCancelled = true;
    };
  }, [hasOptimizedVariant, isActive, standardFailed, standardLoaded, uri]);

  const sourceUri = showOriginal || standardFailed ? uri : standardUri;
  const imageQualityKey = showOriginal || standardFailed ? 'original' : 'standard';

  return (
    <Image
      source={{ uri: sourceUri }}
      placeholder={showOriginal && hasOptimizedVariant ? { uri: standardUri } : undefined}
      placeholderContentFit="cover"
      style={styles.carouselImage}
      contentFit="cover"
      cachePolicy="memory-disk"
      priority={isActive ? 'high' : 'low'}
      transition={180}
      recyclingKey={`${uri}-${imageQualityKey}`}
      onLoad={() => {
        if (!showOriginal) {
          setStandardLoaded(true);
        }
      }}
      onError={() => {
        if (!showOriginal && hasOptimizedVariant) {
          setStandardFailed(true);
        }
      }}
    />
  );
};

const DetailsCard: React.FC<DetailsCardProps> = ({ selectedMarker, isDark, onClose }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [selectedMarker?.id]);

  if (!selectedMarker) return null;

  const data = selectedMarker.images
    ? selectedMarker.images.map((imageUri: string, index: number) => ({
        uri: imageUri,
      }))
    : [];

  const renderItem = ({ item, index }: { item: Images; index: number }) => (
    <View style={styles.carouselItemContainer}>
      <ProgressiveEvacuationImage uri={item.uri} isActive={index === activeIndex} />
    </View>
  );

  return (
    <Card style={[styles.detailBox, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
      {data.length > 0 ? (
        <View style={styles.carouselContainer}>
          <Carousel
            loop={false}
            width={screenWidth}
            height={220}
            data={data}
            scrollAnimationDuration={300}
            renderItem={renderItem}
            onSnapToItem={index => setActiveIndex(index)}
            pagingEnabled
          />
          {/* Pagination dots */}
          {data.length > 1 && (
            <View style={styles.paginationContainer}>
              {data.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor:
                        index === activeIndex ? Colors.brand.dark : isDark ? Colors.border.dark : Colors.border.light,
                      opacity: index === activeIndex ? 1 : 0.5,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View
          style={[
            styles.carouselContainer,
            styles.noImageContainer,
            { backgroundColor: isDark ? Colors.muted.dark.background : Colors.muted.light.background },
          ]}
        >
          <ImageOff size={48} color={isDark ? Colors.icons.dark : Colors.icons.light} opacity={0.5} />
          <Text size="sm" style={[styles.noImageText, { color: isDark ? Colors.text.dark : Colors.text.light }]}>
            No image available
          </Text>
        </View>
      )}

      {/* Close button */}
      <IconButton onPress={onClose} style={styles.closeButton}>
        <X size={22} color={Colors.text.dark} />
      </IconButton>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Name and status badge row */}
        <View style={styles.detailNameRow}>
          <Text size="lg" bold style={{ flex: 1 }}>
            {selectedMarker.name}
          </Text>
          <Chip
            size="sm"
            variant="primary"
            style={styles.detailBadge}
            color={
              { available: 'success', full: 'warning', closed: 'danger' }[selectedMarker.status] as
                | 'success'
                | 'warning'
                | 'danger'
                | 'default'
                | undefined
            }
          >
            <Text bold style={{ color: 'white' }}>{selectedMarker.status.toUpperCase()}</Text>
          </Chip>
        </View>

        {/* Description */}
        {selectedMarker.description && (
          <Text style={styles.descriptionText} numberOfLines={3} ellipsizeMode="tail">
            {selectedMarker.description}
          </Text>
        )}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: isDark ? Colors.border.dark : Colors.border.light }]} />

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {/* Location */}
          <View style={styles.detailItem}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? Colors.muted.dark.background : Colors.muted.light.background },
              ]}
            >
              <MapPin color={isDark ? Colors.icons.dark : Colors.icons.light} size={18} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text size="xs" emphasis="light" style={styles.detailLabel}>
                Location
              </Text>
              <Text size="sm" bold numberOfLines={2} ellipsizeMode="tail">
                {selectedMarker.location}
              </Text>
            </View>
          </View>

          {/* Capacity */}
          <View style={styles.detailItem}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? Colors.muted.dark.background : Colors.muted.light.background },
              ]}
            >
              <UsersRound color={isDark ? Colors.icons.dark : Colors.icons.light} size={18} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text size="xs" emphasis="light" style={styles.detailLabel}>
                Capacity
              </Text>
              <Text size="sm" bold>
                {selectedMarker.capacity} people
              </Text>
            </View>
          </View>

          {/* Type */}
          <View style={styles.detailItem}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? Colors.muted.dark.background : Colors.muted.light.background },
              ]}
            >
              <House color={isDark ? Colors.icons.dark : Colors.icons.light} size={18} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text size="xs" emphasis="light" style={styles.detailLabel}>
                Type
              </Text>
              <Text size="sm" bold>
                {selectedMarker.type}
              </Text>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.detailItem}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isDark ? Colors.muted.dark.background : Colors.muted.light.background },
              ]}
            >
              <Phone color={isDark ? Colors.icons.dark : Colors.icons.light} size={18} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text size="xs" emphasis="light" style={styles.detailLabel}>
                Contact
              </Text>
              <Text size="sm" bold numberOfLines={1}>
                {selectedMarker.contact}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
};

export default DetailsCard;

const styles = StyleSheet.create({
  detailBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 20,
    zIndex: 50,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    overflow: 'hidden',
    paddingTop: 0,
  },
  carouselContainer: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
  },
  carouselItemContainer: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  contentContainer: {
    paddingTop: 16,
  },
  detailNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  detailBadge: {
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTextContainer: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noImageContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  noImageText: {
    opacity: 0.6,
  },
});
