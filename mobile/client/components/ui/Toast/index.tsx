import type { ToastShowConfig, ToastShowOptions } from 'heroui-native';
import { Toast as HeroToast, useToast as useHeroToast } from 'heroui-native';
import { useCallback } from 'react';

export type ToastVariant = NonNullable<ToastShowConfig['variant']>;

export type ShowToastConfig = Omit<ToastShowConfig, 'label'> & {
  label: string;
};

/**
 * Thin wrapper around `heroui-native` Toast APIs.
 *
 * - Keeps HeroUI Native's default UI/animations by default.
 * - Adds convenience helpers for common variants.
 */
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react-native';

export function useAppToast() {
  const { toast, isToastVisible } = useHeroToast();

  const show = useCallback((options: string | ToastShowOptions) => toast.show(options), [toast]);

  const showConfig = useCallback(
    (config: ShowToastConfig) => {
      let IconComponent = Info;
      let iconColor = '#0ea5e9'; // accent

      if (config.variant === 'success') {
        IconComponent = CheckCircle;
        iconColor = '#10b981';
      } else if (config.variant === 'danger') {
        IconComponent = XCircle;
        iconColor = '#ef4444';
      } else if (config.variant === 'warning') {
        IconComponent = AlertCircle;
        iconColor = '#f59e0b';
      }

      return toast.show({
        ...config,
        icon: config.icon ? config.icon : <IconComponent size={24} color={iconColor} />,
      });
    },
    [toast]
  );

  const showSuccess = useCallback(
    (label: string, config: Omit<ShowToastConfig, 'label' | 'variant'> = {}) =>
      showConfig({ variant: 'success', label, ...config }),
    [showConfig]
  );

  const showWarning = useCallback(
    (label: string, config: Omit<ShowToastConfig, 'label' | 'variant'> = {}) =>
      showConfig({ variant: 'warning', label, ...config }),
    [showConfig]
  );

  const showDanger = useCallback(
    (label: string, config: Omit<ShowToastConfig, 'label' | 'variant'> = {}) =>
      showConfig({ variant: 'danger', label, ...config }),
    [showConfig]
  );

  const showAccent = useCallback(
    (label: string, config: Omit<ShowToastConfig, 'label' | 'variant'> = {}) =>
      showConfig({ variant: 'accent', label, ...config }),
    [showConfig]
  );

  return {
    toast,
    isToastVisible,
    show,
    showConfig,
    showSuccess,
    showWarning,
    showDanger,
    showAccent,
  };
}

// Re-export HeroUI's compound Toast component + hook for advanced use.
export { HeroToast as Toast, useHeroToast as useToast };
export type { ToastShowConfig, ToastShowOptions };

export default HeroToast;
