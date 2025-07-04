import Body from '@/components/ui/Body';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/text';
import { Colors, getButtonColor, getButtonTextColor } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const { isDark } = useTheme();

  // Color display component
  const ColorBox = ({ color, label, textColor = '#000000' }: { color: string; label: string; textColor?: string }) => (
    <View style={[styles.colorBox, { backgroundColor: color, height: 'auto' }]}>
      <Text style={[styles.colorLabel, { color: textColor }]} size="xs">
        {label}
      </Text>
      <Text style={[styles.colorCode, { color: textColor }]} size="2xs">
        {color}
      </Text>
    </View>
  );

  return (
    <Body>
      {/* Button Color Palette Display */}
      <Card style={{ marginBottom: 16 }}>
        <Text size="2xl" emphasis="bold" style={{ marginBottom: 16, textAlign: 'center' }}>
          🎨 Complete Button Color Palette
        </Text>

        {/* Primary Button Colors */}
        <Text size="lg" emphasis="semibold" style={{ marginBottom: 12 }}>
          Primary Button Colors ({isDark ? 'Dark Mode' : 'Light Mode'})
        </Text>
        <Box style={styles.colorRow}>
          <ColorBox 
            color={getButtonColor('primary', 'default', isDark)} 
            label="Default" 
            textColor="#ffffff"
          />
          <ColorBox 
            color={getButtonColor('primary', 'hover', isDark)} 
            label="Hover" 
            textColor="#ffffff"
          />
          <ColorBox 
            color={getButtonColor('primary', 'pressed', isDark)} 
            label="Pressed" 
            textColor="#ffffff"
          />
          <ColorBox 
            color={getButtonColor('primary', 'disabled', isDark)} 
            label="Disabled" 
            textColor="#ffffff"
          />
        </Box>

        {/* Secondary Button Colors */}
        <Text size="lg" emphasis="semibold" style={{ marginBottom: 12, marginTop: 16 }}>
          Secondary Button Colors ({isDark ? 'Dark Mode' : 'Light Mode'})
        </Text>
        <Box style={styles.colorRow}>
          <ColorBox 
            color={getButtonColor('secondary', 'default', isDark)} 
            label="Default" 
            textColor={isDark ? Colors.text.dark : Colors.text.light}
          />
          <ColorBox 
            color={getButtonColor('secondary', 'hover', isDark)} 
            label="Hover" 
            textColor={isDark ? Colors.text.dark : Colors.text.light}
          />
          <ColorBox 
            color={getButtonColor('secondary', 'pressed', isDark)} 
            label="Pressed" 
            textColor={Colors.text.dark}
          />
          <ColorBox 
            color={getButtonColor('secondary', 'disabled', isDark)} 
            label="Disabled" 
            textColor={isDark ? Colors.text.dark : Colors.text.light}
          />
        </Box>

        {/* Success Button Colors */}
        <Text size="lg" emphasis="semibold" style={{ marginBottom: 12, marginTop: 16 }}>
          Success Button Colors ({isDark ? 'Dark Mode' : 'Light Mode'})
        </Text>
        <Box style={styles.colorRow}>
          <ColorBox 
            color={getButtonColor('success', 'default', isDark)} 
            label="Default" 
            textColor="#ffffff"
          />
          <ColorBox 
            color={getButtonColor('success', 'hover', isDark)} 
            label="Hover" 
            textColor="#ffffff"
          />
          <ColorBox 
            color={getButtonColor('success', 'pressed', isDark)} 
            label="Pressed" 
            textColor="#ffffff"
          />
          <ColorBox 
            color={getButtonColor('success', 'disabled', isDark)} 
            label="Disabled" 
            textColor={isDark ? "#ffffff" : "#000000"}
          />
        </Box>

        {/* Error Button Colors */}
        <Text size="lg" emphasis="semibold" style={{ marginBottom: 12, marginTop: 16 }}>
          Error Button Colors ({isDark ? 'Dark Mode' : 'Light Mode'})
        </Text>
        <Box style={styles.colorRow}>
          <ColorBox 
            color={getButtonColor('error', 'default', isDark)} 
            label="Default" 
            textColor="#ffffff"
          />
          <ColorBox 
            color={getButtonColor('error', 'hover', isDark)} 
            label="Hover" 
            textColor="#ffffff"
          />
          <ColorBox 
            color={getButtonColor('error', 'pressed', isDark)} 
            label="Pressed" 
            textColor="#ffffff"
          />
          <ColorBox 
            color={getButtonColor('error', 'disabled', isDark)} 
            label="Disabled" 
            textColor={isDark ? "#ffffff" : "#000000"}
          />
        </Box>

        {/* Warning Button Colors */}
        <Text size="lg" emphasis="semibold" style={{ marginBottom: 12, marginTop: 16 }}>
          Warning Button Colors ({isDark ? 'Dark Mode' : 'Light Mode'})
        </Text>
        <Box style={styles.colorRow}>
          <ColorBox 
            color={getButtonColor('warning', 'default', isDark)} 
            label="Default" 
            textColor="#ffffff"
          />
          <ColorBox 
            color={getButtonColor('warning', 'hover', isDark)} 
            label="Hover" 
            textColor="#ffffff"
          />
          <ColorBox 
            color={getButtonColor('warning', 'pressed', isDark)} 
            label="Pressed" 
            textColor="#ffffff"
          />
          <ColorBox 
            color={getButtonColor('warning', 'disabled', isDark)} 
            label="Disabled" 
            textColor={isDark ? "#ffffff" : "#000000"}
          />
        </Box>
      </Card>

      {/* Text Colors Section */}
      <Card style={{ marginBottom: 16 }}>
        <Text size="xl" emphasis="semibold" style={{ marginBottom: 16, textAlign: 'center' }}>
          📝 Button Text Colors
        </Text>
        
        <Box style={styles.colorRow}>
          <ColorBox 
            color={Colors.button.text.onPrimary} 
            label="On Primary" 
            textColor="#000000"
          />
          <ColorBox 
            color={Colors.button.text.onSecondary} 
            label="On Secondary" 
            textColor="#ffffff"
          />
          <ColorBox 
            color={Colors.button.text.onSecondaryDark} 
            label="On Secondary Dark" 
            textColor="#000000"
          />
          <ColorBox 
            color={Colors.button.text.onDisabled} 
            label="On Disabled" 
            textColor="#ffffff"
          />
        </Box>
      </Card>

      {/* Overlay Colors Section */}
      <Card style={{ marginBottom: 16 }}>
        <Text size="xl" emphasis="semibold" style={{ marginBottom: 16, textAlign: 'center' }}>
          🌊 Overlay Colors for Outline & Link Buttons
        </Text>
        
        <Text size="md" emphasis="medium" style={{ marginBottom: 8 }}>Light Mode Overlays:</Text>
        <Box style={styles.colorRow}>
          <ColorBox 
            color={Colors.button.overlay.light} 
            label="Light Overlay" 
            textColor="#000000"
          />
          <ColorBox 
            color={Colors.button.overlay.medium} 
            label="Medium Overlay" 
            textColor="#000000"
          />
        </Box>

        <Text size="md" emphasis="medium" style={{ marginBottom: 8, marginTop: 12 }}>Dark Mode Overlays:</Text>
        <Box style={styles.colorRow}>
          <ColorBox 
            color={Colors.button.overlay.lightDark} 
            label="Light Dark Overlay" 
            textColor="#ffffff"
          />
          <ColorBox 
            color={Colors.button.overlay.mediumDark} 
            label="Medium Dark Overlay" 
            textColor="#ffffff"
          />
        </Box>
      </Card>

      {/* Helper Functions Demo */}
      <Card>
        <Text size="xl" emphasis="semibold" style={{ marginBottom: 16, textAlign: 'center' }}>
          🛠️ Helper Functions Demo
        </Text>
        
        <Text size="md" style={{ marginBottom: 8 }}>
          <Text emphasis="medium">getButtonColor('primary', 'hover', {isDark ? 'true' : 'false'}):</Text>
        </Text>
        <ColorBox 
          color={getButtonColor('primary', 'hover', isDark)} 
          label="Dynamic Primary Hover" 
          textColor="#ffffff"
        />

        <Text size="md" style={{ marginBottom: 8, marginTop: 12 }}>
          <Text emphasis="medium">getButtonTextColor('success', 'solid', {isDark ? 'true' : 'false'}):</Text>
        </Text>
        <ColorBox 
          color={getButtonTextColor('success', 'solid', isDark) || '#ffffff'} 
          label="Dynamic Success Text" 
          textColor="#000000"
        />

        <Box style={{ backgroundColor: Colors.brand.light, height: 60, borderRadius: 8, marginTop: 16 }}>

        </Box>
        <Box style={{ backgroundColor: Colors.brand.dark, height: 60, borderRadius: 8, marginTop: 16 }}>

        </Box>

        <Text size="sm" emphasis="light" style={{ marginTop: 16, fontStyle: 'italic' }}>
          These colors automatically adapt to your current theme ({isDark ? 'Dark' : 'Light'} mode).
          Switch your theme to see the colors change dynamically!
        </Text>
      </Card>
    </Body>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#000000',
    borderWidth: 1,
    backgroundColor: '#F8FAFC', // light background color
  },
  box: {
    padding: 10,
    marginVertical: 10,
    borderColor: '#D1D5DB', // light gray border color
    borderWidth: 1,
    backgroundColor: '#FFFFFF', // white background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000', // dark text color
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  colorBox: {
    flex: 1,
    minWidth: 70,
    borderRadius: 8,
    padding: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  colorLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  colorCode: {
    textAlign: 'center',
    opacity: 0.8,
  },
});
