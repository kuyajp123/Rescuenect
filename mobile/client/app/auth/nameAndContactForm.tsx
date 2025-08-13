import { PrimaryButton } from '@/components/ui/button/Button'
import { Input, InputField } from "@/components/ui/input"
import Body from '@/components/ui/layout/Body'
import { Text } from '@/components/ui/text'
import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const nameAndContactForm = () => {
    const router = useRouter()

  return (
    <Body style={styles.body}>
        <View style={{ width: '100%', marginBottom: 60 }}>
            <View style={{ marginBottom: 12 }}>
                <Text>First Name</Text>
                <Input
                    variant="outline"
                    size="md"
                    style={{ height: 50, borderRadius: 8 }}
                >
                    <InputField style={{ fontSize: 14 }} placeholder="Enter First Name here..."  />
                </Input>
            </View>
            <View style={{ marginBottom: 12 }}>
                <Text>Last Name</Text>
                <Input
                    variant="outline"
                    size="md"
                    style={{ height: 50, borderRadius: 8 }}
                >
                    <InputField style={{ fontSize: 14 }} placeholder="Enter Last Name here..."  />
                </Input>
            </View>
            <View style={{ marginBottom: 12 }}>
                <Text>Contact Number</Text>
                <Input
                    variant="outline"
                    size="md"
                    style={{ height: 50, borderRadius: 8 }}
                >
                    <InputField style={{ fontSize: 14 }} placeholder="xxxx-xxx-xxxx"  />
                </Input>
            </View>
        </View>
      
      <PrimaryButton onPress={() => {router.push('' as any)}}>Next</PrimaryButton>
    </Body>
  )
}

export default nameAndContactForm

const styles = StyleSheet.create({
    body: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    input: {
        height: 40,
        width: '100%',
        margin: 12,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
    },
})