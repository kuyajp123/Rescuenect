# Button Color Integration Guide

## 🎨 Using Colors.ts with Tailwind CSS

Your button colors are now fully synchronized between `Colors.ts` and Tailwind CSS. Here's how to use them in your Button component:

### 1. Tailwind Classes Available

#### Background Colors

- `bg-button-primary-default` / `bg-button-primary-dark-default`
- `bg-button-primary-hover` / `bg-button-primary-dark-hover`
- `bg-button-primary-pressed` / `bg-button-primary-dark-pressed`
- `bg-button-primary-disabled` / `bg-button-primary-dark-disabled`

And similar patterns for:

- `button-secondary` / `button-secondary-dark`
- `button-success` / `button-success-dark`
- `button-error` / `button-error-dark`
- `button-warning` / `button-warning-dark`

#### Text Colors

- `text-button-text-on-primary`
- `text-button-text-on-secondary`
- `text-button-text-on-secondary-dark`
- `text-button-text-on-disabled`

### 2. Example Button Component

```tsx
import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getButtonTailwindBg,
  getButtonTailwindText,
} from "@/utils/buttonColors";

interface ButtonProps {
  action: "primary" | "secondary" | "success" | "error" | "warning";
  variant: "solid" | "outline" | "link";
  state?: "default" | "hover" | "pressed" | "disabled";
  children: React.ReactNode;
  onPress?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  action,
  variant,
  state = "default",
  children,
  onPress,
}) => {
  const { isDark } = useTheme();

  // Get Tailwind classes
  const bgClass = getButtonTailwindBg(action, state, isDark);
  const textClass = getButtonTailwindText(action, variant, isDark);

  // Base classes
  const baseClasses = "px-4 py-2 rounded-lg";

  // Variant-specific classes
  const variantClasses = {
    solid: `${bgClass} ${textClass}`,
    outline: `border-2 ${getButtonTailwindBorder(
      action,
      state,
      isDark
    )} ${textClass} bg-transparent`,
    link: `${textClass} bg-transparent`,
  };

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses[variant]}`}
      onPress={onPress}
      disabled={state === "disabled"}
    >
      <Text className={textClass}>{children}</Text>
    </TouchableOpacity>
  );
};
```

### 3. Using with State Management

```tsx
import React, { useState } from "react";
import { Button } from "@/components/Button";

const MyComponent = () => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Button
      action="primary"
      variant="solid"
      state={isPressed ? "pressed" : "default"}
      onPress={() => setIsPressed(!isPressed)}
    >
      Click me!
    </Button>
  );
};
```

### 4. Dark Mode Support

The colors automatically switch based on your theme context:

```tsx
const { isDark } = useTheme();

// This will automatically use the correct colors for light/dark mode
<Button action="primary" variant="solid">
  Theme-aware button
</Button>;
```

### 5. CSS Variables Access

You can also use the CSS variables directly in your styles:

```css
.custom-button {
  background-color: rgb(var(--color-button-primary-default));
  color: rgb(var(--color-button-text-on-primary));
}

.custom-button:hover {
  background-color: rgb(var(--color-button-primary-hover));
}

.custom-button:active {
  background-color: rgb(var(--color-button-primary-pressed));
}

.custom-button:disabled {
  background-color: rgb(var(--color-button-primary-disabled));
  color: rgb(var(--color-button-text-on-disabled));
}
```

### 6. Color Consistency

✅ **Colors.ts**: `#2563eb` (Primary Dark Default)
✅ **Tailwind**: `bg-button-primary-dark-default` → `#2563eb`
✅ **CSS Variables**: `--color-button-primary-dark-default` → `37 99 235` (RGB)

All three systems now use the exact same colors!

### 7. Your Secondary Color

Your secondary color `#da9e22` is preserved and available as:

- `--color-secondary-500` in CSS variables
- `secondary.500` in Tailwind theme
- `Colors.semantic.secondary` in your Colors.ts (if you add it)

## 🎯 Next Steps

1. Update your Button component to use the new Tailwind classes
2. Test the color consistency across light/dark modes
3. Verify that all button states render correctly
4. Update any other components that use button colors

Your color system is now fully synchronized! 🎨✨
