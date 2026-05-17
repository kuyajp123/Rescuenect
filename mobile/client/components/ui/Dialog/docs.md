# Dialog Component API Documentation

## Overview
A drop-in replacement for the old `Modal` wrapper, built on top of `heroui-native`'s `Dialog`.

## Import
```ts
import Dialog from '@/components/components/Dialog';
```

## Props

### Required
| Prop | Type | Description |
|------|------|-------------|
| `onClose` | `() => void` | Called when the dialog requests to close (overlay press / close button / programmatic close). |

### Visibility (pick one)
| Prop | Type | Description |
|------|------|-------------|
| `modalVisible` | `boolean` | Matches the old `Modal` API. |
| `isOpen` | `boolean` | Alias for easier migration from other modal libs. |

### Content (same as old `Modal`)
| Prop | Type |
|------|------|
| `primaryText` | `string` |
| `secondaryText` | `string` |
| `renderImage` | `() => React.ReactNode` |
| `items` | `Array<{ label: string; name?: string; onPress?: () => void }>` |
| `children` | `React.ReactNode` |

### Footer actions (same as old `Modal`)
| Prop | Type |
|------|------|
| `primaryButtonText` | `string` |
| `secondaryButtonText` | `string` |
| `primaryButtonOnPress` | `() => void` |
| `secondaryButtonOnPress` | `() => void` |
| `primaryButtonAction` | `'primary' \| 'secondary' \| 'success' \| 'error' \| 'warning'` |
| `primaryButtonVariant` | `'solid' \| 'outline' \| 'link'` |

### Layout / behavior
| Prop | Type | Default |
|------|------|---------|
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` |
| `showCloseButton` | `boolean` | `true` |
| `sizeIcon` | `number` | `20` |
| `iconOnPress` | `() => void` | `undefined` |
| `isSwipeable` | `boolean` | `false` |
| `closeOnOverlayPress` | `boolean` | `true` |
| `portalStyle` | `StyleProp<ViewStyle>` | `undefined` |
| `contentStyle` | `StyleProp<ViewStyle>` | `undefined` |

## Usage Example
```tsx
<Dialog
  modalVisible={open}
  onClose={() => setOpen(false)}
  primaryText="Exit App"
  secondaryText="Are you sure you want to exit?"
  primaryButtonText="Exit"
  primaryButtonVariant="solid"
  primaryButtonAction="error"
  primaryButtonOnPress={() => BackHandler.exitApp()}
  secondaryButtonText="Cancel"
  secondaryButtonOnPress={() => setOpen(false)}
/>
```

