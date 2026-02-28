import { Image } from 'expo-image';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import {
  Clipboard as ClipboardIcon,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  Link2,
  Mail,
  Phone,
  Shield,
  Smartphone,
  UserRound,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Pressable, StyleSheet, View } from 'react-native';
import { doc, getDoc, getDocFromCache } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import CustomAlertDialog from '@/components/ui/CustomAlertDialog';
import { useAuth } from '@/store/useAuth';

type ContactAction = 'call' | 'copy' | 'link' | 'display';
type CategoryType = 'Emergency Hotline' | 'Contact Information';

type ContactCategory = {
  id: string;
  name: string;
  type: CategoryType;
  description?: string | null;
  order?: number;
};

type ContactItem = {
  id: string;
  categoryId: string;
  name: string;
  value: string;
  action: ContactAction;
  iconKey: keyof typeof ICON_MAP;
  iconColor: string;
  isActive: boolean;
  order?: number;
};

const ICON_MAP = {
  phone: Phone,
  shield: Shield,
  flame: Flame,
  smartphone: Smartphone,
  mail: Mail,
  globe: Globe,
  link: Link2,
  clipboard: ClipboardIcon,
  user: UserRound,
};

const isCategoryType = (value: unknown): value is CategoryType =>
  value === 'Emergency Hotline' || value === 'Contact Information';

const isContactAction = (value: unknown): value is ContactAction =>
  value === 'call' || value === 'copy' || value === 'link' || value === 'display';

const makeId = () => `id-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const normalizeCategory = (category: any): ContactCategory => ({
  id: typeof category?.id === 'string' ? category.id : makeId(),
  name: typeof category?.name === 'string' && category.name.trim() ? category.name : 'Untitled Category',
  type: isCategoryType(category?.type) ? category.type : 'Emergency Hotline',
  description: typeof category?.description === 'string' ? category.description : '',
  order: typeof category?.order === 'number' ? category.order : undefined,
});

const normalizeContact = (contact: any): ContactItem => ({
  id: typeof contact?.id === 'string' ? contact.id : makeId(),
  categoryId: typeof contact?.categoryId === 'string' ? contact.categoryId : '',
  name: typeof contact?.name === 'string' ? contact.name : '',
  value: typeof contact?.value === 'string' ? contact.value : '',
  action: isContactAction(contact?.action) ? contact.action : 'display',
  iconKey: (contact?.iconKey && contact.iconKey in ICON_MAP ? contact.iconKey : 'phone') as keyof typeof ICON_MAP,
  iconColor: typeof contact?.iconColor === 'string' ? contact.iconColor : '#0ea5e9',
  isActive: typeof contact?.isActive === 'boolean' ? contact.isActive : true,
  order: typeof contact?.order === 'number' ? contact.order : undefined,
});

export const MainHotlineAndContact = () => {
  const { isDark } = useTheme();
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const scaleValue = useRef(new Animated.Value(0)).current;
  const authUser = useAuth(state => state.authUser);
  const authLoading = useAuth(state => state.isLoading);
  const [categories, setCategories] = useState<ContactCategory[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const lastUidRef = useRef<string | null>(null);

  const handleClose = () => {
    // Scale out animation
    Animated.timing(scaleValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowAlertDialog(false);
    });
  };

  const showAlert = () => {
    setShowAlertDialog(true);
    // Scale in animation with bounce
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // Auto hide after 3 seconds
  useEffect(() => {
    if (showAlertDialog) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlertDialog]);

  useEffect(() => {
    if (authLoading) return;
    const uid = authUser?.uid ?? null;
    if (lastUidRef.current === uid) return;
    lastUidRef.current = uid;

    if (!uid) {
      setIsLoading(false);
      setLoadError('Please sign in to view contacts.');
      return;
    }

    const docRef = doc(db, 'contacts', 'main');

    const applyContacts = (payload: any) => {
      const nextCategories = Array.isArray(payload?.categories)
        ? payload.categories.map(normalizeCategory)
        : [];
      const nextContacts = Array.isArray(payload?.contacts) ? payload.contacts.map(normalizeContact) : [];

      setCategories(nextCategories);
      setContacts(nextContacts);
      setIsLoading(false);
      setLoadError(null);
    };

    const loadContacts = async () => {
      let hasCache = false;

      try {
        const cached = await getDocFromCache(docRef);
        if (cached.exists()) {
          applyContacts(cached.data());
          hasCache = true;
        }
      } catch (error) {
        // Cache miss is expected for first load or after app restart.
      }

      try {
        const serverDoc = await getDoc(docRef);
        if (serverDoc.exists()) {
          applyContacts(serverDoc.data());
        } else if (!hasCache) {
          setCategories([]);
          setContacts([]);
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error('Failed to load contacts:', error);
        setLoadError(error?.message || 'Failed to load contacts');
        if (!hasCache) {
          setIsLoading(false);
        }
      }
    };

    loadContacts();
  }, [authLoading, authUser]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [categories]);

  const activeContacts = useMemo(() => {
    return contacts.filter(contact => contact.isActive);
  }, [contacts]);

  const contactsByCategory = useMemo(() => {
    return activeContacts.reduce<Record<string, ContactItem[]>>((acc, contact) => {
      if (!contact.categoryId) return acc;
      if (!acc[contact.categoryId]) {
        acc[contact.categoryId] = [];
      }
      acc[contact.categoryId].push(contact);
      return acc;
    }, {});
  }, [activeContacts]);

  const emergencyCategories = useMemo(
    () => sortedCategories.filter(category => category.type === 'Emergency Hotline'),
    [sortedCategories]
  );

  const infoCategories = useMemo(
    () => sortedCategories.filter(category => category.type === 'Contact Information'),
    [sortedCategories]
  );

  const emergencyHasContacts = useMemo(
    () => emergencyCategories.some(category => (contactsByCategory[category.id]?.length ?? 0) > 0),
    [emergencyCategories, contactsByCategory]
  );

  const infoHasContacts = useMemo(
    () => infoCategories.some(category => (contactsByCategory[category.id]?.length ?? 0) > 0),
    [infoCategories, contactsByCategory]
  );

  const sortedContactsForCategory = (categoryId: string) => {
    const list = contactsByCategory[categoryId] ?? [];
    return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  const callNumber = (value: string) => {
    if (!value) return;
    Linking.openURL(`tel:${value}`);
  };

  const copyValue = async (value: string) => {
    if (!value) return;
    await Clipboard.setStringAsync(value);
    showAlert();
  };

  const openInAppBrowser = async (url: string) => {
    if (!url) return;

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

  const handleContactAction = (contact: ContactItem) => {
    switch (contact.action) {
      case 'call':
        callNumber(contact.value);
        break;
      case 'copy':
        copyValue(contact.value);
        break;
      case 'link':
        openInAppBrowser(contact.value);
        break;
      case 'display':
      default:
        break;
    }
  };

  const renderContactCard = (contact: ContactItem) => {
    const Icon = ICON_MAP[contact.iconKey] ?? Phone;
    const actionLabel =
      contact.action === 'call'
        ? 'Call'
        : contact.action === 'copy'
        ? 'Copy'
        : contact.action === 'link'
        ? 'Open'
        : '';

    return (
      <View
        key={contact.id}
        style={[
          styles.contactCard,
          styles.shadowCard,
          {
            backgroundColor: isDark ? '#1f2937' : 'white',
            borderColor: isDark ? '#374151' : '#e5e7eb',
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: contact.iconColor }]}>
          <Icon color="white" size={20} />
        </View>
        <View style={styles.contactContent}>
          <Text bold size="sm" style={{ color: isDark ? '#ffffff' : '#111827' }}>
            {contact.name}
          </Text>
          <Text size="xs" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
            {contact.value}
          </Text>
        </View>
        {contact.action !== 'display' && (
          <Pressable
            style={[
              styles.actionButton,
              {
                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                borderColor: isDark ? '#4b5563' : '#e5e7eb',
              },
            ]}
            onPress={() => handleContactAction(contact)}
          >
            {contact.action === 'copy' && <Copy color={isDark ? '#e5e7eb' : '#374151'} size={16} />}
            {contact.action === 'call' && <Phone color={isDark ? '#e5e7eb' : '#374151'} size={16} />}
            {contact.action === 'link' && <ExternalLink color={isDark ? '#e5e7eb' : '#374151'} size={16} />}
            <Text size="xs" style={[styles.actionText, { color: isDark ? '#e5e7eb' : '#374151' }]}>
              {actionLabel}
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  const renderCategoryBlock = (category: ContactCategory) => {
    const list = sortedContactsForCategory(category.id);
    if (list.length === 0) return null;

    return (
      <View key={category.id} style={styles.categoryBlock}>
        <Text bold size="sm" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>
          {category.name}
        </Text>
        {!!category.description && (
          <Text size="xs" style={{ color: isDark ? '#9ca3af' : '#6b7280', marginTop: 2 }}>
            {category.description}
          </Text>
        )}
        <View style={styles.categoryContacts}>{list.map(renderContactCard)}</View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Section with Gradient */}
      <LinearGradient
        colors={
          isDark ? [Colors.background.dark, Colors.background.dark] : [Colors.background.light, Colors.background.light]
        }
        style={styles.headerGradient}
      >
        <View style={[styles.logoContainer, styles.shadowCard]}>
          <Image
            className="rounded-2xl"
            source={require('../../../assets/images/Cavite-Logo 1.png')}
            style={styles.logo}
            alt="Cavite Logo"
            
          />
        </View>

        <View style={styles.titleContainer}>
          <Text size="xl" bold style={[styles.title]}>
            Emergency Hotlines & Contacts
          </Text>
          <Text size="sm" style={[styles.subtitle]}>
            Province of Cavite
          </Text>
        </View>
      </LinearGradient>

      {/* Description Card */}
      <View
        style={[
          styles.descriptionCard,
          {
            backgroundColor: isDark ? '#1f2937' : 'white',
            borderColor: isDark ? '#374151' : '#e5e7eb',
          },
        ]}
      >
        <Zap color={isDark ? '#fbbf24' : '#f59e0b'} size={24} style={styles.descriptionIcon} />
        <Text style={[styles.description, { color: isDark ? '#d1d5db' : '#374151' }]}>
          Quickly access important hotlines during emergencies. Contact local responders, medical services, rescue
          teams, or government agencies for immediate help and guidance.
        </Text>
      </View>

      {(isLoading || loadError) && (
        <View
          style={[
            styles.noticeCard,
            {
              backgroundColor: isDark ? '#111827' : '#f9fafb',
              borderColor: isDark ? '#374151' : '#e5e7eb',
            },
          ]}
        >
          {isLoading && (
            <Text size="sm" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
              Loading contacts…
            </Text>
          )}
          {loadError && (
            <Text size="xs" style={{ color: isDark ? '#fbbf24' : '#b45309' }}>
              Showing cached contacts (if available). Check your internet connection.
            </Text>
          )}
        </View>
      )}

      {/* Emergency Hotlines Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Phone color={isDark ? '#ef4444' : '#dc2626'} size={24} />
          <Text size="lg" bold style={[styles.sectionTitle, { color: isDark ? '#ef4444' : '#dc2626' }]}>
            Emergency Hotlines
          </Text>
        </View>
        {!emergencyHasContacts && !isLoading ? (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: isDark ? '#1f2937' : 'white',
                borderColor: isDark ? '#374151' : '#e5e7eb',
              },
            ]}
          >
            <Text size="sm" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
              No emergency hotlines available.
            </Text>
          </View>
        ) : (
          emergencyCategories.map(renderCategoryBlock)
        )}
      </View>

      {/* Contacts Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Mail color={isDark ? '#8b5cf6' : '#7c3aed'} size={24} />
          <Text size="lg" bold style={[styles.sectionTitle, { color: isDark ? '#8b5cf6' : '#7c3aed' }]}>
            Contact Information
          </Text>
        </View>
        {!infoHasContacts && !isLoading ? (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: isDark ? '#1f2937' : 'white',
                borderColor: isDark ? '#374151' : '#e5e7eb',
              },
            ]}
          >
            <Text size="sm" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
              No contact information available.
            </Text>
          </View>
        ) : (
          infoCategories.map(renderCategoryBlock)
        )}
      </View>

      {/* Disclaimer */}
      <View>
        <Text size="2xs" bold style={[styles.disclaimerTitle, { color: isDark ? '#fbbf24' : '#f59e0b' }]}>
          Important Notice:
        </Text>
        <Text size="2xs" emphasis="light" style={[styles.disclaimerText]}>
          The contact information listed in this section has been retrieved from official government websites and
          publicly available resources. While we do our best to keep this information accurate and updated, changes may
          occur without prior notice. For the most reliable and up-to-date details, please refer directly to the
          official government channels.
        </Text>
      </View>

      {/* Success Alert Dialog */}
      <CustomAlertDialog
        showAlertDialog={showAlertDialog}
        handleClose={handleClose}
        text="Contact Copied to Clipboard!"
      />
    </View>
  );
};

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
    borderRadius: 200,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    width: 200,
    height: 200,
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
  noticeCard: {
    marginTop: 8,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
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
  contactContent: {
    flex: 1,
    gap: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  actionText: {
    fontWeight: '600',
  },
  categoryBlock: {
    marginBottom: 16,
  },
  categoryContacts: {
    marginTop: 12,
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
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
