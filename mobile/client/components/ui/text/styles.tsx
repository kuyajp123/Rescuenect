import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { isWeb } from '@gluestack-ui/nativewind-utils/IsWeb';

const baseStyle = isWeb
  ? 'font-sans tracking-sm my-0 bg-transparent border-0 box-border display-inline list-none margin-0 padding-0 position-relative text-start no-underline whitespace-pre-wrap word-wrap-break-word'
  : '';

export const textStyle = tva({
  base: `text-typography-700 font-body ${baseStyle}`,

  variants: {
    isTruncated: {
      true: 'web:truncate',
    },
    bold: {
      true: 'font-bold',
    },
    underline: {
      true: 'underline',
    },
    strikeThrough: {
      true: 'line-through',
    },
    size: {
      '2xs': 'text-2xs',
      'xs': 'text-xs',
      'sm': 'text-sm',
      'md': 'text-base',
      'lg': 'text-lg',
      'xl': 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl',
      '5xl': 'text-5xl',
      '6xl': 'text-6xl',
    },
    sub: {
      true: 'text-xs',
    },
    italic: {
      true: 'italic',
    },
    highlight: {
      true: 'bg-yellow-500',
    },
    emphasis: {
      'light': 'font-light',
      'normal': 'font-normal',
      'medium': 'font-medium',
      'semibold': 'font-semibold',
      'bold': 'font-bold',
      'extrabold': 'font-extrabold',
    },
  },
});

/**
 * Text style variants using Tailwind CSS classes with tva (tailwind-variants).
 * 
 * @description A comprehensive text styling system that provides various text formatting options
 * including size, weight, decoration, and visual effects.
 * 
 * @variant isTruncated - Truncates text with ellipsis on web platforms
 * @variant bold - Applies bold font weight
 * @variant underline - Adds underline text decoration
 * @variant strikeThrough - Adds line-through text decoration
 * @variant size - Controls text size:
 *   - '2xs': 0.625rem (10px)
 *   - 'xs': 0.75rem (12px)
 *   - 'sm': 0.875rem (14px)
 *   - 'md': 1rem (16px)
 *   - 'lg': 1.125rem (18px)
 *   - 'xl': 1.25rem (20px)
 *   - '2xl': 1.5rem (24px)
 *   - '3xl': 1.875rem (30px)
 *   - '4xl': 2.25rem (36px)
 *   - '5xl': 3rem (48px)
 *   - '6xl': 3.75rem (60px)
 * @variant sub - Applies small subscript-like text size (0.75rem / 12px)
 * @variant italic - Applies italic font style
 * @variant highlight - Adds yellow background highlight
 * 
 * @example
 * ```tsx
 * <Text className={textStyle({ size: 'lg', bold: true, highlight: true })}>
 *   Large bold highlighted text
 * </Text>
 * ```
 */