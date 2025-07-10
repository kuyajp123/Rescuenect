import { Box } from '@/components/ui/box';
import type { StatusTemplateProps } from '@/components/ui/post-template';
import { DonationList, StatusList } from '@/components/ui/post-template';
import { Text } from '@/components/ui/text';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

/*
===========================================
POST TEMPLATE EMPTY STATE EXAMPLES
===========================================

This file demonstrates how to use the new list components
with empty state handling for different scenarios.
*/

// Example 1: Status Updates Screen with Empty State
export const StatusUpdatesScreen = () => {
  const [statusUpdates, setStatusUpdates] = useState<StatusTemplateProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchStatusUpdates = async () => {
      try {
        // Replace with your actual API endpoint
        // const response = await fetch('/api/status-updates');
        // const data = await response.json();
        
        // For demo: empty array to show empty state
        const data: StatusTemplateProps[] = [];
        
        setStatusUpdates(data);
      } catch (error) {
        console.error('Failed to fetch status updates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusUpdates();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading status updates...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Box style={styles.header}>
        <Text size="2xl" bold>Community Status</Text>
        <Text size="sm" style={styles.subtitle}>
          Stay updated on community safety
        </Text>
      </Box>
      
      <StatusList 
        statusUpdates={statusUpdates}
        emptyTitle="All quiet in your area"
        emptySubtitle="No emergency alerts or status updates at this time. Your community is safe!"
      />
    </ScrollView>
  );
};

// Example 2: Donations Screen with Empty State
export const DonationsScreen = () => {
  const [donations, setDonations] = useState<StatusTemplateProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchDonations = async () => {
      try {
        // Replace with your actual API endpoint
        // const response = await fetch('/api/donations');
        // const data = await response.json();
        
        // For demo: empty array to show empty state
        const data: StatusTemplateProps[] = [];
        
        setDonations(data);
      } catch (error) {
        console.error('Failed to fetch donations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading donations...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Box style={styles.header}>
        <Text size="2xl" bold>Community Donations</Text>
        <Text size="sm" style={styles.subtitle}>
          Share and find essential items
        </Text>
      </Box>
      
      <DonationList 
        donations={donations}
        emptyTitle="No donations posted yet"
        emptySubtitle="Be the first to share essential items with community members in need"
      />
    </ScrollView>
  );
};

// Example 3: Emergency Status during Crisis
export const EmergencyStatusScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Box style={styles.header}>
        <Text size="2xl" bold>Emergency Status</Text>
        <Text size="sm" style={styles.subtitle}>
          Real-time safety updates
        </Text>
      </Box>
      
      <StatusList 
        statusUpdates={[]} // Empty for demo
        emptyTitle="No emergency reports"
        emptySubtitle="All community members are accounted for and safe"
      />
    </ScrollView>
  );
};

// Example 4: Disaster Relief Donations
export const DisasterReliefScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Box style={styles.header}>
        <Text size="2xl" bold>Disaster Relief</Text>
        <Text size="sm" style={styles.subtitle}>
          Emergency supply sharing
        </Text>
      </Box>
      
      <DonationList 
        donations={[]} // Empty for demo
        emptyTitle="No relief items available"
        emptySubtitle="Help your community by donating emergency supplies and essentials"
      />
    </ScrollView>
  );
};

// Example 5: Combined Status and Donations Tab
export const CommunityFeedScreen = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'donations'>('status');
  
  return (
    <View style={styles.container}>
      <Box style={styles.header}>
        <Text size="2xl" bold>Community Feed</Text>
        
        {/* Simple tab switcher */}
        <View style={styles.tabContainer}>
          <Text 
            style={[styles.tab, activeTab === 'status' && styles.activeTab]}
            onPress={() => setActiveTab('status')}
          >
            Status Updates
          </Text>
          <Text 
            style={[styles.tab, activeTab === 'donations' && styles.activeTab]}
            onPress={() => setActiveTab('donations')}
          >
            Donations
          </Text>
        </View>
      </Box>

      <ScrollView style={styles.tabContent}>
        {activeTab === 'status' ? (
          <StatusList 
            statusUpdates={[]}
            emptyTitle="No status updates"
            emptySubtitle="Community members will share their safety status here"
          />
        ) : (
          <DonationList 
            donations={[]}
            emptyTitle="No donations available"
            emptySubtitle="Share items to help community members in need"
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#666666',
  },
  activeTab: {
    color: '#007AFF',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabContent: {
    flex: 1,
  },
});

/*
===========================================
INTEGRATION WITH EXISTING SCREENS
===========================================

REPLACE EXISTING MAPPING CODE:

OLD CODE:
{statusData.map((item: StatusTemplateProps, index: number) => (
  <StatusTemplate key={index} {...item} />
))}

NEW CODE:
<StatusList statusUpdates={statusData} />

BENEFITS OF NEW APPROACH:
------------------------
✅ Automatic empty state handling
✅ Better user experience when no data
✅ Consistent spacing and layout
✅ Custom empty state messaging
✅ Reduced boilerplate code
✅ Better accessibility
✅ Professional animations

BACKEND INTEGRATION:
-------------------
The components work seamlessly with:
- REST APIs
- GraphQL endpoints  
- Real-time data (WebSocket)
- State management (Redux, Zustand)
- Cache management (React Query, SWR)

CUSTOMIZATION OPTIONS:
---------------------
- Custom empty state titles and subtitles
- Different animations for different contexts
- Custom styling and themes
- Loading states and error handling
- Pull-to-refresh functionality
*/
