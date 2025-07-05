import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Mail, Phone, MapPin, Calendar } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, View, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const cardColor = isDark ? '#262626' : '#ffffff';
  const secondaryTextColor = isDark ? '#a1a1aa' : '#64748b';

  // Mock user data based on ID
  const userData: Record<string, any> = {
    '123': {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      joinDate: 'January 2022',
      bio: 'Software engineer passionate about React Native and mobile development.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    },
    '456': {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1 (555) 456-7890',
      location: 'New York, NY',
      joinDate: 'March 2021',
      bio: 'UX/UI designer creating beautiful and intuitive user experiences.',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612d5b1?w=150&h=150&fit=crop&crop=face',
    },
  };

  const user = userData[id as string] || {
    name: `User ${id}`,
    email: `user${id}@example.com`,
    phone: '+1 (555) 000-0000',
    location: 'Unknown Location',
    joinDate: 'Recently',
    bio: 'No bio available.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: cardColor,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.brand.light,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
      }}>
        <Icon color="white" size={20} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 14,
          color: secondaryTextColor,
          marginBottom: 2,
        }}>
          {label}
        </Text>
        <Text style={{
          fontSize: 16,
          color: textColor,
          fontWeight: '500',
        }}>
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {/* Custom Header */}
      <View style={{
        paddingTop: insets.top + 10,
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: cardColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDark ? '#374151' : '#f3f4f6',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ArrowLeft color={textColor} size={20} />
          </Pressable>
          
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: textColor,
          }}>
            User Profile
          </Text>
          
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={{
          alignItems: 'center',
          padding: 24,
          backgroundColor: cardColor,
          marginBottom: 20,
        }}>
          <Image
            source={{ uri: user.avatar }}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              marginBottom: 16,
              borderWidth: 4,
              borderColor: Colors.brand.light,
            }}
          />
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: textColor,
            marginBottom: 8,
          }}>
            {user.name}
          </Text>
          <Text style={{
            fontSize: 16,
            color: secondaryTextColor,
            textAlign: 'center',
            lineHeight: 22,
          }}>
            {user.bio}
          </Text>
        </View>

        {/* User Info */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: textColor,
            marginBottom: 16,
          }}>
            Contact Information
          </Text>

          <InfoRow icon={Mail} label="Email" value={user.email} />
          <InfoRow icon={Phone} label="Phone" value={user.phone} />
          <InfoRow icon={MapPin} label="Location" value={user.location} />
          <InfoRow icon={Calendar} label="Member Since" value={user.joinDate} />
        </View>

        {/* Navigation Demo Info */}
        <View style={{ margin: 16, marginTop: 32 }}>
          <View style={{
            backgroundColor: cardColor,
            padding: 16,
            borderRadius: 12,
            borderLeftWidth: 4,
            borderLeftColor: Colors.semantic.info,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: textColor,
              marginBottom: 8,
            }}>
              🚀 Dynamic Route Demo
            </Text>
            <Text style={{
              fontSize: 14,
              color: secondaryTextColor,
              lineHeight: 20,
            }}>
              This screen demonstrates dynamic routing in Expo Router.{'\n\n'}
              • Route: /user/[id].tsx{'\n'}
              • Current ID: {id}{'\n'}
              • URL: /user/{id}{'\n\n'}
              The user data changes based on the ID parameter passed in the URL.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ padding: 16, paddingBottom: 32 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              backgroundColor: Colors.button.primary.default,
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
            }}>
              Go Back
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => router.push('/(tabs)/menu' as any)}
            style={{
              backgroundColor: Colors.button.secondary.default,
              padding: 16,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
            }}>
              Back to Menu
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
