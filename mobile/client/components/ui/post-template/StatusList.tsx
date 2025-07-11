import { EmptyState } from '@/components/ui/empty-state';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StatusTemplateProps } from './template/StatusTemplate';
import { StatusTemplate } from './template/StatusTemplate';

interface StatusListProps {
  /**
   * Array of status updates to display
   */
  statusUpdates?: StatusTemplateProps[];
  
  /**
   * Custom title for empty state
   */
  emptyTitle?: string;
  
  /**
   * Custom subtitle for empty state  
   */
  emptySubtitle?: string;
  
  /**
   * Custom container style
   */
  containerStyle?: object;
}

export const StatusList: React.FC<StatusListProps> = ({
  statusUpdates = [],
  emptyTitle = "No status updates yet",
  emptySubtitle = "Community members will share their safety status here during emergencies",
  containerStyle,
}) => {
  
  // Show EmptyState when no status updates are available
  if (statusUpdates.length === 0) {
    return (
      <View style={[styles.container, containerStyle]}>
        <EmptyState 
          title={emptyTitle}
          subtitle={emptySubtitle}
          animationSource={require('@/assets/animations/not-found.json')}
          animationSize={120}
          containerStyle={styles.emptyStateContainer}
          autoPlay={false}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {statusUpdates.map((status, index) => (
        <StatusTemplate 
          key={status.id} 
          {...status}
          style={index > 0 ? styles.statusSpacing : undefined}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  statusSpacing: {
    marginTop: 10,
  },
});

/*
===========================================
STATUS LIST COMPONENT USAGE GUIDE
===========================================

BASIC USAGE:
-----------
import { StatusList } from '@/components/ui/post-template/StatusList';

// With status updates
<StatusList statusUpdates={statusData} />

// Empty state (no status updates)
<StatusList statusUpdates={[]} />

ADVANCED USAGE:
--------------
// Custom empty state messaging
<StatusList 
  statusUpdates={[]}
  emptyTitle="All quiet in your area"
  emptySubtitle="No emergency alerts or status updates at this time"
/>

// With backend data
const [statusUpdates, setStatusUpdates] = useState([]);

useEffect(() => {
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status-updates');
      const data = await response.json();
      setStatusUpdates(data);
    } catch (error) {
      console.error('Failed to fetch status updates:', error);
    }
  };
  
  fetchStatus();
}, []);

return (
  <StatusList 
    statusUpdates={statusUpdates}
    emptyTitle="No recent status updates"
    emptySubtitle="Community members will share updates here during emergencies"
  />
);

PROPS:
------
- statusUpdates?: StatusTemplateProps[] - Array of status updates
- emptyTitle?: string - Custom empty state title
- emptySubtitle?: string - Custom empty state subtitle  
- containerStyle?: object - Custom container styling

FEATURES:
---------
✅ Automatic empty state when no status updates
✅ Custom empty state messaging
✅ Notification/alert themed animation
✅ Proper spacing between status items
✅ TypeScript support
✅ Responsive design
*/
