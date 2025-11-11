import { useCoords } from '@/components/store/useCoords';
import { Fab } from '@/components/ui/fab';
import Body from '@/components/ui/layout/Body';
import { SaveLocationMap } from '@/components/ui/map/SaveLocationMap';
import { Text } from '@/components/ui/text';
import { Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';

type ItemData = {
  id: string;
  title: string;
};

const DATA: ItemData[] = [
  {
    id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
    title: 'First Item',
  },
  {
    id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
    title: 'Second Item',
  },
  {
    id: '58694a.k1f-bd96-145571e29d72',
    title: 'Third Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-145571e29d72',
    title: 'Third Item',
  },
  {
    id: '586assf5571e29d72',
    title: 'Third Item',
  },
  {
    id: '5agdfg96-asd72',
    title: 'Third Item',
  },
  {
    id: '58eg471f-bd96-14557gfd72',
    title: 'Third Item',
  },
  {
    id: '58694aiuti1f-bd96-1were29d72',
    title: 'Third Item',
  },
  {
    id: '5869asdf-bd96-1455bgvhnd72',
    title: 'Third Item',
  },
];

type ItemProps = {
  item: ItemData;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
  mapContainer?: React.ReactNode;
};

const Item = ({ item, onPress, backgroundColor, textColor, mapContainer }: ItemProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.item, { backgroundColor }]}>
    <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
    <View>{/* {mapContainer} */}</View>
  </TouchableOpacity>
);

const index = () => {
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const setCoords = useCoords(state => state.setCoords);

  const handleLocationSelect = (coordinates: [number, number]) => {
    setSelectedLocation(coordinates);
    setCoords(coordinates);
    console.log('Selected location:', coordinates);
  };

  const renderItem = ({ item }: { item: ItemData }) => {
    const backgroundColor = item.id === selectedId ? '#6e3b6e' : '#f9c2ff';
    const color = item.id === selectedId ? 'white' : 'black';

    return (
      <Item
        item={item}
        onPress={() => setSelectedId(item.id)}
        backgroundColor={backgroundColor}
        textColor={color}
        // mapContainer={mapContainer}
      />
    );
  };

  return (
    <>
      <Body>
        <View>
          <Text size="3xl" bold>
            Saved Locations
          </Text>
        </View>
        {/* <View style={{ flex: 1, height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <Text size='sm' emphasis='light'>
            No Save Locations yet.
          </Text>
        </View> */}
        {/* <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
              <FlatList
                data={DATA}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                extraData={selectedId}
                scrollEnabled={false}
              />
            </SafeAreaView>
          </SafeAreaProvider> */}
        <View style={styles.mapWrapper} key="map-container">
          <SaveLocationMap onLocationSelect={handleLocationSelect} />
        </View>
        <View style={styles.mapWrapper} key="map-container2">
          <SaveLocationMap onLocationSelect={handleLocationSelect} />
        </View>
      </Body>
      <Fab
        size="lg"
        placement="bottom right"
        onPress={() => {
          if (selectedLocation) {
            Alert.alert(
              'Save Location',
              `Save this location?\nCoordinates: ${selectedLocation[1].toFixed(6)}, ${selectedLocation[0].toFixed(6)}`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Save', onPress: () => console.log('Location saved:', selectedLocation) },
              ]
            );
          } else {
            Alert.alert('No Location Selected', 'Please tap on the map to select a location first.');
          }
        }}
        isHovered={false}
        isDisabled={false}
        isPressed={false}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          elevation: 8,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          backgroundColor: selectedLocation ? '#22c55e' : '#3b82f6', // Green when location selected
        }}
      >
        <Plus size={30} color="white" />
      </Fab>
    </>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: (StatusBar.currentHeight || 0) + 10,
    height: '100%',
    width: '100%',
  },
  mapWrapper: {
    flex: 1,
    width: '100%',
    marginTop: 20,
  },
  item: {
    padding: 20,
    marginVertical: 8,
    height: 'auto',
    width: '100%',
  },
  title: {
    fontSize: 32,
  },
});
