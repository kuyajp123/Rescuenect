import { ListOfEvents } from '@/components/ui/data-display/ListOfEvents';
import { EmptyState } from '@/components/ui/feedback/empty-state';
import React from 'react';
import { StyleSheet, View } from 'react-native';

/*
===========================================
EMPTY STATE COMPONENT EXAMPLES
===========================================

This file demonstrates various ways to use the EmptyState component
with the ListOfEvents component and as a standalone component.
*/

// Example 1: ListOfEvents with empty data (shows EmptyState automatically)
export const EmptyEventsExample = () => {
  return (
    <ListOfEvents 
      events={[]} // Empty array triggers EmptyState
      title="Community Events"
      subtitle="Making a difference together"
    />
  );
};

// Example 2: Standalone EmptyState with default remote animation
export const DefaultEmptyState = () => {
  return (
    <View style={styles.container}>
      <EmptyState 
        title="No volunteer events found"
        subtitle="Be the first to organize an event in your community!"
      />
    </View>
  );
};

// Example 3: EmptyState with local animation file
export const LocalAnimationEmptyState = () => {
  return (
    <View style={styles.container}>
      <EmptyState 
        animationSource={require('@/assets/animations/empty-calendar.json')}
        title="No events scheduled"
        subtitle="Check back later for new volunteer opportunities!"
        animationSize={200}
      />
    </View>
  );
};

// Example 4: EmptyState with custom styling
export const CustomStyledEmptyState = () => {
  return (
    <View style={styles.container}>
      <EmptyState 
        title="No emergency alerts"
        subtitle="Your community is safe and secure right now"
        animationSize={150}
        containerStyle={styles.customEmptyState}
        loop={true}
        autoPlay={true}
      />
    </View>
  );
};

// Example 5: EmptyState with remote animation
export const RemoteAnimationEmptyState = () => {
  return (
    <View style={styles.container}>
      <EmptyState 
        animationSource={{ 
          uri: 'https://assets7.lottiefiles.com/packages/lf20_ls6uxdas.json' 
        }}
        title="No data available"
        subtitle="We're working to bring you fresh content"
        animationSize={180}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  customEmptyState: {
    backgroundColor: 'rgba(0, 120, 255, 0.05)',
    borderRadius: 15,
    margin: 20,
    padding: 20,
  },
});

/*
===========================================
USAGE SCENARIOS FOR DIFFERENT SCREENS
===========================================

1. VOLUNTEER EVENTS SCREEN:
---------------------------
- Use ListOfEvents with empty events array
- EmptyState shows automatically with calendar animation
- Perfect for when no events are available

2. COMMUNITY STATUS SCREEN:
---------------------------
- Use EmptyState with custom title/subtitle
- Shows when no status updates are available
- Can use different animation for different contexts

3. NOTIFICATIONS SCREEN:
------------------------
- EmptyState with bell or notification animation
- Shows when user has no notifications
- Custom messaging about staying connected

4. SEARCH RESULTS:
------------------
- EmptyState with search animation
- Shows when search returns no results
- Encourages users to try different search terms

5. EMERGENCY ALERTS:
--------------------
- EmptyState with shield or safety animation
- Shows when no active alerts
- Reassuring message about community safety

RECOMMENDED LOTTIE ANIMATIONS BY USE CASE:
-----------------------------------------

Calendar/Events: 
- Local: @/assets/animations/empty-calendar.json
- Remote: https://assets10.lottiefiles.com/packages/lf20_zyquagfl.json

Search/Not Found:
- Remote: https://assets4.lottiefiles.com/packages/lf20_tl52xzvn.json

Empty Box/No Data:
- Remote: https://assets7.lottiefiles.com/packages/lf20_ls6uxdas.json

Notifications:
- Remote: https://assets2.lottiefiles.com/packages/lf20_xl5udi7d.json

Safety/Security:
- Remote: https://assets1.lottiefiles.com/packages/lf20_mZJx2r.json
*/
