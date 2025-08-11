import { router } from 'expo-router';
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';

interface SwipeNavigatorProps {
  children?: ReactNode;
  leftRoute?: string;
  rightRoute?: string;
  distance?: number;
  velocity?: number;
}

export const SwipeNavigator: React.FC<SwipeNavigatorProps> = ({
  children,
  leftRoute,   // route when swiping left
  rightRoute,  // route when swiping right
  distance = 50, // swipe distance threshold
  velocity = 500 // swipe velocity threshold
}) => {
  const onHandlerStateChange = (event: any) => {
    const { translationX, translationY, velocityX, oldState } = event.nativeEvent;

    if (oldState === 4) { // State.END
      // Only handle horizontal swipes (ignore if vertical movement is too large)
      const horizontalMovement = Math.abs(translationX);
      const verticalMovement = Math.abs(translationY);
      
      // Only trigger navigation if horizontal movement is dominant
      if (horizontalMovement > verticalMovement && horizontalMovement > distance) {
        if (translationX < -distance && velocityX < -velocity && leftRoute) {
          router.push(leftRoute as any);
        }
        else if (translationX > distance && velocityX > velocity && rightRoute) {
          router.push(rightRoute as any);
        }
      }
    }
  };

  return (
    <PanGestureHandler 
      onHandlerStateChange={onHandlerStateChange}
      activeOffsetX={[-10, 10]} // Only activate on horizontal movement
      failOffsetY={[-20, 20]}   // Fail if vertical movement is too large
      shouldCancelWhenOutside={true}
    >
      <View style={styles.container}>
        {children}
      </View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }
});

// sample usage:
// <SwipeNavigator
//   leftRoute="notification"
//   rightRoute="createStatus"
// >
//   <YourComponent />
// </SwipeNavigator>
