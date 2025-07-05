import Body from '@/components/ui/Body';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { User, Settings, LogOut, Edit } from 'lucide-react-native';

export default function ProfileScreen() {
  const { isDark } = useTheme();

  return (
    <Body gap={16}>
      {/* Profile Header */}
      <Card>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light }]}>
            <User size={40} color="white" />
          </View>
          <View style={styles.profileInfo}>
            <Text size="xl" emphasis="bold">John Doe</Text>
            <Text size="sm" style={{ color: '#666' }}>john.doe@example.com</Text>
            <Text size="sm" style={{ color: '#666' }}>Member since 2024</Text>
          </View>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: isDark ? Colors.brand.dark : Colors.brand.light }]}
            onPress={() => Alert.alert('Edit Profile', 'Navigate to edit profile screen')}
          >
            <Edit size={20} color="white" />
          </TouchableOpacity>
        </View>
      </Card>

      {/* Profile Actions */}
      <Card>
        <Text size="lg" emphasis="semibold" style={{ marginBottom: 16 }}>Account Settings</Text>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => Alert.alert('Settings', 'Navigate to settings screen')}
        >
          <Settings size={24} color={isDark ? Colors.text.dark : Colors.text.light} />
          <Text size="md" style={{ marginLeft: 12 }}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionItem, { marginTop: 12 }]}
          onPress={() => Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive' }
          ])}
        >
          <LogOut size={24} color="#ef4444" />
          <Text size="md" style={{ marginLeft: 12, color: '#ef4444' }}>Logout</Text>
        </TouchableOpacity>
      </Card>

      {/* Profile Stats */}
      <Card>
        <Text size="lg" emphasis="semibold" style={{ marginBottom: 16 }}>Statistics</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text size="2xl" emphasis="bold" style={{ color: isDark ? Colors.brand.dark : Colors.brand.light }}>
              42
            </Text>
            <Text size="sm" style={{ color: '#666' }}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text size="2xl" emphasis="bold" style={{ color: Colors.semantic.success }}>
              18
            </Text>
            <Text size="sm" style={{ color: '#666' }}>Helped</Text>
          </View>
          <View style={styles.statItem}>
            <Text size="2xl" emphasis="bold" style={{ color: Colors.semantic.warning }}>
              5
            </Text>
            <Text size="sm" style={{ color: '#666' }}>Emergencies</Text>
          </View>
        </View>
      </Card>
    </Body>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
});
