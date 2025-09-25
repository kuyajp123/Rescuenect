import { StyleSheet, View, Animated } from "react-native";
import React, { useRef, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { useTheme } from "@/contexts/ThemeContext";
import { Check } from "lucide-react-native";
import { Text } from "@/components/ui/text";

type AlertDialogProps = {
  showAlertDialog: boolean;
  handleClose: () => void;
  size?: "sm" | "md" | "lg" | "full" | "xs";
  text: string;
  icon?: React.ReactNode;
};

const index = ({
  showAlertDialog,
  handleClose,
  size = "lg",
  text,
  icon,
}: AlertDialogProps) => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const { isDark } = useTheme();

  // Animate scale when dialog opens
  useEffect(() => {
    if (showAlertDialog) {
      // Scale in animation with bounce
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset scale when dialog closes
      scaleValue.setValue(0);
    }
  }, [showAlertDialog, scaleValue]);

  return (
    <AlertDialog isOpen={showAlertDialog} onClose={handleClose} size={size}>
      <AlertDialogContent
        style={[
          styles.alertContent,
          {
            backgroundColor: isDark ? "#065f46" : "#d1fae5",
            borderColor: isDark ? "#059669" : "#10b981",
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <AlertDialogHeader style={styles.alertHeader}>
            <View
              style={[
                styles.alertIconContainer,
                { backgroundColor: isDark ? "#059669" : "#10b981" },
              ]}
            >
              {icon ? icon : <Check color={isDark ? "#d1fae5" : "#065f46"} />}
            </View>
            <Text
              bold
              size="sm"
              style={{ color: isDark ? "#d1fae5" : "#065f46" }}
            >
              {text}
            </Text>
          </AlertDialogHeader>
        </Animated.View>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default index;

const styles = StyleSheet.create({
  alertContent: {
    borderWidth: 2,
    borderRadius: 16,
    position: "absolute",
    top: 30,
    alignSelf: "center",
    minWidth: 280,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 5,
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
