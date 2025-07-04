To run the project: npx expo start
To update and fix the mismatch packages: npx expo install --fix


React Native Boilerplate shortcut:

rnf → React Native Function Component
rnfe → React Native Function Component with Export
rnc → React Native Class Component
rnce → React Native Class Component with Export
rncs → React Native Class Component with StyleSheet
rnfes → React Native Function Component with StyleSheet


typograpy: {
    light: text-typography-900 // color black in light mode
    dark: text-typography-0 // color white in dark mode
    emphasis: {
        dark: {
            heigh emphasis - text-typography-0/90
            medium emphasis - text-typography-0/60
            low emphasis - text-typography-0/40
        }
        light: {
            heigh emphasis - text-typography-900
            medium emphasis - text-typography-900/90
            low emphasis - text-typography-900/60
        }
    }
}