import { IconButton } from '@/components/components/button/Button';
import { Card } from '@/components/components/card/Card';
import { Badge, BadgeText } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { EvacuationCenter } from '@/types/components';
import { House, MapPin, Phone, UsersRound, X } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
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

const DetailsCard: React.FC<DetailsCardProps> = ({ selectedMarker, isDark, onClose }) => {
  if (!selectedMarker) return null;

  const data = selectedMarker.images
    ? selectedMarker.images.map((imageUri: string, index: number) => ({
        uri: imageUri,
      }))
    : [];

  const renderItem = ({ item, index }: { item: Images; index: number }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
          borderColor: isDark ? Colors.border.dark : Colors.border.light,
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
    >
      <Image source={{ uri: item.uri }} style={styles.carouselImage} resizeMode="cover" />
    </View>
  );
  return (
    <Card style={styles.detailBox}>
      {/* Header row: title and close button */}
      <View style={styles.detailHeaderRow}>
        <Text style={[styles.title, { fontSize: 16 }]}>Center Details</Text>
        <IconButton onPress={onClose}>
          <X size={20} color={isDark ? Colors.text.dark : Colors.text.light} />
        </IconButton>
      </View>
      {/* Name and status badge row */}
      <View style={styles.detailNameRow}>
        <Text size="md" bold>
          {selectedMarker.name}
        </Text>
        <Badge
          size="sm"
          variant="solid"
          style={styles.detailBadge}
          action={
            ({ available: 'success', full: 'warning', closed: 'error' }[selectedMarker.status] as
              | 'success'
              | 'warning'
              | 'error'
              | 'info'
              | 'muted'
              | undefined) || 'error'
          }
        >
          <BadgeText style={{ padding: 4 }}>{selectedMarker.status}</BadgeText>
        </Badge>
      </View>
      {/* Location row - styled to match location field */}
      <View style={styles.detailLocationRow}>
        <View style={styles.detailLocationIconBox}>
          <MapPin color={isDark ? Colors.icons.dark : Colors.icons.light} size={20} />
        </View>
        <Text style={styles.detailLabelText}>Location: </Text>
        <Text style={[styles.detailLocationText, styles.detailWrapText]} numberOfLines={0} ellipsizeMode="tail">
          {selectedMarker.location}
        </Text>
      </View>
      {/* Other details */}
      <View style={styles.detailLocationRow}>
        <View style={styles.detailLocationIconBox}>
          <UsersRound color={isDark ? Colors.icons.dark : Colors.icons.light} size={20} />
        </View>
        <Text style={styles.detailLabelText}>Capacity: </Text>
        <Text style={[styles.detailLocationText, styles.detailWrapText]} numberOfLines={0} ellipsizeMode="tail">
          {selectedMarker.capacity}
        </Text>
      </View>
      <View style={styles.detailLocationRow}>
        <View style={styles.detailLocationIconBox}>
          <House color={isDark ? Colors.icons.dark : Colors.icons.light} size={20} />
        </View>
        <Text style={styles.detailLabelText}>Type: </Text>
        <Text style={[styles.detailLocationText, styles.detailWrapText]} numberOfLines={0} ellipsizeMode="tail">
          {selectedMarker.type}
        </Text>
      </View>
      <View style={styles.detailLocationRow}>
        <View style={styles.detailLocationIconBox}>
          <Phone color={isDark ? Colors.icons.dark : Colors.icons.light} size={20} />
        </View>
        <Text style={styles.detailLabelText}>Contact: </Text>
        <Text style={[styles.detailLocationText, styles.detailWrapText]} numberOfLines={0} ellipsizeMode="tail">
          {selectedMarker.contact}
        </Text>
      </View>
      <View style={styles.detailLocationRow}>
        <Text style={[styles.detailLocationText, styles.detailWrapText]} numberOfLines={0} ellipsizeMode="tail">
          {selectedMarker.description}
        </Text>
      </View>
      {/* Images */}
      {/* {selectedMarker.images && selectedMarker.images.length > 0 && (
        <View style={styles.detailImagesRow}>
          {selectedMarker.images.map((imageUri: string, index: number) => (
            <Image key={index} source={{ uri: imageUri }} style={styles.detailImage} resizeMode="cover" />
          ))}
        </View>
      )} */}

      <Carousel
        loop={false}
        width={screenWidth * 0.85}
        height={200}
        data={data}
        scrollAnimationDuration={200}
        renderItem={renderItem}
        style={{ alignSelf: 'center' }}
        
      />
    </Card>
  );
};

export default DetailsCard;

const styles = StyleSheet.create({
  detailBox: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailBadge: {
    borderRadius: 8,
    padding: 4,
  },
  detailLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
    borderRadius: 8,
    paddingVertical: 6,
  },
  detailLocationIconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLocationText: {
    fontSize: 15,
    color: Colors.text.dark,
    fontWeight: '500',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  detailWrapText: {
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  detailLabelText: {
    fontSize: 15,
    fontWeight: '400',
    marginRight: 2,
  },
  carouselImage: {
    width: screenWidth * 0.7,
    height: 200,
    borderRadius: 12,
  },
  title: { marginBottom: 5 },
  card: {
    width: screenWidth * 0.7,
    borderWidth: 1,
    borderRadius: 16,
  },
});
