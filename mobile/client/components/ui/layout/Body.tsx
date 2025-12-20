import { Colors } from "@/constants/Colors";
import { useTheme } from "@/contexts/ThemeContext";
import type { ComponentProps } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../text";
import { VStack } from "../vstack";
import { useNetwork } from "@/store/useNetwork";

type VStackProps = ComponentProps<typeof VStack>;

interface ContainerProps extends VStackProps {
  style?: StyleProp<ViewStyle>;
  gap?: number | string;
}

export const Body = ({
  children,
  style,
  ...props
}: ContainerProps) => {
  const { isDark } = useTheme();
  const { isOnline } = useNetwork();

  return (
    <View style={styles.wrapper}>
      {!isOnline && (
        <View style={[styles.statusBar, { backgroundColor: isDark ? Colors.background.dark : Colors.background.light }]}>
          <Text style={styles.statusText}>No Internet Connection</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <VStack
          style={[
            styles.container,
            {
              backgroundColor: isDark
                ? Colors.background.dark
                : Colors.background.light,
              paddingTop: !isOnline ? 20 : 0, // Dynamic spacing based on status bar
            },
            style,
          ]}
          {...props}
        >
          {children}
        </VStack>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  statusText: {
    fontWeight: "bold",
    textAlign: "center",
    color: Colors.semantic.error,
  },
  statusBar: {
    padding: 1,
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});

export default Body;
