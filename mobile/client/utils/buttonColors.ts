/**
 * Button Color Utilities for Tailwind CSS
 * Maps Colors.ts button colors to Tailwind classes
 */

  export type ButtonAction = 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  export type ButtonState = 'default' | 'hover' | 'pressed' | 'disabled';
  export type ButtonVariant = 'solid' | 'outline' | 'link';

/**
 * Get Tailwind background color class for button
 */
export const getButtonTailwindBg = (
  action: ButtonAction,
  state: ButtonState,
  isDark: boolean = false
): string => {
  const darkSuffix = isDark ? '-dark' : '';
  return `bg-button-${action}${darkSuffix}-${state}`;
};

/**
 * Get Tailwind text color class for button
 */
export const getButtonTailwindText = (
  action: ButtonAction,
  variant: ButtonVariant,
  isDark: boolean = false
): string => {
  if (variant === 'solid') {
    if (action === 'secondary') {
      return isDark ? 'text-button-text-on-secondary-dark' : 'text-button-text-on-secondary';
    }
    return 'text-button-text-on-primary';
  } else {
    // For outline and link variants, use the button's default color as text color
    const darkSuffix = isDark ? '-dark' : '';
    return `text-button-${action}${darkSuffix}-default`;
  }
};

/**
 * Get Tailwind border color class for button
 */
export const getButtonTailwindBorder = (
  action: ButtonAction,
  state: ButtonState,
  isDark: boolean = false
): string => {
  const darkSuffix = isDark ? '-dark' : '';
  return `border-button-${action}${darkSuffix}-${state}`;
};

/**
 * Example usage in your Button component:
 * 
 * ```tsx
 * import { getButtonTailwindBg, getButtonTailwindText } from '@/utils/buttonColors';
 * 
 * const Button = ({ action, state, variant, isDark, children }) => {
 *   const bgClass = getButtonTailwindBg(action, state, isDark);
 *   const textClass = getButtonTailwindText(action, variant, isDark);
 *   
 *   return (
 *     <TouchableOpacity className={`${bgClass} ${textClass} p-3 rounded-lg`}>
 *       <Text>{children}</Text>
 *     </TouchableOpacity>
 *   );
 * };
 * ```
 */
