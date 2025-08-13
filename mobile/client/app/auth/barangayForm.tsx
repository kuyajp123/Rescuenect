import { PrimaryButton } from '@/components/ui/button/Button'
import Body from '@/components/ui/layout/Body'
import {
    Modal,
    ModalBackdrop,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalFooter
} from "@/components/ui/modal"
import { Text } from '@/components/ui/text'
import { Colors } from '@/constants/Colors'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'expo-router'
import { ChevronDown, X } from 'lucide-react-native'
import React from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

const barangayForm = () => {
    const router = useRouter();
  const { isDark } = useTheme();
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedBarangay, setSelectedBarangay] = React.useState('');

    const barangays = [
    { label: "Barangay Alapan I-A", value: "alapan-1a" },
    { label: "Barangay Alapan I-B", value: "alapan-1b" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
    { label: "Barangay Alapan II-A", value: "alapan-2a" },
  ];

  const handleBarangaySelect = (barangay: any) => {
    setSelectedBarangay(barangay.label);
    setModalVisible(false);
  };

  return (
    <Body style={styles.body}>
        <View style={styles.container}>
            <Pressable 
                style={[
                    styles.dropdownTrigger,
                    { 
                    backgroundColor: isDark ? Colors.background.dark : Colors.background.light,
                    borderColor: isDark ? Colors.border.dark : Colors.border.light,
                    }
                ]}
                onPress={() => setModalVisible(true)}
                >
                <Text size='sm'>
                    {selectedBarangay || 'Select your barangay'}
                </Text>
                <ChevronDown size={20} color={isDark ? Colors.icons.dark : Colors.icons.light} />
            </Pressable>
            <Modal
                isOpen={modalVisible}
                onClose={() => {
                setModalVisible(false)
                }}
                size="lg"
            >
                <ModalBackdrop />
                <ModalContent>
                    <ModalHeader>
                        <View className="text-typography-950">
                            <Text size='lg'> Select your barangay</Text>
                        </View>
                        <ModalCloseButton>
                            <X 
                                onPress={() => setModalVisible(false)}
                                size={20} 
                                color={isDark ? Colors.icons.dark : Colors.icons.light} 
                            />
                        </ModalCloseButton>
                    </ModalHeader>
                    <ModalBody>
                        <View style={styles.barangayList}>
                            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                                {barangays.map((barangay, index) => (
                                <Pressable
                                    key={index}
                                    style={[
                                    styles.barangayItem,
                                    { borderBottomColor: isDark ? Colors.border.dark : Colors.border.light }
                                    ]}
                                    onPress={() => handleBarangaySelect(barangay)}
                                >
                                    <Text size='sm'>
                                    {barangay.label}
                                    </Text>
                                </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    </ModalBody>
                    <ModalFooter style={styles.footer}>
                        <ChevronDown 
                            size={20} 
                            color={isDark ? Colors.icons.dark : Colors.icons.light} 
                        />
                    </ModalFooter>
                </ModalContent>
            </Modal>
            <Text emphasis='light'>We collect your barangay information to accurately provide location-based disaster updates, coordinate assistance, and ensure the accuracy of information we will provide.
            </Text>
        </View>
        <PrimaryButton 
        onPress={() => {router.push('auth/nameAndContactForm' as any)}}>
            Next
        </PrimaryButton>
    </Body>
  )
}

export default barangayForm

const styles = StyleSheet.create({
    body: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    container: {
        gap: 10,
         marginBottom: 60
    },
    selectContent: {
        minHeight: 200,
        padding: 10,
    },
    dropdownTrigger: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        marginTop: 8,
    },
    barangayList: {
        maxHeight: 500,
    },
    barangayItem: {
        padding: 16,
        borderBottomWidth: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    }
})