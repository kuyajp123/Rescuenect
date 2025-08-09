import type { StatusTemplateProps } from '@/components/shared/types/components'
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage
} from "@/components/ui/avatar"
import { Badge, BadgeText } from '@/components/ui/badge'
import { Box } from '@/components/ui/box'
import { Image } from '@/components/ui/image'
import { ImageModal } from '@/components/ui/image-modal/ImageModal'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'
import { ColorCombinations } from '@/constants/Colors'
import { useTheme } from '@/contexts/ThemeContext'
import { Ellipsis } from 'lucide-react-native'
import React, { useState } from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'

export const DonnationPostTemplate = ({  
    style,
    id,
    picture,
    firstName,
    lastName,
    description,
    image,
    date,
    time,
    category,
    itemName,
    quantity
 }: StatusTemplateProps) => {
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
    }
  
    return (
      <Box 
        style={[styles.container, dynamicStyles.container, style]}
        key={id}
      >
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
                {picture && (
                  <Avatar >
                  <AvatarImage
                    source={{
                      uri: picture,
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
                action={'muted'}
                variant='solid'
                style={styles.statusBadge}
              >
                <BadgeText>{category}</BadgeText>
              </Badge>
            </Box>
          </Box>
          
          {/* Item section */}
          {itemName && (
            <Box style={styles.itemContainer}>
              <Box style={styles.locationIconContainer}>
                {/* <MapPin size={16} color={dynamicStyles.ellipsisIcon.color} /> */}
              </Box>
              
              <Box style={styles.itemNameContent}>
                <Text style={styles.ItemText}>
                  {itemName}
                </Text>
              </Box>

              <Box style={styles.quantityContent}>
                <Text style={styles.ItemText} size="2xs" emphasis="light">
                  {quantity && `${quantity} items`}
                </Text>
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
      height: 'auto'
    },
  
    statusBadge: {
      width: 'auto',
      height: 'auto',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
  
    // Location section styles
    itemContainer: {
      flexDirection: 'row',
      paddingLeft: 40,
      gap: 8,
    },
  
    locationIconContainer: {
      flexDirection: 'row-reverse',
      paddingTop: 5,
    },
  
    itemNameContent: {
      flex: 1,
      flexWrap: 'wrap',
      maxWidth: '60%', width: '100%'
    },

    quantityContent: {
      flexDirection: 'row-reverse', 
      flex: 1,
      flexWrap: 'wrap',
      width: 40, 
      maxWidth: '40%'
    },
  
    ItemText: {
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

// This component can be used in your main app file or wherever you need to display the donation post template
// Usage example:

// import { DonnationPostTemplate } from '@/components/ui/post-template/DonnationPostTemplate';
// import type { StatusTemplateProps } from '@/components/ui/post-template/StatusTemplate';
// import statusData from '../../data/statusData.json';

// const community = () => {
//   return (
//     <Body gap={10} style={{ padding: 0, paddingVertical: 20 }}>
//       {statusData.map((item: StatusTemplateProps, index: number) => (
//       <DonnationPostTemplate key={index} {...item} />
//       ))}
//     </Body>
//   )
// }