import { router } from 'expo-router';
import { X, Info, CheckCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, View, Modal, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ModalExampleScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);
  
  const backgroundColor = isDark ? Colors.background.dark : Colors.background.light;
  const textColor = isDark ? Colors.text.dark : Colors.text.light;
  const cardColor = isDark ? '#262626' : '#ffffff';
  const secondaryTextColor = isDark ? '#a1a1aa' : '#64748b';

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {/* Custom Header */}
      <View style={{
        paddingTop: insets.top + 10,
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: cardColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: isDark ? '#374151' : '#f3f4f6',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <X color={textColor} size={20} />
          </Pressable>
          
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: textColor,
          }}>
            Modal Demo
          </Text>
          
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{
          backgroundColor: cardColor,
          padding: 20,
          borderRadius: 16,
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <Info color={Colors.semantic.info} size={24} />
            <Text style={{
              fontSize: 20,
              fontWeight: '600',
              color: textColor,
              marginLeft: 8,
            }}>
              Modal Navigation Demo
            </Text>
          </View>
          
          <Text style={{
            fontSize: 16,
            color: secondaryTextColor,
            lineHeight: 24,
          }}>
            This screen demonstrates modal presentation in Expo Router. You can present screens as modals using the presentation option in Stack.Screen.
          </Text>
        </View>

        {/* Modal Types */}
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: textColor,
          marginBottom: 16,
        }}>
          Modal Examples
        </Text>

        <Pressable
          onPress={() => setShowModal(true)}
          style={{
            backgroundColor: Colors.button.primary.default,
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
          }}>
            Show React Native Modal
          </Text>
          <Text style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 14,
            marginTop: 4,
          }}>
            Traditional Modal component
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Alert.alert(
              'Navigation Modal',
              'To create navigation modals in Expo Router:\n\n1. Add presentation: "modal" to Stack.Screen\n2. Use router.present() or router.push()\n3. Use router.dismiss() to close',
              [{ text: 'Got it!' }]
            );
          }}
          style={{
            backgroundColor: Colors.button.secondary.default,
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
          }}>
            Show Navigation Modal Info
          </Text>
          <Text style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 14,
            marginTop: 4,
          }}>
            Expo Router modal presentation
          </Text>
        </Pressable>

        {/* Code Example */}
        <View style={{
          backgroundColor: cardColor,
          padding: 16,
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: Colors.semantic.success,
          marginTop: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: textColor,
            marginBottom: 12,
          }}>
            💡 How to Create Navigation Modals
          </Text>
          
          <Text style={{
            fontSize: 14,
            color: secondaryTextColor,
            fontFamily: 'monospace',
            backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
            padding: 12,
            borderRadius: 8,
            lineHeight: 20,
          }}>
            {`// In _layout.tsx
<Stack.Screen
  name="modal"
  options={{
    presentation: 'modal',
    headerTitle: 'Modal Title'
  }}
/>

// Navigate to modal
router.push('/modal');

// Dismiss modal
router.dismiss();`}
          </Text>
        </View>
      </View>

      {/* React Native Modal Example */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor,
          paddingTop: insets.top,
        }}>
          {/* Modal Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#374151' : '#e5e7eb',
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: textColor,
            }}>
              Example Modal
            </Text>
            
            <Pressable
              onPress={() => setShowModal(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <X color={textColor} size={18} />
            </Pressable>
          </View>

          {/* Modal Content */}
          <View style={{ flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center' }}>
            <CheckCircle color={Colors.semantic.success} size={64} />
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: textColor,
              marginTop: 16,
              marginBottom: 8,
            }}>
              Modal Success!
            </Text>
            <Text style={{
              fontSize: 16,
              color: secondaryTextColor,
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 32,
            }}>
              This is a React Native Modal component. It overlays the entire screen and can be dismissed by tapping the X button.
            </Text>
            
            <Pressable
              onPress={() => setShowModal(false)}
              style={{
                backgroundColor: Colors.button.primary.default,
                paddingHorizontal: 32,
                paddingVertical: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
              }}>
                Close Modal
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
