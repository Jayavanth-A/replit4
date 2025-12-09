import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
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

const AVATARS = [
  { icon: "user", color: "#007AFF" },
  { icon: "smile", color: "#34C759" },
  { icon: "heart", color: "#FF2D55" },
  { icon: "star", color: "#FF9500" },
  { icon: "sun", color: "#FFCC00" },
  { icon: "moon", color: "#5856D6" },
];

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, updateUser } = useUserStore();

  const [name, setName] = useState(user?.name || "");
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatarIndex || 0);
  const [height, setHeight] = useState(user?.height || "");
  const [weight, setWeight] = useState(user?.weight || "");
  const [skinTone, setSkinTone] = useState(user?.skinTone || "");
  const [eyeColor, setEyeColor] = useState(user?.eyeColor || "");
  const [distinguishingFeatures, setDistinguishingFeatures] = useState(user?.distinguishingFeatures || "");
  const [medicalInfo, setMedicalInfo] = useState(user?.medicalInfo || "");
  const [codeWord, setCodeWord] = useState(user?.codeWord || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setSelectedAvatar(user.avatarIndex || 0);
      setHeight(user.height || "");
      setWeight(user.weight || "");
      setSkinTone(user.skinTone || "");
      setEyeColor(user.eyeColor || "");
      setDistinguishingFeatures(user.distinguishingFeatures || "");
      setMedicalInfo(user.medicalInfo || "");
      setCodeWord(user.codeWord || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      await updateUser({
        name: name.trim(),
        avatarIndex: selectedAvatar,
        height: height.trim() || null,
        weight: weight.trim() || null,
        skinTone: skinTone.trim() || null,
        eyeColor: eyeColor.trim() || null,
        distinguishingFeatures: distinguishingFeatures.trim() || null,
        medicalInfo: medicalInfo.trim() || null,
        codeWord: codeWord.trim() || null,
      });
      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    multiline = false
  ) => (
    <View style={styles.inputContainer}>
      <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundSecondary,
            color: theme.text,
            borderColor: theme.border,
          },
          multiline && styles.multilineInput,
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

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
        <Card style={styles.avatarCard}>
          <ThemedText style={styles.sectionTitle}>Choose Your Avatar</ThemedText>
          <View style={styles.avatarContainer}>
            {AVATARS.map((avatar, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  setSelectedAvatar(index);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.avatarButton,
                  { backgroundColor: avatar.color + "20" },
                  selectedAvatar === index && { borderColor: avatar.color, borderWidth: 3 },
                ]}
              >
                <Feather name={avatar.icon as any} size={28} color={avatar.color} />
              </Pressable>
            ))}
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <ThemedText style={styles.sectionTitle}>Basic Information</ThemedText>
          {renderInput("Name *", name, setName, "Your name")}
          {renderInput("Code Word", codeWord, setCodeWord, "Secret word to verify identity")}
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Physical Description</ThemedText>
            <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Helps identify you in emergencies
            </ThemedText>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Height
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
                placeholder={'e.g., 5\'8"'}
                placeholderTextColor={theme.textSecondary}
                value={height}
                onChangeText={setHeight}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Weight
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
                placeholder="e.g., 150 lbs"
                placeholderTextColor={theme.textSecondary}
                value={weight}
                onChangeText={setWeight}
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Skin Tone
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
                placeholder="e.g., Fair"
                placeholderTextColor={theme.textSecondary}
                value={skinTone}
                onChangeText={setSkinTone}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Eye Color
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
                placeholder="e.g., Brown"
                placeholderTextColor={theme.textSecondary}
                value={eyeColor}
                onChangeText={setEyeColor}
              />
            </View>
          </View>

          {renderInput(
            "Distinguishing Features",
            distinguishingFeatures,
            setDistinguishingFeatures,
            "e.g., Tattoo on left arm, scar on chin",
            true
          )}
        </Card>

        <Card style={styles.infoCard}>
          <ThemedText style={styles.sectionTitle}>Medical Information</ThemedText>
          {renderInput(
            "Medical Conditions / Allergies",
            medicalInfo,
            setMedicalInfo,
            "Important medical information",
            true
          )}
        </Card>

        <Pressable
          style={[
            styles.saveButton,
            { backgroundColor: theme.primary },
            isLoading && { opacity: 0.6 },
          ]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Feather name="check" size={20} color="#FFF" />
          <ThemedText style={styles.saveButtonText}>
            {isLoading ? "Saving..." : "Save Changes"}
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
  avatarCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  avatarContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  avatarButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  infoCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.small,
    marginBottom: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    ...Typography.body,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: Spacing.md,
  },
  rowInputs: {
    flexDirection: "row",
    gap: Spacing.md,
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
