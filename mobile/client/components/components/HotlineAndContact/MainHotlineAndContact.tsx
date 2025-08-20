import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader
} from "@/components/ui/alert-dialog";
import { Image } from '@/components/ui/image';
import { Text } from '@/components/ui/text';
import { Colors } from "@/constants/Colors";
import { useTheme } from '@/contexts/ThemeContext';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { Check, Copy, ExternalLink, Facebook, Flame, Globe, Mail, Phone, Shield, Smartphone, Zap } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Linking, Pressable, StyleSheet, View } from 'react-native';


export const MainHotlineAndContact = () => {
  const { isDark } = useTheme();
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const scaleValue = useRef(new Animated.Value(0)).current;
  const { width } = Dimensions.get('window');

  const fbUrl = 'fb://facewebmodal/f?href=https://www.facebook.com/share/14xwTMd2Ht/';
  const fallbackUrl = 'https://www.facebook.com/share/14xwTMd2Ht/';
  
  const handleClose = () => {
    // Scale out animation
    Animated.timing(scaleValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowAlertDialog(false);
    });
  }

  const showAlert = () => {
    setShowAlertDialog(true);
    // Scale in animation with bounce
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }

  // Auto hide after 3 seconds
  useEffect(() => {
    if (showAlertDialog) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlertDialog]);

  const OPDRRMO1 = '0917-858-8263';
  const OPDRRMO2 = '0919-061-6584';
  const PoliceNumber = '(046) 875- 4322';
  const FireNumber = '(046) 471- 4777';

  const handlePress = () => {
    Linking.openURL(`tel:${OPDRRMO1}`);
  };

  const handlePress1 = () => {
    Linking.openURL(`tel:${OPDRRMO2}`);
  };

  const policeCopy = async () => {
    await Clipboard.setStringAsync(PoliceNumber);
    showAlert();
  };

  const fireCopy = async () => {
    await Clipboard.setStringAsync(FireNumber);
    showAlert();
  };

  const openFacebook = () => {
    Linking.canOpenURL(fbUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(fbUrl);
        } else {
          return Linking.openURL(fallbackUrl);
        }
      })
      .catch((err) => console.error('An error occurred', err));
  };

  const openInAppBrowser = async () => {
    const url = 'https://cavite.gov.ph/home/cities-and-municipalities/municipality-of-naic/';

    try {
      await WebBrowser.openBrowserAsync(url, {
        // Optional UI Customization for expo-web-browser
        dismissButtonStyle: 'close',
        toolbarColor: '#000000',
        controlsColor: '#ffffff',
        showTitle: true,
        enableBarCollapsing: true,
      });
    } catch (error) {
      console.warn('Failed to open in-app browser:', error);
      // fallback to default browser
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section with Gradient */}
      <LinearGradient
        colors={isDark ? [Colors.background.dark, Colors.background.dark] : [Colors.background.light, Colors.background.light]}
        style={styles.headerGradient}
      >
        <View style={[styles.logoContainer, styles.shadowCard]}>
          <Image
            className="rounded-2xl"
            size="2xl"
            source={require('../../../assets/images/Cavite-Logo 1.png')}
            style={styles.logo}
            alt='Cavite Logo'
          />
        </View>
        
        <View style={styles.titleContainer}>
          <Text size='xl' bold style={[styles.title]}>
            Emergency Hotlines & Contacts
          </Text>
          <Text size='sm' style={[styles.subtitle]}>
            Province of Cavite
          </Text>
        </View>
      </LinearGradient>

      {/* Description Card */}
      <View style={[styles.descriptionCard, { 
        backgroundColor: isDark ? '#1f2937' : 'white',
        borderColor: isDark ? '#374151' : '#e5e7eb'
      }]}>
        <Zap color={isDark ? '#fbbf24' : '#f59e0b'} size={24} style={styles.descriptionIcon} />
        <Text style={[styles.description, { color: isDark ? '#d1d5db' : '#374151' }]}>
          Quickly access important hotlines during emergencies. Contact local responders, medical services, rescue teams, or government agencies for immediate help and guidance.
        </Text>
      </View>

      {/* Emergency Hotlines Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Phone color={isDark ? '#ef4444' : '#dc2626'} size={24} />
          <Text size='lg' bold style={[styles.sectionTitle, { color: isDark ? '#ef4444' : '#dc2626' }]}>
            Emergency Hotlines
          </Text>
        </View>

        {/* OPDRRMO Section */}
        <View style={[styles.serviceCard, styles.shadowCard, { 
          backgroundColor: isDark ? '#1f2937' : 'white',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        }]}>
          <View style={styles.serviceHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#10b981' }]}>
              <Smartphone color="white" size={20} />
            </View>
            <Text bold size='md' style={[styles.OPDRRMO, { color: isDark ? '#ffffff' : '#111827' }]}>
              OPDRRMO (Emergency Response)
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Pressable 
              style={[styles.callButton, { backgroundColor: '#10b981' }]}
              onPress={handlePress}
            >
              <Phone color="white" size={18} />
              <Text style={styles.callButtonText}>{OPDRRMO1}</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.callButton, { backgroundColor: '#10b981' }]}
              onPress={handlePress1}
            >
              <Phone color="white" size={18} />
              <Text style={styles.callButtonText}>{OPDRRMO2}</Text>
            </Pressable>
          </View>
        </View>

        {/* Police Department */}
        <View style={[styles.serviceCard, styles.shadowCard, { 
          backgroundColor: isDark ? '#1f2937' : 'white',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        }]}>
          <View style={styles.serviceHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#3b82f6' }]}>
              <Shield color="white" size={20} />
            </View>
            <Text bold size='md' style={{ color: isDark ? '#ffffff' : '#111827' }}>
              Police Department
            </Text>
          </View>
          
          <Pressable 
            style={[styles.copyContainer, { backgroundColor: isDark ? '#333B52' : '#E9EAEA' }]}
            onPress={policeCopy}
          >
            <Text size="sm" style={[styles.contactNumber, { color: isDark ? '#d1d5db' : '#374151' }]}>
              {PoliceNumber}
            </Text>
            <View style={[styles.copyButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
              <Copy color={isDark ? '#9ca3af' : '#6b7280'} size={18} />
            </View>
          </Pressable>
        </View>

        {/* Fire Department */}
        <View style={[styles.serviceCard, styles.shadowCard, { 
          backgroundColor: isDark ? '#1f2937' : 'white',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        }]}>
          <View style={styles.serviceHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#ef4444' }]}>
              <Flame color="white" size={20} />
            </View>
            <Text bold size='md' style={{ color: isDark ? '#ffffff' : '#111827' }}>
              Fire Department
            </Text>
          </View>
          
          <Pressable 
            style={[styles.copyContainer, { backgroundColor: isDark ? '#333B52' : '#E9EAEA' }]}
            onPress={fireCopy}
          >
            <Text size='sm' style={[styles.contactNumber, { color: isDark ? '#d1d5db' : '#374151' }]}>
              {FireNumber}
            </Text>
            <View style={[styles.copyButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
              <Copy color={isDark ? '#9ca3af' : '#6b7280'} size={18} />
            </View>
          </Pressable>
        </View>
      </View>

      {/* Contacts Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Mail color={isDark ? '#8b5cf6' : '#7c3aed'} size={24} />
          <Text size='lg' bold style={[styles.sectionTitle, { color: isDark ? '#8b5cf6' : '#7c3aed' }]}>
            Contact Information
          </Text>
        </View>

        {/* Email Contact */}
        <View style={[styles.contactCard, styles.shadowCard, { 
          backgroundColor: isDark ? '#1f2937' : 'white',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#8b5cf6' }]}>
            <Mail color="white" size={20} />
          </View>
          <Text style={[styles.contactText, { color: isDark ? '#d1d5db' : '#374151' }]}>
            ask@cavite.gov.ph
          </Text>
        </View>

        {/* Social Media */}
        <View style={[styles.contactCard, styles.shadowCard, { 
          backgroundColor: isDark ? '#1f2937' : 'white',
          borderColor: isDark ? '#374151' : '#e5e7eb',
          
        }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#1877f2', }]}>
            <Facebook color="white" size={20} />
          </View>
          <Text style={[styles.contactText, { color: isDark ? '#d1d5db' : '#374151',}]}>
            Follow us on {' '}
          </Text>
            <Pressable onPress={openFacebook}>
              <Text style={styles.linkText}>Facebook</Text>
            </Pressable>
        </View>

        {/* Website */}
        <View style={[styles.contactCard, styles.shadowCard, { 
          backgroundColor: isDark ? '#1f2937' : 'white',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#059669' }]}>
            <Globe color="white" size={20} />
          </View>
          <View style={styles.websiteContainer}>
            <Text style={[styles.contactText, { color: isDark ? '#d1d5db' : '#374151' }]}>
              Visit our Official Website
            </Text>
            <Pressable 
              style={styles.websiteButton}
              onPress={openInAppBrowser}
            >
              <Text style={styles.websiteButtonText}>Open Website</Text>
              <ExternalLink color="#059669" size={16} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Disclaimer */}
      <View>
        <Text size="2xs" bold style={[styles.disclaimerTitle, { color: isDark ? '#fbbf24' : '#f59e0b' }]}>
          Important Notice:
        </Text>
        <Text size="2xs" emphasis="light" style={[styles.disclaimerText,]}>
          The contact information listed in this section has been retrieved from official government websites and publicly available resources. While we do our best to keep this information accurate and updated, changes may occur without prior notice. For the most reliable and up-to-date details, please refer directly to the official government channels.
        </Text>
      </View>

      {/* Success Alert Dialog */}
      <AlertDialog isOpen={showAlertDialog} onClose={handleClose} size="lg">
        <AlertDialogContent style={[styles.alertContent, {
          backgroundColor: isDark ? '#065f46' : '#d1fae5',
          borderColor: isDark ? '#059669' : '#10b981',
        }]}>
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <AlertDialogHeader style={styles.alertHeader}>
              <View style={[styles.alertIconContainer, { backgroundColor: isDark ? '#059669' : '#10b981' }]}>
                <Check color="white" size={20} />
              </View>
              <Text bold size="sm" style={{ color: isDark ? '#d1fae5' : '#065f46' }}>
                Copied to clipboard successfully!
              </Text>
            </AlertDialogHeader>
          </Animated.View>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shadowCard: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.9,
  },
  descriptionCard: {
    // margin: 20,
    marginVertical: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  descriptionIcon: {
    marginRight: 15,
  },
  description: {
    flex: 1,
    lineHeight: 22,
    textAlign: 'justify',
  },
  section: {
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    marginLeft: 10,
  },
  serviceCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 15,
  },
  OPDRRMO: {
    width: 215,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  buttonContainer: {
    gap: 10,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 50,
    gap: 10,
  },
  callButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  copyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  contactNumber: {
    fontWeight: '600',
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  contactText: {
    marginLeft: 12,
    fontWeight: '500',
    // flex: 1,
  },
  linkText: {
    color: '#1877f2',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  websiteContainer: {
    marginLeft: 12,
    flex: 1,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#059669',
  },
  websiteButtonText: {
    color: '#059669',
    fontWeight: 'bold',
  },
  disclaimerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  disclaimerTitle: {
    marginBottom: 8,
  },
  disclaimerText: {
    textAlign: 'justify',
  },
  alertContent: {
    borderWidth: 2,
    borderRadius: 16,
    position: 'absolute',
    top: 30,
    alignSelf: 'center',
    minWidth: 280,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 5,
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Enhanced Usage Example:
// import MainHotlineAndContact from "@/components/ui/hotline-and-contact/MainHotlineAndContact";
// import { ScrollView } from 'react-native';
// 
// function MyScreen() {
//   return (
//     <ScrollView style={{ flex: 1 }}>
//       <MainHotlineAndContact />
//     </ScrollView>
//   );
// }
//
// Features:
// - Beautiful gradient header with logo
// - Modern card-based design with shadows
// - Responsive dark/light theme support
// - Interactive phone buttons for emergency calls
// - Copy-to-clipboard functionality with animated feedback
// - In-app browser for website links
// - Social media integration
// - Professional styling with proper spacing and typography