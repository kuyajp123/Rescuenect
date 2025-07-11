import { ColorVerification } from '@/components/ColorVerification';
import { Card } from '@/components/ui/card/Card';
import Body from '@/components/ui/layout/Body';
// import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts/ThemeContext';
import { getButtonTailwindBg, getButtonTailwindText } from '@/utils/buttonColors';
import {
  AlertTriangle,
  Check,
  Download,
  Heart,
  MessageCircle,
  Plus,
  Send,
  Settings,
  Share,
  Star,
  User,
  X
} from 'lucide-react-native';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CommunityScreen() {
  const { isDark } = useTheme();

  return (
      <Body gap={10}>
        <Card>
          <Text style={styles.title}>Welcome to the Community Screen</Text>
          <Text style={styles.subtitle}>
            🎨 Button Color System Demo ({isDark ? 'Dark' : 'Light'} Mode)
          </Text>
        </Card>

        {/* Color Verification Component */}
        <Card>
          <ColorVerification />
        </Card>

        {/* Example Usage with Regular Button Components */}
        <Card>
          <Text style={styles.sectionTitle}>Example Button Usage:</Text>
          <View style={{ gap: 10 }}>
            {/* Primary Button Examples */}
            <TouchableOpacity className="bg-button-primary-default px-4 py-3 rounded-lg">
              <Text className="text-button-text-on-primary text-center font-semibold">
                Primary Button
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-button-primary-dark-default px-4 py-3 rounded-lg">
              <Text className="text-button-text-on-primary text-center font-semibold">
                Primary Dark Button
              </Text>
            </TouchableOpacity>

            {/* Secondary Button Examples */}
            <TouchableOpacity className="bg-button-secondary-default border-2 border-gray-300 px-4 py-3 rounded-lg">
              <Text className="text-button-text-on-secondary text-center font-semibold">
                Secondary Button
              </Text>
            </TouchableOpacity>

            {/* Success Button Example */}
            <TouchableOpacity className="bg-button-success-default px-4 py-3 rounded-lg">
              <Text className="text-button-text-on-primary text-center font-semibold">
                Success Button
              </Text>
            </TouchableOpacity>

            {/* Error Button Example */}
            <TouchableOpacity className="bg-button-error-default px-4 py-3 rounded-lg">
              <Text className="text-button-text-on-primary text-center font-semibold">
                Error Button
              </Text>
            </TouchableOpacity>

            {/* Warning Button Example */}
            <TouchableOpacity className="bg-button-warning-default px-4 py-3 rounded-lg">
              <Text className="text-button-text-on-primary text-center font-semibold">
                Warning Button
              </Text>
            </TouchableOpacity>

            {/* Interactive Button Example */}
            <TouchableOpacity 
              className="bg-button-primary-hover px-4 py-3 rounded-lg"
              activeOpacity={0.8}
            >
              <Text className="text-button-text-on-primary text-center font-semibold">
                Interactive Button (Hover State)
              </Text>
            </TouchableOpacity>

            {/* Disabled Button Example */}
            <TouchableOpacity 
              className="bg-button-primary-disabled px-4 py-3 rounded-lg"
              disabled={true}
            >
              <Text className="text-button-text-on-disabled text-center font-semibold">
                Disabled Button
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Buttons with Icons */}
        <Card>
          <Text style={styles.sectionTitle}>Buttons with Icons:</Text>
          <View style={{ gap: 10 }}>
            {/* Primary Button with Icon */}
            <TouchableOpacity 
              className="bg-button-primary-default px-4 py-3 rounded-lg flex-row items-center justify-center"
              onPress={() => Alert.alert('Primary Button', 'Primary button with heart icon pressed!')}
            >
              <Heart size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-button-text-on-primary text-center font-semibold">
                Like Post
              </Text>
            </TouchableOpacity>

            {/* Success Button with Icon */}
            <TouchableOpacity 
              className="bg-button-success-default px-4 py-3 rounded-lg flex-row items-center justify-center"
              onPress={() => Alert.alert('Success!', 'Action completed successfully!')}
            >
              <Check size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-button-text-on-primary text-center font-semibold">
                Complete Task
              </Text>
            </TouchableOpacity>

            {/* Error Button with Icon */}
            <TouchableOpacity 
              className="bg-button-error-default px-4 py-3 rounded-lg flex-row items-center justify-center"
              onPress={() => Alert.alert('Delete', 'Are you sure you want to delete this item?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive' }
              ])}
            >
              <X size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-button-text-on-primary text-center font-semibold">
                Delete Item
              </Text>
            </TouchableOpacity>

            {/* Warning Button with Icon */}
            <TouchableOpacity 
              className="bg-button-warning-default px-4 py-3 rounded-lg flex-row items-center justify-center"
              onPress={() => Alert.alert('Warning!', 'This action requires attention.')}
            >
              <AlertTriangle size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-button-text-on-primary text-center font-semibold">
                Show Warning
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Outlined Buttons */}
        <Card>
          <Text style={styles.sectionTitle}>Outlined Buttons:</Text>
          <View style={{ gap: 10 }}>
            {/* Primary Outlined Button */}
            <TouchableOpacity 
              className="border-2 px-4 py-3 rounded-lg flex-row items-center justify-center bg-transparent"
              style={{ borderColor: isDark ? '#2563eb' : '#0ea5e9' }}
              onPress={() => Alert.alert('Download', 'Starting download...')}
            >
              <Download size={20} color={isDark ? '#2563eb' : '#0ea5e9'} style={{ marginRight: 8 }} />
              <Text style={{ color: isDark ? '#2563eb' : '#0ea5e9' }} className="text-center font-semibold">
                Download File
              </Text>
            </TouchableOpacity>

            {/* Success Outlined Button */}
            <TouchableOpacity 
              className="border-2 px-4 py-3 rounded-lg flex-row items-center justify-center bg-transparent"
              style={{ borderColor: '#10b981' }}
              onPress={() => Alert.alert('Send', 'Message sent successfully!')}
            >
              <Send size={20} color="#10b981" style={{ marginRight: 8 }} />
              <Text style={{ color: '#10b981' }} className="text-center font-semibold">
                Send Message
              </Text>
            </TouchableOpacity>

            {/* Error Outlined Button */}
            <TouchableOpacity 
              className="border-2 px-4 py-3 rounded-lg flex-row items-center justify-center bg-transparent"
              style={{ borderColor: '#ef4444' }}
              onPress={() => Alert.alert('Cancel', 'Operation cancelled')}
            >
              <X size={20} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={{ color: '#ef4444' }} className="text-center font-semibold">
                Cancel Order
              </Text>
            </TouchableOpacity>

            {/* Secondary Outlined Button */}
            <TouchableOpacity 
              className="border-2 px-4 py-3 rounded-lg flex-row items-center justify-center bg-transparent"
              style={{ borderColor: '#da9e22' }}
              onPress={() => Alert.alert('Settings', 'Opening settings...')}
            >
              <Settings size={20} color="#da9e22" style={{ marginRight: 8 }} />
              <Text style={{ color: '#da9e22' }} className="text-center font-semibold">
                Open Settings
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Rounded/Circular Buttons */}
        <Card>
          <Text style={styles.sectionTitle}>Rounded & Circular Buttons:</Text>
          <View style={{ gap: 15 }}>
            {/* Circular Icon Buttons */}
            <View style={{ flexDirection: 'row', gap: 15, justifyContent: 'center', alignItems: 'center' }}>
              <TouchableOpacity 
                className="bg-button-primary-default items-center justify-center"
                style={{ width: 50, height: 50, borderRadius: 25 }}
                onPress={() => Alert.alert('Profile', 'Opening user profile...')}
              >
                <User size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity 
                className="bg-button-success-default items-center justify-center"
                style={{ width: 50, height: 50, borderRadius: 25 }}
                onPress={() => Alert.alert('Add', 'Adding new item...')}
              >
                <Plus size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity 
                className="bg-button-warning-default items-center justify-center"
                style={{ width: 50, height: 50, borderRadius: 25 }}
                onPress={() => Alert.alert('Messages', 'Opening messages...')}
              >
                <MessageCircle size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity 
                className="bg-button-error-default items-center justify-center"
                style={{ width: 50, height: 50, borderRadius: 25 }}
                onPress={() => Alert.alert('Share', 'Opening share options...')}
              >
                <Share size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Rounded Buttons (with more border radius) */}
            <TouchableOpacity 
              className="bg-button-primary-default px-6 py-3 flex-row items-center justify-center"
              style={{ borderRadius: 25 }}
              onPress={() => Alert.alert('Rating', 'Thanks for your rating!')}
            >
              <Star size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-button-text-on-primary text-center font-semibold">
                Rate 5 Stars
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="bg-button-success-default px-6 py-3 flex-row items-center justify-center"
              style={{ borderRadius: 25 }}
              onPress={() => Alert.alert('Subscribe', 'Subscription activated!')}
            >
              <Check size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-button-text-on-primary text-center font-semibold">
                Subscribe Now
              </Text>
            </TouchableOpacity>

            {/* Outlined Rounded Button */}
            <TouchableOpacity 
              className="border-2 px-6 py-3 flex-row items-center justify-center bg-transparent"
              style={{ borderRadius: 25, borderColor: isDark ? '#2563eb' : '#0ea5e9' }}
              onPress={() => Alert.alert('Follow', 'Following user...')}
            >
              <Plus size={20} color={isDark ? '#2563eb' : '#0ea5e9'} style={{ marginRight: 8 }} />
              <Text style={{ color: isDark ? '#2563eb' : '#0ea5e9' }} className="text-center font-semibold">
                Follow User
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Secondary Color Showcase */}
        <Card>
          <Text style={styles.sectionTitle}>Your Secondary Color (#da9e22):</Text>
          <TouchableOpacity 
            className="px-4 py-3 rounded-lg"
            style={{ backgroundColor: '#da9e22' }}
          >
            <Text className="text-white text-center font-semibold">
              Custom Secondary Color Button
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Utility Functions Demo */}
        <Card>
          <Text style={styles.sectionTitle}>Utility Functions Demo (with Icons):</Text>
          <View style={{ gap: 10 }}>
            {/* Dynamic Button using utility functions */}
            <TouchableOpacity 
              className={`${getButtonTailwindBg('primary', 'default', isDark)} ${getButtonTailwindText('primary', 'solid', isDark)} px-4 py-3 rounded-lg flex-row items-center justify-center`}
              onPress={() => Alert.alert('Dynamic Button', `Theme: ${isDark ? 'Dark' : 'Light'} Mode`)}
            >
              <Settings size={20} color="white" style={{ marginRight: 8 }} />
              <Text className={getButtonTailwindText('primary', 'solid', isDark) + ' text-center font-semibold'}>
                Dynamic Primary Button (Theme-aware)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className={`${getButtonTailwindBg('success', 'hover', isDark)} ${getButtonTailwindText('success', 'solid', isDark)} px-4 py-3 rounded-lg flex-row items-center justify-center`}
              onPress={() => Alert.alert('Success State', 'Hover state button with utility function!')}
            >
              <Check size={20} color="white" style={{ marginRight: 8 }} />
              <Text className={getButtonTailwindText('success', 'solid', isDark) + ' text-center font-semibold'}>
                Dynamic Success Button (Hover State)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className={`${getButtonTailwindBg('error', 'pressed', isDark)} ${getButtonTailwindText('error', 'solid', isDark)} px-4 py-3 rounded-lg flex-row items-center justify-center`}
              onPress={() => Alert.alert('Error State', 'Pressed state button pressed!')}
            >
              <AlertTriangle size={20} color="white" style={{ marginRight: 8 }} />
              <Text className={getButtonTailwindText('error', 'solid', isDark) + ' text-center font-semibold'}>
                Dynamic Error Button (Pressed State)
              </Text>
            </TouchableOpacity>

            {/* Dynamic Outlined Button */}
            <TouchableOpacity 
              className="border-2 px-4 py-3 rounded-lg flex-row items-center justify-center bg-transparent"
              style={{ 
                borderColor: isDark ? '#2563eb' : '#0ea5e9'
              }}
              onPress={() => Alert.alert('Dynamic Outline', `Outlined button adapting to ${isDark ? 'dark' : 'light'} theme!`)}
            >
              <Heart size={20} color={isDark ? '#2563eb' : '#0ea5e9'} style={{ marginRight: 8 }} />
              <Text style={{ color: isDark ? '#2563eb' : '#0ea5e9' }} className="text-center font-semibold">
                Dynamic Outlined Button
              </Text>
            </TouchableOpacity>

            <View style={{ marginTop: 10, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
              <Text style={styles.infoText}>
                💡 These buttons use utility functions with icons and show alerts when pressed!
              </Text>
            </View>
          </View>
        </Card>

        {/* Color System Info */}
        <Card>
          <Text style={styles.sectionTitle}>Color System Features:</Text>
          <View style={{ gap: 5 }}>
            <Text style={styles.infoText}>✅ Colors.ts synchronized with Tailwind CSS</Text>
            <Text style={styles.infoText}>✅ Dark mode support for all button states</Text>
            <Text style={styles.infoText}>✅ Primary dark color: #2563eb</Text>
            <Text style={styles.infoText}>✅ Secondary color preserved: #da9e22</Text>
            <Text style={styles.infoText}>✅ All button states: default, hover, pressed, disabled</Text>
            <Text style={styles.infoText}>✅ Theme-aware color switching</Text>
            <Text style={styles.infoText}>✅ Buttons with icons support</Text>
            <Text style={styles.infoText}>✅ Outlined button variants</Text>
            <Text style={styles.infoText}>✅ Rounded and circular button styles</Text>
            <Text style={styles.infoText}>✅ Interactive alerts and feedback</Text>
          </View>
        </Card>
      </Body>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 12,
    fontWeight: 'light',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
