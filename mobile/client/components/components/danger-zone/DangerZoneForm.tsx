import CustomImagePicker from '@/components/components/CustomImagePicker';
import { Button } from '@/components/components/button/Button';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { DangerZoneGeometryType, DangerZoneSeverity, DangerZoneReportForm } from '@/types/dangerZone';
import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, TextInput, View } from 'react-native';

const DANGER_TYPES = [
  { key: 'flooded_road', label: 'Flooded Road' },
  { key: 'road_blockage', label: 'Road Blockage' },
  { key: 'heavy_traffic', label: 'Heavy Traffic' },
  { key: 'landslide_or_debris', label: 'Landslide / Debris' },
  { key: 'bridge_damage', label: 'Bridge Damage' },
  { key: 'fire', label: 'Fire' },
  { key: 'accident', label: 'Accident' },
  { key: 'unsafe_area', label: 'Unsafe Area' },
  { key: 'power_line_hazard', label: 'Power Line Hazard' },
  { key: 'other', label: 'Other' },
];

const SEVERITIES: { key: DangerZoneSeverity; label: string }[] = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
  { key: 'critical', label: 'Critical' },
];

const RADIUS_MIN = 10;
const RADIUS_MAX = 10000;
const RADIUS_STEP = 25;
const RADIUS_PRESETS = [50, 100, 250, 500];

const clampRadius = (value: number) => Math.max(RADIUS_MIN, Math.min(RADIUS_MAX, Math.round(value)));
const formatRadius = (value = 0) => (value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} km` : `${value} m`);

interface DangerZoneFormProps {
  form: DangerZoneReportForm;
  onChange: <K extends keyof DangerZoneReportForm>(key: K, value: DangerZoneReportForm[K]) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export const DangerZoneForm = ({ form, onChange, onSubmit, isSubmitting, error }: DangerZoneFormProps) => {
  const { isDark } = useTheme();
  const [radiusRailWidth, setRadiusRailWidth] = useState(1);
  const inputStyle = [
    styles.input,
    {
      color: isDark ? Colors.text.dark : Colors.text.light,
      borderColor: isDark ? Colors.border.dark : Colors.border.light,
      backgroundColor: isDark ? Colors.muted.dark.background : Colors.muted.light.background,
    },
  ];

  const renderChip = <T extends string>(label: string, value: T, active: boolean, onPress: () => void) => (
    <Pressable
      key={value}
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: active ? Colors.brand.light : isDark ? Colors.border.dark : Colors.border.light,
          backgroundColor: active ? Colors.brand.light : 'transparent',
        },
      ]}
    >
      <Text size="xs" style={{ color: active ? '#FFFFFF' : isDark ? Colors.text.dark : Colors.text.light }}>
        {label}
      </Text>
    </Pressable>
  );
  const currentRadius = clampRadius(form.radiusMeters || 100);
  const radiusProgress = useMemo(
    () => Math.max(0, Math.min(1, (currentRadius - RADIUS_MIN) / (RADIUS_MAX - RADIUS_MIN))),
    [currentRadius]
  );
  const radiusThumbLeft = Math.max(0, radiusProgress * radiusRailWidth - 11);

  const setRadiusFromLocationX = useCallback(
    (locationX: number) => {
      const progress = Math.max(0, Math.min(1, locationX / Math.max(1, radiusRailWidth)));
      const nextRadius = clampRadius(RADIUS_MIN + progress * (RADIUS_MAX - RADIUS_MIN));
      onChange('radiusMeters', Math.round(nextRadius / RADIUS_STEP) * RADIUS_STEP);
    },
    [onChange, radiusRailWidth]
  );

  const handleRadiusRailLayout = (event: LayoutChangeEvent) => {
    setRadiusRailWidth(Math.max(1, event.nativeEvent.layout.width));
  };

  const adjustRadius = (delta: number) => {
    onChange('radiusMeters', clampRadius(currentRadius + delta));
  };

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorBox}>
          <Text size="xs" style={{ color: Colors.semantic.error }}>
            {error}
          </Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text size="sm" emphasis="medium">
          Geometry
        </Text>
        <View style={styles.chipRow}>
          {renderChip<DangerZoneGeometryType>('Point', 'point', form.geometryType === 'point', () =>
            onChange('geometryType', 'point')
          )}
          {renderChip<DangerZoneGeometryType>('Circle', 'circle', form.geometryType === 'circle', () =>
            onChange('geometryType', 'circle')
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text size="sm" emphasis="medium">
          Danger Type
        </Text>
        <View style={styles.chipRow}>
          {DANGER_TYPES.map(type => renderChip(type.label, type.key, form.type === type.key, () => onChange('type', type.key)))}
        </View>
      </View>

      <View style={styles.section}>
        <Text size="sm" emphasis="medium">
          Severity
        </Text>
        <View style={styles.chipRow}>
          {SEVERITIES.map(severity =>
            renderChip(severity.label, severity.key, form.severity === severity.key, () => onChange('severity', severity.key))
          )}
        </View>
      </View>

      {form.geometryType === 'circle' ? (
        <View style={styles.section}>
          <View style={styles.radiusHeader}>
            <View>
              <Text size="sm" emphasis="medium">
                Radius
              </Text>
              <Text size="2xs" emphasis="light">
                Drag the orange map handle or adjust it here.
              </Text>
            </View>
            <Text size="sm" emphasis="bold" style={{ color: Colors.semantic.error }}>
              {formatRadius(currentRadius)}
            </Text>
          </View>
          {/* <View
            style={styles.radiusRail}
            onLayout={handleRadiusRailLayout}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={event => setRadiusFromLocationX(event.nativeEvent.locationX)}
            onResponderMove={event => setRadiusFromLocationX(event.nativeEvent.locationX)}
          >
            <View style={[styles.radiusRailFill, { width: `${radiusProgress * 100}%` }]} />
            <View style={[styles.radiusThumb, { left: radiusThumbLeft }]} />
          </View> */}
          <View style={styles.radiusActions}>
            <Pressable style={styles.radiusButton} onPress={() => adjustRadius(-RADIUS_STEP)}>
              <Text size="sm" emphasis="bold">
                -
              </Text>
            </Pressable>
            <Pressable style={styles.radiusButton} onPress={() => adjustRadius(RADIUS_STEP)}>
              <Text size="sm" emphasis="bold">
                +
              </Text>
            </Pressable>
            {RADIUS_PRESETS.map(radius =>
              renderChip(`${radius}m`, String(radius), currentRadius === radius, () => onChange('radiusMeters', radius))
            )}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text size="sm" emphasis="medium">
          Description
        </Text>
        <TextInput
          value={form.description}
          onChangeText={value => onChange('description', value)}
          placeholder="Describe what is happening in this area"
          placeholderTextColor={isDark ? Colors.muted.dark.text : Colors.muted.light.text}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={[inputStyle, styles.textarea]}
        />
      </View>

      <View style={styles.section}>
        <Text size="sm" emphasis="medium">
          Evidence Photo
        </Text>
        <CustomImagePicker id="danger-zone-image-picker" />
      </View>

      <Button onPress={onSubmit} isDisabled={isSubmitting} action="primary">
        <Text size="sm" bold style={{ color: '#FFFFFF' }}>
          {isSubmitting ? 'Submitting...' : 'Submit for LGU Verification'}
        </Text>
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  section: {
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  radiusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  radiusRail: {
    height: 36,
    justifyContent: 'center',
  },
  radiusRailFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#F97316',
  },
  radiusThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#F97316',
  },
  radiusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  radiusButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Poppins',
  },
  textarea: {
    minHeight: 110,
  },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.semantic.error,
    padding: 12,
  },
});
