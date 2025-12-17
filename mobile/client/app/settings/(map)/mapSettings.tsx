import Body from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useMap } from '@/contexts/MapContext';
import { useTheme } from '@/contexts/ThemeContext';
import MapboxGL from '@rnmapbox/maps';
import { Check } from 'lucide-react-native';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

const MapSettings = () => {
  const { isDark } = useTheme();
  const { mapStyle, setMapStyle } = useMap();

  const mapOptions = [
    {
      label: 'Default',
      value: MapboxGL.StyleURL.Street,
      image: require('@/assets/images/map/light-map.png'),
    },
    {
      label: 'Satellite',
      value: MapboxGL.StyleURL.SatelliteStreet,
      image: require('@/assets/images/map/satelite-map.png'),
    },
    {
      label: 'Dark',
      value: MapboxGL.StyleURL.Dark,
      image: require('@/assets/images/map/dark-map.png'),
    },
  ];

  return (
    <Body style={{ padding: 0 }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? Colors.text.dark : Colors.text.light }]}>Map Style</Text>
      </View>

      <View style={styles.container}>
        {mapOptions.map(option => {
          const isSelected = mapStyle === option.value;

          return (
            <Pressable
              key={option.label}
              onPress={() => setMapStyle(option.value)}
              style={[
                styles.optionCard,
                {
                  borderColor: isSelected ? Colors.brand.light : isDark ? Colors.border.dark : Colors.border.light,
                  backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
                },
              ]}
            >
              <Image source={option.image} style={styles.mapPreview} />

              <View style={styles.labelContainer}>
                <Text style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>{option.label}</Text>
                {isSelected && (
                  <View style={styles.checkIcon}>
                    <Check size={16} color="white" />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Body>
  );
};

export default MapSettings;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  container: {
    paddingHorizontal: 20,
    gap: 16,
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPreview: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  checkIcon: {
    backgroundColor: Colors.brand.light,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
