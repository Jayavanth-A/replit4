import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useUserStore } from "@/stores/userStore";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

const RELATIONSHIP_OPTIONS = ["Mom", "Dad", "Spouse", "Partner", "Sibling", "Friend", "Roommate", "Other"];

export default function AddContactScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { createEmergencyContact, emergencyContacts } = useUserStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [isPrimary, setIsPrimary] = useState(emergencyContacts.length === 0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter the contact's name.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Phone Required", "Please enter the contact's phone number.");
      return;
    }
    if (!relationship.trim()) {
      Alert.alert("Relationship Required", "Please select or enter the relationship.");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      await createEmergencyContact({
        name: name.trim(),
        phone: phone.trim(),
        relationship: relationship.trim(),
        isPrimary,
        userId: "",
      });
      Alert.alert("Success", "Emergency contact added successfully!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to add contact. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing["2xl"] },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Card style={styles.formCard}>
          <View style={styles.inputContainer}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Contact Name *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="e.g., Mom"
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Phone Number *
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="e.g., (555) 123-4567"
              placeholderTextColor={theme.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Relationship *
            </ThemedText>
            <View style={styles.relationshipGrid}>
              {RELATIONSHIP_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.relationshipButton,
                    { backgroundColor: theme.backgroundSecondary },
                    relationship === option && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => {
                    setRelationship(option);
                    Haptics.selectionAsync();
                  }}
                >
                  <ThemedText
                    style={[
                      styles.relationshipText,
                      relationship === option && { color: "#FFF" },
                    ]}
                  >
                    {option}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            {relationship === "Other" && (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                    marginTop: Spacing.md,
                  },
                ]}
                placeholder="Specify relationship"
                placeholderTextColor={theme.textSecondary}
                value={relationship === "Other" ? "" : relationship}
                onChangeText={setRelationship}
              />
            )}
          </View>
        </Card>

        <Card style={styles.primaryCard}>
          <View style={styles.primaryRow}>
            <View style={styles.primaryInfo}>
              <ThemedText style={styles.primaryTitle}>Set as Primary Contact</ThemedText>
              <ThemedText style={[styles.primarySubtitle, { color: theme.textSecondary }]}>
                This person will be contacted first in emergencies
              </ThemedText>
            </View>
            <Switch
              value={isPrimary}
              onValueChange={(value) => {
                setIsPrimary(value);
                Haptics.selectionAsync();
              }}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>
        </Card>

        <View style={styles.infoBox}>
          <Feather name="info" size={16} color={theme.primary} />
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Emergency contacts will receive alerts with your location when you trigger an SOS or miss a check-in.
          </ThemedText>
        </View>

        <Pressable
          style={[
            styles.saveButton,
            { backgroundColor: theme.primary },
            isLoading && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Feather name="user-plus" size={20} color="#FFF" />
          <ThemedText style={styles.saveButtonText}>
            {isLoading ? "Adding..." : "Add Contact"}
          </ThemedText>
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  formCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.small,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    ...Typography.body,
  },
  relationshipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  relationshipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  relationshipText: {
    ...Typography.small,
    fontWeight: "500",
  },
  primaryCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  primaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  primaryTitle: {
    ...Typography.body,
    fontWeight: "600",
  },
  primarySubtitle: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
    paddingHorizontal: Spacing.sm,
  },
  infoText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 20,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  saveButtonText: {
    color: "#FFF",
    ...Typography.body,
    fontWeight: "600",
  },
});
