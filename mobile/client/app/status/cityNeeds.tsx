// import Body from '@/components/ui/layout/Body';
// import React from "react";
// import { View, StyleSheet } from "react-native";


// const cityNeeds = () => {

//   return (
//     <Body>
//     <View style={styles.markerContainer}>
//       <View style={styles.markerPin} />
//       <View style={styles.markerTail} />
//     </View>
//     </Body>
//   )
// }

// export default cityNeeds

// const styles = StyleSheet.create({
//   markerContainer: {
//     alignItems: 'center',
//   },
//   markerPin: {
//     width: 30,
//     height: 30,
//     backgroundColor: 'white',
//     borderRadius: 15,
//     borderWidth: 10,
//     borderColor: 'red',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   markerTail: {
//     width: 0,
//     height: 0,
//     backgroundColor: 'transparent',
//     borderStyle: 'solid',
//     borderTopWidth: 10,
//     borderRightWidth: 8,
//     borderBottomWidth: 0,
//     borderLeftWidth: 8,
//     borderTopColor: 'red',
//     borderRightColor: 'transparent',
//     borderBottomColor: 'transparent',
//     borderLeftColor: 'transparent',
//     marginTop: -2,
//   },
// });


import Body from '@/components/ui/layout/Body';
import React from "react";
import { View, StyleSheet } from "react-native";


const cityNeeds = () => {

  return (
    <Body>
    <View style={styles.markerContainer}>
    <View style={styles.markerPin} />
    <View style={styles.markerTail} />
  </View>
    </Body>
  )
}

export default cityNeeds

const styles = StyleSheet.create({
  markerContainer: {
    width: 30,
    height: 40, // Increased to accommodate the tail
    alignItems: 'center',
  },
  markerPin: {
    width: 30,
    height: 30,
    backgroundColor: '#FF6B6B',
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1,
  },
  markerTail: {
    position: 'absolute',
    top: 27, // Position it at the bottom of the pin
    left: 7, // Center it horizontally
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 10,
    borderRightWidth: 8,
    borderBottomWidth: 0,
    borderLeftWidth: 8,
    borderTopColor: '#FF6B6B',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
});

