# Button Variants & Icons Guide

## 🎨 Enhanced Button System Features

Your Community screen now showcases a comprehensive button system with:

### 1. **Buttons with Icons** 🎯

- **Primary with Heart**: Like/Favorite functionality
- **Success with Check**: Task completion actions
- **Error with X**: Delete/Remove actions
- **Warning with AlertTriangle**: Attention-requiring actions

```tsx
<TouchableOpacity
  className="bg-button-primary-default px-4 py-3 rounded-lg flex-row items-center justify-center"
  onPress={() => Alert.alert("Primary Button", "Action performed!")}
>
  <Heart size={20} color="white" style={{ marginRight: 8 }} />
  <Text className="text-button-text-on-primary text-center font-semibold">
    Like Post
  </Text>
</TouchableOpacity>
```

### 2. **Outlined Buttons** 📋

- **Transparent background** with colored borders
- **Theme-aware colors** that adapt to light/dark mode
- **Perfect for secondary actions**

```tsx
<TouchableOpacity
  className="border-2 px-4 py-3 rounded-lg flex-row items-center justify-center bg-transparent"
  style={{ borderColor: isDark ? "#2563eb" : "#0ea5e9" }}
  onPress={() => Alert.alert("Download", "Starting download...")}
>
  <Download
    size={20}
    color={isDark ? "#2563eb" : "#0ea5e9"}
    style={{ marginRight: 8 }}
  />
  <Text
    style={{ color: isDark ? "#2563eb" : "#0ea5e9" }}
    className="text-center font-semibold"
  >
    Download File
  </Text>
</TouchableOpacity>
```

### 3. **Rounded & Circular Buttons** ⭕

- **Circular buttons** (50x50px) for icon-only actions
- **Rounded buttons** with high border-radius for modern look
- **Perfect for floating actions** and quick access

```tsx
{
  /* Circular Button */
}
<TouchableOpacity
  className="bg-button-primary-default items-center justify-center"
  style={{ width: 50, height: 50, borderRadius: 25 }}
  onPress={() => Alert.alert("Profile", "Opening user profile...")}
>
  <User size={24} color="white" />
</TouchableOpacity>;

{
  /* Rounded Button */
}
<TouchableOpacity
  className="bg-button-primary-default px-6 py-3 flex-row items-center justify-center"
  style={{ borderRadius: 25 }}
  onPress={() => Alert.alert("Rating", "Thanks for your rating!")}
>
  <Star size={20} color="white" style={{ marginRight: 8 }} />
  <Text className="text-button-text-on-primary text-center font-semibold">
    Rate 5 Stars
  </Text>
</TouchableOpacity>;
```

### 4. **Dynamic Utility Functions with Icons** 🛠️

- **Theme-aware buttons** using utility functions
- **Icons that adapt** to button color schemes
- **Perfect for reusable components**

```tsx
<TouchableOpacity
  className={`${getButtonTailwindBg(
    "primary",
    "default",
    isDark
  )} ${getButtonTailwindText(
    "primary",
    "solid",
    isDark
  )} px-4 py-3 rounded-lg flex-row items-center justify-center`}
  onPress={() =>
    Alert.alert("Dynamic Button", `Theme: ${isDark ? "Dark" : "Light"} Mode`)
  }
>
  <Settings size={20} color="white" style={{ marginRight: 8 }} />
  <Text
    className={
      getButtonTailwindText("primary", "solid", isDark) +
      " text-center font-semibold"
    }
  >
    Dynamic Primary Button (Theme-aware)
  </Text>
</TouchableOpacity>
```

## 🎯 **Interactive Features**

### Alert Functions

All buttons now include interactive `Alert` dialogs:

- **Simple alerts** for basic feedback
- **Confirmation dialogs** for destructive actions
- **Theme-aware messages** showing current mode

### Icon Library Used

Using **Lucide React Native** icons:

- `Heart`, `Star`, `Check`, `X`, `AlertTriangle`
- `Download`, `Send`, `Plus`, `Settings`
- `User`, `MessageCircle`, `Share`

## 🎨 **Button Variants Summary**

| Variant      | Use Case          | Example                    |
| ------------ | ----------------- | -------------------------- |
| **Solid**    | Primary actions   | Submit, Save, Create       |
| **Outlined** | Secondary actions | Cancel, Download, Settings |
| **Circular** | Icon-only actions | Profile, Add, Share        |
| **Rounded**  | Modern CTAs       | Subscribe, Follow, Rate    |

## 🚀 **Best Practices**

1. **Use icons consistently** - Same action = Same icon
2. **Provide feedback** - Always show user interaction result
3. **Theme awareness** - Colors adapt to light/dark mode
4. **Accessibility** - Icons + text for clarity
5. **Spacing** - Proper margins between icon and text

## 📱 **Testing Your Buttons**

Navigate to the **Community** tab to see:

- ✅ All button variants in action
- ✅ Icons with proper spacing and colors
- ✅ Alert dialogs for user feedback
- ✅ Theme-aware color switching
- ✅ Utility functions working dynamically

Your button system now supports a complete range of interactions with beautiful, consistent styling! 🎨✨
