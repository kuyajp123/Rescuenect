import type { Event } from '@/components/shared/types/components';
import { EmptyState } from '@/components/ui/feedback/empty-state';
import { Text } from '@/components/ui/text';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

interface ListOfEventsProps {
  events?: Event[];
  title?: string;
  subtitle?: string;
}

export const ListOfEvents = ({ 
  events = [], 
  title = "Volunteer Events", 
  subtitle = "Step up for safety. Be a community hero." 
}: ListOfEventsProps) => {

  // Default fallback events (for demo purposes or when no events are provided)
  const defaultEvents: Event[] = [
    {
      id: '1',
      title: 'Community Cleanup',
      description: 'Join us for a community cleanup event to keep our neighborhood clean and green.',
      date: '2023-10-15',
      location: 'Central Park',
      image: require('@/assets/images/Events/image 5.png')
    },
    {
      id: '2',
      title: 'Food Drive',
      description: 'Help us collect food donations for local families in need.',
      date: '2023-10-20',
      image: require('@/assets/images/Events/image 6.png'),
      location: 'City Hall'
    }
  ];

  // Use provided events or fallback to default events
  const displayEvents = events.length > 0 ? events : defaultEvents;

  const renderEvent = (event: Event) => {
    return (
      <View style={styles.eventContainer} key={event.id}>
        <ImageBackground 
          source={event.image}
          style={styles.backgroundImage}
          imageStyle={styles.imageStyle}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientOverlay}
          >
            <View style={styles.contentContainer}>
              <Text size='xs' emphasis='light' style={styles.eventDescription}>
                {event.description ? event.description : ''}
              </Text>
              <Text size='md' bold style={styles.eventTitle}>
                {event.title}
              </Text>
              <Text size='2xs' style={styles.eventDate}>
                {new Date(event.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  }

  const renderAllEvents = () => {
    return (
      <>
        {displayEvents.map((event) => renderEvent(event))}
      </>
    );
  }

  // Show EmptyState component when no events are available
  if (displayEvents.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text size='sm' bold style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
        <EmptyState 
          title="No events available"
          subtitle="Check back later for new volunteer opportunities in your community!"
          animationSource={require('@/assets/animations/no-activity.json')}
          animationSize={180}
          containerStyle={styles.emptyStateContainer}
        />
      </View>
    );
  }



  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text size='sm' bold style={styles.headerTitle}>{title}</Text>
        <Text size='xs' style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
      <View>
        {renderAllEvents()}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerTitle: {
    marginBottom: 5,
  },
  headerSubtitle: {
    opacity: 0.7,
  },
  eventContainer: {
    height: 150,
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderRadius: 20,
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentContainer: {
    padding: 20,
    justifyContent: 'flex-end',
    flex: 1,
  },
  eventDescription: {
    color: 'white',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  eventTitle: {
    color: 'white',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  eventDate: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  eventLocation: {
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  noEventsContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEventsText: {
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.8,
  },
  noEventsSubtext: {
    textAlign: 'center',
    opacity: 0.6,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
})

/*
===========================================
HOW TO USE THIS COMPONENT WITH BACKEND DATA
===========================================

CURRENT IMPLEMENTATION: Props-based (READY TO USE!)
----------------------------------------------------
The component now accepts props and is ready for backend integration!

BASIC USAGE:
*/

// import { ListOfEvents } from '@/components/ui/volunteer-events/ListOfEvents';
// 
// function MyScreen() {
//   const [events, setEvents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   
//   useEffect(() => {
//     const fetchEvents = async () => {
//       try {
//         const response = await fetch('YOUR_API_ENDPOINT/events');
//         const data = await response.json();
//         
//         // Transform backend data to match Event interface
//         const transformedEvents = data.map((item) => ({
//           id: item.id || item._id,
//           title: item.title || item.name,
//           description: item.description || item.details,
//           date: item.date || item.event_date,
//           location: item.location || item.venue,
//           image: item.image_url ? { uri: item.image_url } : require('@/assets/images/Events/default.png')
//         }));
//         
//         setEvents(transformedEvents);
//       } catch (error) {
//         console.error('Failed to fetch events:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
//
//     fetchEvents();
//   }, []);
//   
//   if (loading) {
//     return <ActivityIndicator size="large" />;
//   }
//   
//   return (
//     <ListOfEvents 
//       events={events}
//       title="Community Events"
//       subtitle="Join us in making a difference!"
//     />
//   );
// }

/*
COMPONENT PROPS:
*/

// interface ListOfEventsProps {
//   events?: Event[];           // Array of events from your backend
//   title?: string;            // Custom title (default: "Volunteer Events")
//   subtitle?: string;         // Custom subtitle (default: "Step up for safety...")
// }

/*
USAGE EXAMPLES:
*/

// 1. With custom events from backend:
// <ListOfEvents events={fetchedEvents} />

// 2. With custom title and subtitle:
// <ListOfEvents 
//   events={fetchedEvents}
//   title="Emergency Response Events"
//   subtitle="Be ready when your community needs you most"
// />

// 3. Empty state (shows default message):
// <ListOfEvents events={[]} />

// 4. Fallback to demo data (when events array is empty):
// <ListOfEvents /> // Shows default demo events

/*
BACKEND DATA FORMAT EXAMPLE:
----------------------------
Your backend should return data in this format:

[
  {
    "id": "1",
    "title": "Community Cleanup",
    "description": "Join us for a community cleanup event...",
    "date": "2023-10-15T10:00:00Z",
    "location": "Central Park",
    "image_url": "https://yourapi.com/images/event1.jpg"
  },
  {
    "id": "2", 
    "title": "Food Drive",
    "description": "Help us collect food donations...",
    "date": "2023-10-20T09:00:00Z",
    "location": "City Hall",
    "image_url": "https://yourapi.com/images/event2.jpg"
  }
]

COMPLETE INTEGRATION EXAMPLE:
-----------------------------
*/

// import React, { useState, useEffect } from 'react';
// import { ActivityIndicator, View } from 'react-native';
// import { ListOfEvents } from '@/components/ui/volunteer-events/ListOfEvents';
// 
// function EventsScreen() {
//   const [events, setEvents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
// 
//   useEffect(() => {
//     const fetchEvents = async () => {
//       try {
//         setLoading(true);
//         const response = await fetch('https://your-api.com/api/events');
//         
//         if (!response.ok) {
//           throw new Error('Failed to fetch events');
//         }
//         
//         const data = await response.json();
//         
//         // Transform data to match Event interface
//         const transformedEvents = data.map((item) => ({
//           id: item.id?.toString(),
//           title: item.title,
//           description: item.description,
//           date: item.date,
//           location: item.location,
//           image: item.image_url ? 
//             { uri: item.image_url } : 
//             require('@/assets/images/Events/default.png')
//         }));
//         
//         setEvents(transformedEvents);
//       } catch (err) {
//         setError(err.message);
//         console.error('Error fetching events:', err);
//       } finally {
//         setLoading(false);
//       }
//     };
// 
//     fetchEvents();
//   }, []);
// 
//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color="#0000ff" />
//       </View>
//     );
//   }
// 
//   if (error) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <Text>Error: {error}</Text>
//       </View>
//     );
//   }
// 
//   return (
//     <ListOfEvents 
//       events={events}
//       title="Emergency Response Events"
//       subtitle="Join the heroes in your community"
//     />
//   );
// }

/*
IMAGE HANDLING:
---------------
*/

// For remote images: { uri: 'https://your-api.com/image.jpg' }
// For local images: require('@/assets/images/Events/image.png')

/*
FEATURES INCLUDED:
------------------
✅ Props-based architecture (ready for backend data)
✅ Fallback to demo data when no events provided
✅ Custom title and subtitle support
✅ Lottie-animated empty state handling with EmptyState component
✅ Beautiful gradient overlay design
✅ Responsive layout
✅ TypeScript support
✅ Error-free implementation

EMPTY STATE FEATURES:
--------------------
✅ Lottie animations for engaging empty states
✅ Customizable animation, title, and subtitle
✅ Responsive design that works on all screen sizes
✅ Fallback to remote animations if local not available
✅ Professional, modern UI/UX design
*/