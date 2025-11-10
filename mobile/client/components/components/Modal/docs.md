# Modal Component API Documentation

## Overview
A customizable modal dialog component built with React Native that provides a flexible interface for displaying content with optional actions.

## Import
```javascript
import Modal from '@/components/path-to-modal';
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `modalVisible` | `boolean` | Controls the visibility state of the modal. When `true`, the modal is displayed. |
| `onClose` | `() => void` | Callback function invoked when the modal should be closed (e.g., when backdrop is tapped). |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "full"` | `"md"` | Determines the width/size of the modal. |
| `iconOnPress` | `() => void` | `undefined` | Callback function for when the close icon (X) is pressed. |
| `sizeIcon` | `number` | `20` | Size of the close icon in pixels. |
| `primaryText` | `string` | `undefined` | Main heading text displayed in the modal body. Rendered in bold. |
| `secondaryText` | `string` | `undefined` | Supporting text displayed below the primary text. |
| `primaryButtonText` | `string` | `undefined` | Label text for the primary action button (right button). |
| `secondaryButtonText` | `string` | `undefined` | Label text for the secondary action button (left button). |
| `primaryButtonOnPress` | `() => void` | `undefined` | Callback function invoked when the primary button is pressed. |
| `secondaryButtonOnPress` | `() => void` | `undefined` | Callback function invoked when the secondary button is pressed. |
| `renderImage` | `() => React.ReactNode` | `undefined` | Function that returns a custom React component to display above the text content (typically an image or icon). |
| `textAlign` | `"left" \| "center" \| "right"` | `"center"` | Alignment for both primary and secondary text. |

## Usage Examples

### Basic Modal
```javascript
<Modal
  modalVisible={isOpen}
  onClose={() => setIsOpen(false)}
  primaryText="Welcome!"
  secondaryText="This is a basic modal example"
/>
```

### Modal with Actions
```javascript
<Modal
  modalVisible={showConfirm}
  onClose={() => setShowConfirm(false)}
  size="sm"
  primaryText="Confirm Action"
  secondaryText="Are you sure you want to proceed?"
  primaryButtonText="Confirm"
  secondaryButtonText="Cancel"
  primaryButtonOnPress={handleConfirm}
  secondaryButtonOnPress={() => setShowConfirm(false)}
/>
```

### Modal with Custom Image
```javascript
<Modal
  modalVisible={showSuccess}
  onClose={() => setShowSuccess(false)}
  size="lg"
  renderImage={() => (
    <Image
      source={require('./success-icon.png')}
      style={{ width: 80, height: 80, alignSelf: 'center' }}
    />
  )}
  primaryText="Success!"
  secondaryText="Your action was completed successfully"
  primaryButtonText="Done"
  primaryButtonOnPress={() => setShowSuccess(false)}
  textAlign="center"
/>
```

### Full-Screen Modal with Custom Close Handler
```javascript
<Modal
  modalVisible={isFullscreen}
  onClose={handleModalClose}
  size="full"
  iconOnPress={handleCustomClose}
  sizeIcon={24}
  primaryText="Full Screen Content"
  secondaryText="This modal takes up the entire screen"
  textAlign="left"
/>
```

## Notes
- The component automatically adapts to dark/light theme using the `useTheme` context
- Both buttons are rendered with a `link` variant and `fit` width
- The close icon (X) appears in the top-right corner of the modal
- If `renderImage` is provided, the image will appear above the text content
- Text alignment applies to both primary and secondary text uniformly