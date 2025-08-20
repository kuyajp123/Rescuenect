import { EmptyState } from '@/components/components/empty-state';
import type { StatusTemplateProps } from '@/components/shared/types/components';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DonnationPostTemplate } from '../PostTemplate/DonnationPostTemplate';

interface DonationListProps {
  /**
   * Array of donation posts to display
   */
  donations?: StatusTemplateProps[];
  
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

export const DonationList: React.FC<DonationListProps> = ({
  donations = [],
  emptyTitle = "No donations yet",
  emptySubtitle = "Be the first to share essential items with community members in need",
  containerStyle,
}) => {
  
  // Show EmptyState when no donations are available
  if (donations.length === 0) {
    return (
      <View style={[styles.container, containerStyle]}>
        <EmptyState 
          title={emptyTitle}
          subtitle={emptySubtitle}
          animationSource={require('@/assets/animations/not-found.json')}
          animationSize={170}
          containerStyle={styles.emptyStateContainer}
          autoPlay={false}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {donations.map((donation, index) => (
        <DonnationPostTemplate 
          key={donation.id} 
          {...donation}
          style={index > 0 ? styles.donationSpacing : undefined}
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
  donationSpacing: {
    marginTop: 10,
  },
});

/*
===========================================
DONATION LIST COMPONENT USAGE GUIDE
===========================================

BASIC USAGE:
-----------
import { DonationList } from '@/components/ui/PostTemplate/DonationList';

// With donation posts
<DonationList donations={donationData} />

// Empty state (no donations)
<DonationList donations={[]} />

ADVANCED USAGE:
--------------
// Custom empty state messaging
<DonationList 
  donations={[]}
  emptyTitle="No donations available"
  emptySubtitle="Help your community by posting items you can share"
/>

// With backend data
const [donations, setDonations] = useState([]);

useEffect(() => {
  const fetchDonations = async () => {
    try {
      const response = await fetch('/api/donations');
      const data = await response.json();
      setDonations(data);
    } catch (error) {
      console.error('Failed to fetch donations:', error);
    }
  };
  
  fetchDonations();
}, []);

return (
  <DonationList 
    donations={donations}
    emptyTitle="No donations posted yet"
    emptySubtitle="Share essential items to help community members in need"
  />
);

PROPS:
------
- donations?: StatusTemplateProps[] - Array of donation posts
- emptyTitle?: string - Custom empty state title
- emptySubtitle?: string - Custom empty state subtitle  
- containerStyle?: object - Custom container styling

FEATURES:
---------
✅ Automatic empty state when no donations
✅ Custom empty state messaging
✅ Heart/charity themed animation
✅ Proper spacing between donation items
✅ TypeScript support
✅ Responsive design

USAGE SCENARIOS:
---------------
1. Community donation feed
2. Emergency supply sharing
3. Resource marketplace
4. Volunteer item coordination
5. Disaster relief donations
*/
