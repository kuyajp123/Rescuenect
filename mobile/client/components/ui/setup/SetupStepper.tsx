import Logo from '@/assets/images/logo/logoVerti.svg';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { CheckCircle2, MapPin, UserRound } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type SetupStepperProps = {
  currentStep: 1 | 2 | 3;
  title: string;
  description?: string;
};

const steps = [
  { id: 1, label: 'Location', Icon: MapPin },
  { id: 2, label: 'Details', Icon: UserRound },
  { id: 3, label: 'Ready', Icon: CheckCircle2 },
] as const;

export const SetupStepper = ({ currentStep, title, description }: SetupStepperProps) => {
  const { isDark } = useTheme();
  const activeColor = isDark ? Colors.brand.dark : Colors.brand.light;
  const completeColor = Colors.semantic.success;
  const mutedTextColor = isDark ? Colors.muted.dark.text : Colors.muted.light.text;
  const borderColor = isDark ? Colors.border.dark : Colors.border.light;
  const surfaceColor = isDark ? Colors.muted.dark.background : '#FFFFFF';
  const inactiveFill = isDark ? '#111827' : Colors.muted.light.background;

  return (
    <View style={styles.header}>
      <Logo width={170} height={92} />
      <View style={[styles.stepperSurface, { backgroundColor: surfaceColor, borderColor }]}>
        <View style={styles.progressRow}>
          {steps.map((step, index) => {
            const isComplete = step.id < currentStep;
            const isActive = step.id === currentStep;
            const Icon = step.Icon;
            const fillColor = isComplete ? completeColor : isActive ? activeColor : inactiveFill;
            const iconColor = isComplete || isActive ? '#FFFFFF' : mutedTextColor;

            return (
              <React.Fragment key={step.id}>
                <View style={styles.stepUnit}>
                  <View style={[styles.stepCircle, { backgroundColor: fillColor, borderColor: fillColor }]}>
                    <Icon size={18} color={iconColor} />
                  </View>
                  <Text
                    size="2xs"
                    bold={isActive}
                    numberOfLines={1}
                    style={{ color: isActive ? activeColor : mutedTextColor }}
                  >
                    {step.label}
                  </Text>
                </View>
                {index < steps.length - 1 ? (
                  <View
                    style={[
                      styles.stepLine,
                      {
                        backgroundColor: step.id < currentStep ? activeColor : borderColor,
                      },
                    ]}
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </View>
      </View>
      <View style={styles.titleBlock}>
        <Text size="2xs" bold style={{ color: activeColor }}>
          Step {currentStep} of {steps.length}
        </Text>
        <Text size="lg" bold>
          {title}
        </Text>
        {description ? (
          <Text size="xs" emphasis="light" style={styles.description}>
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  stepperSurface: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepUnit: {
    width: 66,
    alignItems: 'center',
    gap: 5,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 2,
    marginBottom: 18,
    borderRadius: 2,
  },
  titleBlock: {
    width: '100%',
    gap: 2,
  },
  description: {
    lineHeight: 19,
  },
});
