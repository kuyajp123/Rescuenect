import { DangerZoneForm } from '@/components/components/danger-zone/DangerZoneForm';
import { DangerZoneMapPicker } from '@/components/components/danger-zone/DangerZoneMapPicker';
import Body from '@/components/ui/layout/Body';
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
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
    <Body gap={18} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text size="lg" emphasis="bold">
          Report Danger Zone
        </Text>
        <Text size="xs" emphasis="light">
          Resident reports are reviewed by your LGU before appearing publicly.
        </Text>
      </View>

      <View style={styles.locationActions}>
        <View>
          <Text size="sm" emphasis="medium">
            Location
          </Text>
          <Text size="2xs" emphasis="light">
            {form.center.lat.toFixed(6)}, {form.center.lng.toFixed(6)}
          </Text>
        </View>
        <Pressable
          onPress={useCurrentLocation}
          style={[
            styles.locationButton,
            { backgroundColor: isDark ? Colors.muted.dark.background : Colors.muted.light.background },
          ]}
        >
          <Text size="xs" style={{ color: isDark ? Colors.text.dark : Colors.text.light }}>
            {isLocating ? 'Locating...' : 'Use Current'}
          </Text>
        </Pressable>
      </View>

      <DangerZoneMapPicker
        center={form.center}
        geometryType={form.geometryType}
        radiusMeters={form.radiusMeters}
        onPick={center => updateForm('center', center)}
      />

      <DangerZoneForm form={form} onChange={updateForm} onSubmit={submit} isSubmitting={isSubmitting} error={error} />
    </Body>
  );
};

export default DangerZoneCreateScreen;

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  locationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  locationButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
});
