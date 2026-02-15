import { Colors } from "@/constants/Colors";
import { useTheme } from "@/contexts/ThemeContext";
import type { ComponentProps, Ref } from "react";
import type { ScrollViewProps, StyleProp, ViewStyle } from "react-native";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../text";
import { VStack } from "../vstack";
import { useNetwork } from "@/store/useNetwork";

type VStackProps = ComponentProps<typeof VStack>;

interface ContainerProps extends VStackProps {
  style?: StyleProp<ViewStyle>;
  gap?: number | string;
  scrollEnabled?: boolean;
  onScroll?: ScrollViewProps["onScroll"];
  onScrollBeginDrag?: ScrollViewProps["onScrollBeginDrag"];
  onScrollEndDrag?: ScrollViewProps["onScrollEndDrag"];
  scrollEventThrottle?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollRef?: Ref<ScrollView>;
}

export const Body = ({
  children,
  style,
  scrollEnabled = true,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  scrollEventThrottle = 16,
  contentContainerStyle,
  scrollRef,
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
      {scrollEnabled ? (
        <ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          scrollEventThrottle={scrollEventThrottle}
          contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
        >
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
      ) : (
        <VStack
          style={[
            styles.container,
            {
              backgroundColor: isDark
                ? Colors.background.dark
                : Colors.background.light,
              paddingTop: !isOnline ? 20 : 0,
            },
            style,
          ]}
          {...props}
        >
          {children}
        </VStack>
      )}
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
