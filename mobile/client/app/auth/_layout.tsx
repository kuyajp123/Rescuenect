import React from 'react'
import { Stack } from 'expo-router'

export const _layout = () => {
    return (
        <Stack>  
            <Stack.Screen
            name='nameAndContactForm'
            options={{
                headerShown: false,
                animation: 'none'
            }}
            />
            <Stack.Screen
            name='barangayForm'
            options={{
                headerShown: false,
                animation: 'none'
            }}
            />
        </Stack>
    )
}

export default _layout