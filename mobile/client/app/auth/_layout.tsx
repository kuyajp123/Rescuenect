import React from 'react'
import { Stack } from 'expo-router'

export const _layout = () => {
    return (
        <Stack> 
            <Stack.Screen
            name='signIn'
            options={{
                headerShown: false,
                animation: 'none',
            }}
            /> 
            <Stack.Screen
            name='nameAndContactForm'
            options={{
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 150
            }}
            />
            <Stack.Screen
            name='barangayForm'
            options={{
                headerShown: false,
                animation: 'none'
            }}
            />
            <Stack.Screen
            name='setupComplete'
            options={{
                headerShown: false,
                animation: 'fade'
            }}
            />
        </Stack>
    )
}

export default _layout