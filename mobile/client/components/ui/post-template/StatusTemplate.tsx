import {
  Avatar,
  AvatarFallbackText,
  AvatarImage
} from "@/components/ui/avatar"
import { Badge, BadgeIcon, BadgeText } from '@/components/ui/badge'
import { Box } from '@/components/ui/box'
import { Divider } from "@/components/ui/divider"
import { Image } from '@/components/ui/image'
import { ImageModal } from '@/components/ui/image-modal/ImageModal'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { ColorCombinations } from '@/constants/Colors'
import { useTheme } from '@/contexts/ThemeContext'
import {
  CircleCheck,
  CircleQuestionMark,
  Ellipsis,
  Info,
  MapPin,
  Phone,
  ShieldCheck,
  Users
} from 'lucide-react-native'
import React, { useState } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'

export type StatusTemplateProps = {
  style?: object
  profileImage: string
  firstName: string
  lastName: string
  location?: string
  longitude?: string
  latitude?: string
  status?: string
  description?: string
  image?: string
  numberOfPeople?: number
  contact?: string
  date: string
  time: string
  category?: string
  itemName?: string
  quantity?: number
}

export const StatusTemplate: React.FC<StatusTemplateProps> = ({
  style,
  profileImage,
  firstName,
  lastName,
  location,
  longitude,
  latitude,
  status,
  description,
  image,
  numberOfPeople,
  contact,
  date,
  time,
}) => {
  const { isDark } = useTheme()
  const [isImageModalVisible, setIsImageModalVisible] = useState(false)

  const handleImagePress = () => {
    setIsImageModalVisible(true)
  }

  const handleCloseModal = () => {
    setIsImageModalVisible(false)
  }

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: isDark
        ? ColorCombinations.statusTemplate.dark
        : ColorCombinations.statusTemplate.light,
    },
    ellipsisIcon: {
      color: isDark ? '#A6A6A6' : '#5B5B5B',
    },
    avatarBadge: {
      backgroundColor: isDark ? '#4CAF50' : '#81C784',
    },
  }

  return (
    <Box style={[styles.container, dynamicStyles.container, style]}>
      <VStack space='sm'>
        {/* Header with menu icon */}
        <Box style={styles.header}>
          <Ellipsis 
            color={dynamicStyles.ellipsisIcon.color} 
            size={24}
          />
        </Box>

        {/* Main content row */}
        <Box style={styles.mainContent}>
          {/* User info section */}
          <Box style={styles.userSection}>
            <Box style={styles.avatarContainer}>
              {profileImage && (
                <Avatar size='md'>
                <AvatarImage
                  source={{
                    uri: profileImage,
                  }}
                  alt={`${firstName} ${lastName}`}
                />
                <AvatarFallbackText>
                  {firstName.charAt(0)}{lastName.charAt(0)}
                </AvatarFallbackText>
              </Avatar>
              )}
            </Box>
            
            <Box style={styles.userInfo}>
              <Text style={styles.userName}>{firstName} {lastName}</Text>
              <Text style={styles.timestamp} size="2xs" emphasis="light">
                {date} • {time}
              </Text>
            </Box>
          </Box>

          {/* Status badge section */}
          <Box style={styles.statusSection}>
            <Badge
              size='sm'
              action={status == 'evacuated' ? 'info' : status == 'safe' ? 'success' : status == 'missing' ? 'error' : status == 'affected' ? 'warning' : 'muted'}
              variant='solid'
              style={styles.statusBadge}
            >
              <BadgeIcon as={
                status == 'evacuated' ? ShieldCheck
                : status == 'safe' ? CircleCheck
                : status == 'affected' ? Info
                : status == 'missing' ? CircleQuestionMark
                : undefined
              } />
              <BadgeText>{status}</BadgeText>
            </Badge>
          </Box>
        </Box>
        
        {/* Location section */}
        {location && (
          <Box style={styles.locationContainer}>
            <Box style={styles.locationIconContainer}>
              <MapPin size={16} color={dynamicStyles.ellipsisIcon.color} />
            </Box>
            
            <Box style={styles.locationContent}>
              <Text  style={styles.locationText}>
                {location}
              </Text>
              
              {longitude && (
                <Text style={styles.coordinateText} >
                  Longitude: {longitude}
                </Text>
              )}
              
              {latitude && (
                <Text style={styles.coordinateText} >
                  Latitude: {latitude}
                </Text>
              )}
            </Box>
          </Box>
        )}

        {/* Description section */}
        {description && (
          <Box style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {description}
            </Text>
          </Box>
        )}

        {/* Image section */}
        {image && (
          <Box style={styles.imageContainer}>
            <TouchableOpacity onPress={handleImagePress} activeOpacity={0.8}>
              <Image
                className="rounded-lg"
                size="2xl"
                source={{ uri: image }}
                alt={`${firstName} ${lastName} status update`}
              />
            </TouchableOpacity>
          </Box>
        )}

        {/* Footer section - Number of people and contact */}
        {(numberOfPeople || contact) && (
          <>
            <Box style={styles.footerDividerContainer}>
              <Divider />
            </Box>

            <Box style={styles.footerMainContainer}>
              {/* People count section */}
              <Box style={styles.peopleSection}>
                {numberOfPeople && (
                  <>
                    <Box style={styles.peopleIconContainer}>
                      <Users size={16} color={dynamicStyles.ellipsisIcon.color} />
                    </Box>
                    <Box style={styles.peopleTextContainer}>
                      <Text>{numberOfPeople} Person</Text>
                    </Box>
                  </>
                )}
              </Box>

              {/* Contact section */}
              <Box style={styles.contactSection}>
                {contact && (
                  <>
                    <Box style={styles.contactIconContainer}>
                      <Phone size={16} color={dynamicStyles.ellipsisIcon.color} />
                    </Box>
                    <Box style={styles.contactTextContainer}>
                      <Text>{contact}</Text>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </>
        )}

      </VStack>
      
      {/* Image Modal */}
      {image && (
        <ImageModal
          visible={isImageModalVisible}
          imageUri={image}
          onClose={handleCloseModal}
          alt={`${firstName} ${lastName} status update - Full size`}
        />
      )}
    </Box>
  )
}

const styles = StyleSheet.create({
  // Container styles
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },

  // Header styles
  header: {
    flexDirection: 'row-reverse',
  },

  // Main content styles
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    height: 'auto',
    width: '100%',
  },

  // User section styles
  userSection: {
    width: '70%',
    flexWrap: 'wrap',
    gap: 8,
    flexDirection: 'row',
  },

  avatarContainer: {
    // Avatar container styles (if needed in future)
  },

  userInfo: {
    width: '75%',
    flexWrap: 'wrap',
  },

  userName: {
    maxWidth: '100%',
  },

  timestamp: {
    maxWidth: '100%',
  },

  // Status section styles
  statusSection: {
    width: '30%',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    flexDirection: 'row',
  },

  statusBadge: {
    gap: 4,
    height: 24,
  },

  // Location section styles
  locationContainer: {
    flexDirection: 'row',
    gap: 8,
  },

  locationIconContainer: {
    width: 40,
    flexDirection: 'row-reverse',
    paddingTop: 5,
  },

  locationContent: {
    flex: 1,
    flexWrap: 'wrap',
    maxWidth: '85%',
  },

  locationText: {
    maxWidth: '100%',
  },

  coordinateText: {
    maxWidth: '100%',
  },

  // Description section styles
  descriptionContainer: {
    width: '100%',
    paddingTop: 5,
    paddingLeft: 48,
    flexDirection: 'row',
  },

  descriptionText: {
    maxWidth: '85%',
  },

  // Image section styles
  imageContainer: {
    width: '100%',
    flexDirection: 'row',
    paddingLeft: 48,
  },

  imageComponent: {
    // Image component styles (if needed in future)
  },

  // Footer section styles
  footerDividerContainer: {
    paddingLeft: 50,
  },

  footerMainContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  // People count section styles
  peopleSection: {
    width: '50%',
    flexDirection: 'row',
    gap: 8,
  },

  peopleIconContainer: {
    width: 40,
    flexDirection: 'row-reverse',
    paddingTop: 5,
  },

  peopleTextContainer: {
    paddingTop: 2,
  },

  // Contact section styles
  contactSection: {
    width: '50%',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },

  contactIconContainer: {
    width: 40,
    flexDirection: 'row-reverse',
    paddingTop: 5,
  },

  contactTextContainer: {
    paddingTop: 2,
  },
})

// This component can be used in your main app file or wherever you need to display the status template
// Usage example:

// import { StatusTemplate } from '@/components/ui/post-template/StatusTemplate';
// import type { StatusTemplateProps } from '@/components/ui/post-template/StatusTemplate';
// import statusData from '../../data/statusData.json';

// const community = () => {
//   return (
//     <Body gap={10} style={{ padding: 0, paddingVertical: 20 }}>
//       {statusData.map((item: StatusTemplateProps, index: number) => (
//       <StatusTemplate key={index} {...item} />
//       ))}
//     </Body>
//   )
// }