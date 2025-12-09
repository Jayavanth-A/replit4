import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
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

type OnboardingStep = "welcome" | "phone" | "otp" | "permissions" | "contact";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { sendOTP, verifyOTP, createUserWithPhone, setLocationPermission, createEmergencyContact, setOnboarded } = useUserStore();

  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRelationship, setContactRelationship] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const startCountdown = () => {
    setCountdown(60);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!phone.trim() || phone.length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number with country code (e.g., +1234567890).");
      return;
    }
    
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const result = await sendOTP(phone.trim());
      if (result.success) {
        setOtpSent(true);
        startCountdown();
        setStep("otp");
        Alert.alert("Code Sent", "A verification code has been sent to your phone.");
      } else {
        Alert.alert("Error", result.error || "Failed to send verification code. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit verification code.");
      return;
    }
    
    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const result = await verifyOTP(phone.trim(), otpCode.trim());
      if (result.valid) {
        await createUserWithPhone(phone.trim(), selectedAvatar);
        setStep("permissions");
      } else {
        Alert.alert("Verification Failed", result.error || "Invalid code. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      const result = await sendOTP(phone.trim());
      if (result.success) {
        startCountdown();
        Alert.alert("Code Sent", "A new verification code has been sent to your phone.");
      } else {
        Alert.alert("Error", result.error || "Failed to resend code.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (step === "welcome") {
      setStep("phone");
    } else if (step === "permissions") {
      setStep("contact");
    } else if (step === "contact") {
      if (contactName.trim() && contactPhone.trim()) {
        setIsLoading(true);
        try {
          await createEmergencyContact({
            name: contactName.trim(),
            phone: contactPhone.trim(),
            relationship: contactRelationship.trim() || "Friend",
            isPrimary: true,
            userId: "",
          });
        } catch (error) {
          console.error("Failed to add contact:", error);
        }
        setIsLoading(false);
      }
      setOnboarded(true);
    }
  };

  const handleRequestLocation = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationPermission(true);
        Alert.alert("Success", "Location access granted!");
      } else if (!canAskAgain && Platform.OS !== "web") {
        Alert.alert(
          "Permission Required",
          "Please enable location access in Settings to use journey tracking.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch {}
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error requesting location:", error);
    }
  };

  const handleSkip = () => {
    if (step === "contact") {
      setOnboarded(true);
    }
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
        <Feather name="shield" size={64} color={theme.primary} />
      </View>
      <ThemedText style={styles.title}>Safe Connect</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Your personal safety companion. Track journeys, send emergency alerts, and stay connected with those who matter most.
      </ThemedText>
    </View>
  );

  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
        <Feather name="smartphone" size={64} color={theme.primary} />
      </View>
      <ThemedText style={styles.title}>Enter Your Phone</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        We'll send you a verification code to confirm your phone number.
      </ThemedText>

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

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundSecondary,
            color: theme.text,
            borderColor: theme.border,
          },
        ]}
        placeholder="Enter phone number (e.g., +1234567890)"
        placeholderTextColor={theme.textSecondary}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoFocus
      />

      <Pressable
        style={[
          styles.sendOtpButton,
          { backgroundColor: theme.primary },
          isLoading && { opacity: 0.6 },
        ]}
        onPress={handleSendOTP}
        disabled={isLoading}
      >
        <Feather name="send" size={20} color="#FFF" />
        <ThemedText style={styles.sendOtpButtonText}>
          {isLoading ? "Sending..." : "Send OTP"}
        </ThemedText>
      </Pressable>
    </View>
  );

  const renderOtpStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconCircle, { backgroundColor: theme.success + "20" }]}>
        <Feather name="check-circle" size={64} color={theme.success} />
      </View>
      <ThemedText style={styles.title}>Enter Verification Code</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        We've sent a 6-digit code to {phone}. Enter it below to verify.
      </ThemedText>

      <TextInput
        style={[
          styles.otpInput,
          {
            backgroundColor: theme.backgroundSecondary,
            color: theme.text,
            borderColor: theme.border,
          },
        ]}
        placeholder="000000"
        placeholderTextColor={theme.textSecondary}
        value={otpCode}
        onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />

      <Pressable
        style={[
          styles.verifyButton,
          { backgroundColor: theme.primary },
          isLoading && { opacity: 0.6 },
        ]}
        onPress={handleVerifyOTP}
        disabled={isLoading}
      >
        <Feather name="check" size={20} color="#FFF" />
        <ThemedText style={styles.verifyButtonText}>
          {isLoading ? "Verifying..." : "Verify Code"}
        </ThemedText>
      </Pressable>

      <Pressable
        style={[styles.resendButton, countdown > 0 && { opacity: 0.5 }]}
        onPress={handleResendOTP}
        disabled={countdown > 0 || isLoading}
      >
        <ThemedText style={[styles.resendText, { color: theme.primary }]}>
          {countdown > 0 ? `Resend code in ${countdown}s` : "Resend Code"}
        </ThemedText>
      </Pressable>

      <Pressable
        style={styles.changePhoneButton}
        onPress={() => {
          setStep("phone");
          setOtpCode("");
        }}
      >
        <ThemedText style={[styles.changePhoneText, { color: theme.textSecondary }]}>
          Change phone number
        </ThemedText>
      </Pressable>
    </View>
  );

  const renderPermissions = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
        <Feather name="map-pin" size={64} color={theme.primary} />
      </View>
      <ThemedText style={styles.title}>Enable Location</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        We need location access to track your journeys and share your location during emergencies.
      </ThemedText>

      <Pressable
        style={[styles.permissionButton, { backgroundColor: theme.primary }]}
        onPress={handleRequestLocation}
      >
        <Feather name="navigation" size={20} color="#FFF" />
        <ThemedText style={styles.permissionButtonText}>Enable Location Access</ThemedText>
      </Pressable>
    </View>
  );

  const renderContact = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconCircle, { backgroundColor: theme.danger + "20" }]}>
        <Feather name="phone" size={64} color={theme.danger} />
      </View>
      <ThemedText style={styles.title}>Add Emergency Contact</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Add someone who will be notified if you trigger an SOS or don't arrive at your destination.
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
        placeholder="Contact name"
        placeholderTextColor={theme.textSecondary}
        value={contactName}
        onChangeText={setContactName}
        autoCapitalize="words"
      />

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundSecondary,
            color: theme.text,
            borderColor: theme.border,
          },
        ]}
        placeholder="Phone number"
        placeholderTextColor={theme.textSecondary}
        value={contactPhone}
        onChangeText={setContactPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundSecondary,
            color: theme.text,
            borderColor: theme.border,
          },
        ]}
        placeholder="Relationship (e.g., Mom, Partner)"
        placeholderTextColor={theme.textSecondary}
        value={contactRelationship}
        onChangeText={setContactRelationship}
        autoCapitalize="words"
      />
    </View>
  );

  const showContinueButton = step === "welcome" || step === "permissions" || step === "contact";

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing["3xl"] },
        ]}
      >
        {step === "welcome" && renderWelcome()}
        {step === "phone" && renderPhoneStep()}
        {step === "otp" && renderOtpStep()}
        {step === "permissions" && renderPermissions()}
        {step === "contact" && renderContact()}

        {showContinueButton && (
          <View style={styles.buttonContainer}>
            <Pressable
              style={[
                styles.nextButton,
                { backgroundColor: theme.primary },
                isLoading && { opacity: 0.6 },
              ]}
              onPress={handleNext}
              disabled={isLoading}
            >
              <ThemedText style={styles.nextButtonText}>
                {isLoading
                  ? "Loading..."
                  : step === "contact"
                  ? contactName && contactPhone
                    ? "Finish Setup"
                    : "Skip & Finish"
                  : "Continue"}
              </ThemedText>
              <Feather name="arrow-right" size={20} color="#FFF" />
            </Pressable>

            {step === "contact" && contactName && contactPhone && (
              <Pressable style={styles.skipButton} onPress={handleSkip}>
                <ThemedText style={[styles.skipText, { color: theme.textSecondary }]}>
                  Skip for now
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.progressContainer}>
          {["welcome", "phone", "otp", "permissions", "contact"].map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    s === step
                      ? theme.primary
                      : ["welcome", "phone", "otp", "permissions", "contact"].indexOf(step) > i
                      ? theme.primary + "80"
                      : theme.border,
                },
              ]}
            />
          ))}
        </View>
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  stepContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  title: {
    ...Typography.h2,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
    paddingHorizontal: Spacing.lg,
  },
  avatarContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
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
  input: {
    width: "100%",
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    ...Typography.body,
  },
  otpInput: {
    width: "60%",
    height: Spacing.inputHeight * 1.2,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    ...Typography.h2,
    textAlign: "center",
    letterSpacing: 10,
  },
  sendOtpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  sendOtpButtonText: {
    color: "#FFF",
    ...Typography.body,
    fontWeight: "600",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  verifyButtonText: {
    color: "#FFF",
    ...Typography.body,
    fontWeight: "600",
  },
  resendButton: {
    paddingVertical: Spacing.lg,
  },
  resendText: {
    ...Typography.body,
    fontWeight: "500",
  },
  changePhoneButton: {
    paddingVertical: Spacing.sm,
  },
  changePhoneText: {
    ...Typography.body,
  },
  permissionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  permissionButtonText: {
    color: "#FFF",
    ...Typography.body,
    fontWeight: "600",
  },
  buttonContainer: {
    paddingTop: Spacing["2xl"],
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  nextButtonText: {
    color: "#FFF",
    ...Typography.body,
    fontWeight: "600",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  skipText: {
    ...Typography.body,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingTop: Spacing["2xl"],
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
