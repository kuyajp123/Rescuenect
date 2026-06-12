import { DangerZoneForm } from '@/components/components/danger-zone/DangerZoneForm';
import { DangerZoneMapPicker } from '@/components/components/danger-zone/DangerZoneMapPicker';
import { Body } from '@/components/ui/layout/Body';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { getCurrentPositionOnce } from '@/helper/commonHelpers';
import { getClientMapCenter } from '@/helper/clientMapScope';
import { createDangerZoneReport } from '@/services/dangerZoneService';
import { useAuth } from '@/store/useAuth';
import { useUserData } from '@/store/useBackendResponse';
import { useImagePickerStore } from '@/store/useImagePicker';
import { DangerZoneReportForm } from '@/types/dangerZone';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { LocateFixed, MapPin } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

const createInitialForm = (center: { lat: number; lng: number }): DangerZoneReportForm => ({
  type: 'flooded_road',
  severity: 'medium',
  description: '',
  geometryType: 'point',
  center,
  radiusMeters: 100,
  imageUri: null,
});

const DangerZoneCreateScreen = () => {
  const router = useRouter();
  const { isDark } = useTheme();
  const authUser = useAuth(state => state.authUser);
  const userData = useUserData(state => state.userData);
  const image = useImagePickerStore(state => state.image);
  const setImage = useImagePickerStore(state => state.setImage);
  const defaultCenter = useMemo(() => {
    const [lng, lat] = getClientMapCenter(userData);
    return { lat, lng };
  }, [userData]);

  const [form, setForm] = useState<DangerZoneReportForm>(() => createInitialForm(defaultCenter));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [cameraTriggerKey, setCameraTriggerKey] = useState(0);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['24%', '58%', '88%'], []);

  useEffect(() => {
    setImage(null);
    setForm(createInitialForm(defaultCenter));
    return () => setImage(null);
  }, [defaultCenter, setImage]);

  const updateForm = <K extends keyof DangerZoneReportForm>(key: K, value: DangerZoneReportForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const useCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const coords = await getCurrentPositionOnce();
      if (coords) {
        const [lng, lat] = coords;
        updateForm('center', { lat, lng });
        setCameraTriggerKey(prev => prev + 1);
      }
    } finally {
      setIsLocating(false);
    }
  };

  const validate = () => {
    if (!form.description.trim()) return 'Description is required.';
    if (!form.center || !Number.isFinite(form.center.lat) || !Number.isFinite(form.center.lng)) {
      return 'Select a valid danger-zone location.';
    }
    if (form.geometryType === 'circle' && (!form.radiusMeters || form.radiusMeters <= 0)) {
      return 'Circle radius must be greater than 0.';
    }
    return null;
  };

  const submit = async () => {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!authUser) {
      setError('You need to sign in before submitting a danger-zone report.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await authUser.getIdToken();
      await createDangerZoneReport(
        {
          ...form,
          description: form.description.trim(),
          imageUri: image,
        },
        token
      );
      setImage(null);
      Alert.alert(
        'Report submitted',
        'Your danger-zone report is pending LGU verification. It will not affect public routing until verified.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (submitError: any) {
      const message =
        submitError?.response?.data?.message ||
        submitError?.message ||
        'We could not submit your danger-zone report right now.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Body scrollEnabled={false} style={styles.screen}>
      <View style={StyleSheet.absoluteFill}>
        <DangerZoneMapPicker
          center={form.center}
          geometryType={form.geometryType}
          radiusMeters={form.radiusMeters}
          cameraTriggerKey={cameraTriggerKey}
          containerStyle={StyleSheet.absoluteFill}
          onPick={center => updateForm('center', center)}
          onRadiusChange={radiusMeters => updateForm('radiusMeters', radiusMeters)}
        />
      </View>

      <View pointerEvents="box-none" style={styles.mapOverlay}>
        <View
          style={[
            styles.locationPill,
            { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)' },
          ]}
        >
          <MapPin size={16} color={Colors.semantic.error} />
          <View style={styles.locationText}>
            <Text size="2xs" emphasis="medium">
              Selected location
            </Text>
            <Text size="2xs" emphasis="light">
              {form.center.lat.toFixed(6)}, {form.center.lng.toFixed(6)}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={useCurrentLocation}
          style={[
            styles.locateButton,
            { backgroundColor: isDark ? Colors.background.dark : Colors.background.light },
          ]}
        >
          <LocateFixed size={18} color={isDark ? Colors.icons.dark : Colors.icons.light} />
          <Text size="2xs" style={{ color: isDark ? Colors.text.dark : Colors.text.light }}>
            {isLocating ? 'Locating' : 'Current'}
          </Text>
        </Pressable>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustPan"
        enablePanDownToClose={false}
        backgroundStyle={{
          backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? Colors.border.dark : Colors.border.light,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sheetHeader}>
            <Text size="lg" emphasis="bold">
              Report Danger Zone
            </Text>
            <Text size="xs" emphasis="light">
              Tap the map, drag the pin, then add the report details for LGU verification.
            </Text>
          </View>

          <DangerZoneForm form={form} onChange={updateForm} onSubmit={submit} isSubmitting={isSubmitting} error={error} />
        </BottomSheetScrollView>
      </BottomSheet>
    </Body>
  );
};

export default DangerZoneCreateScreen;

const styles = StyleSheet.create({
  screen: {
    padding: 0,
    paddingBottom: 0,
  },
  mapOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  locationPill: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  locationText: {
    flex: 1,
  },
  locateButton: {
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 42,
  },
  sheetHeader: {
    gap: 4,
    marginBottom: 18,
  },
});
