import React from "react";
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface SOSConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function SOSConfirmModal({
  visible,
  onConfirm,
  onCancel,
  isLoading = false,
}: SOSConfirmModalProps) {
  const { theme, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <BlurView
          intensity={50}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.danger + "20" }]}>
            <Feather name="alert-triangle" size={48} color={theme.danger} />
          </View>

          <ThemedText style={styles.title}>Send Emergency Alert?</ThemedText>
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            This will immediately notify all your emergency contacts with your current location.
          </ThemedText>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.confirmButton,
                { backgroundColor: theme.danger },
                isLoading && { opacity: 0.6 },
              ]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Feather name="alert-circle" size={20} color="#FFF" />
                  <ThemedText style={styles.confirmButtonText}>Send SOS</ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modal: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.lg,
    padding: Spacing["2xl"],
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    ...Typography.body,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.sm,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  confirmButtonText: {
    ...Typography.body,
    fontWeight: "600",
    color: "#FFF",
  },
});
