import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useUserStore } from "@/stores/userStore";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import SOSConfirmModal from "@/components/SOSConfirmModal";

const AVATARS = [
  { icon: "user", color: "#007AFF" },
  { icon: "smile", color: "#34C759" },
  { icon: "heart", color: "#FF2D55" },
  { icon: "star", color: "#FF9500" },
  { icon: "sun", color: "#FFCC00" },
  { icon: "moon", color: "#5856D6" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { user, activeJourney, emergencyContacts, fetchActiveJourney, sendSOSAlert, hasLocationPermission, setLocationPermission } = useUserStore();

  const [showSOSModal, setShowSOSModal] = useState(false);
  const [isSendingSOS, setIsSendingSOS] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchActiveJourney();
    }, [])
  );

  const handleSOSPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowSOSModal(true);
  };

  const handleConfirmSOS = async () => {
    setIsSendingSOS(true);
    try {
      let latitude: string | undefined;
      let longitude: string | undefined;

      if (hasLocationPermission) {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          latitude = location.coords.latitude.toString();
          longitude = location.coords.longitude.toString();
        } catch (e) {
          console.error("Failed to get location:", e);
        }
      }

      const success = await sendSOSAlert(latitude, longitude);
      if (success) {
        Alert.alert(
          "SOS Sent",
          "Emergency alert has been sent to your contacts. Stay safe!",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", "Failed to send SOS alert. Please try again or call emergency services directly.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please call emergency services directly.");
    } finally {
      setIsSendingSOS(false);
      setShowSOSModal(false);
    }
  };

  const handleStartJourney = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (!hasLocationPermission) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setLocationPermission(true);
      } else {
        Alert.alert(
          "Location Required",
          "Location access is needed for journey tracking. Please enable it in settings.",
          [
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }
    }

    if (emergencyContacts.length === 0) {
      Alert.alert(
        "No Emergency Contacts",
        "Please add at least one emergency contact before starting a journey.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Add Contact", onPress: () => navigation.navigate("EmergencyContacts") },
        ]
      );
      return;
    }

    navigation.navigate("JourneySetup");
  };

  const handleContinueJourney = () => {
    navigation.navigate("ActiveJourney");
  };

  const avatarInfo = AVATARS[user?.avatarIndex || 0];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing["3xl"], paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.header}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarInfo.color + "20" }]}>
            <Feather name={avatarInfo.icon as any} size={24} color={avatarInfo.color} />
          </View>
          <View style={styles.headerText}>
            <ThemedText style={styles.greeting}>Welcome back,</ThemedText>
            <ThemedText style={styles.userName}>{user?.name || "User"}</ThemedText>
          </View>
          <Feather name="shield" size={28} color={theme.primary} />
        </View>

        <Pressable
          style={[styles.sosButton, { backgroundColor: theme.danger }]}
          onPress={handleSOSPress}
          onLongPress={handleSOSPress}
        >
          <View style={styles.sosInner}>
            <Feather name="alert-circle" size={48} color="#FFF" />
            <ThemedText style={styles.sosText}>SOS</ThemedText>
            <ThemedText style={styles.sosSubtext}>Press & hold for emergency</ThemedText>
          </View>
        </Pressable>

        {activeJourney ? (
          <Card style={styles.journeyCard}>
            <View style={styles.journeyHeader}>
              <View style={[styles.journeyIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="navigation" size={24} color={theme.primary} />
              </View>
              <View style={styles.journeyInfo}>
                <ThemedText style={styles.journeyTitle}>Active Journey</ThemedText>
                <ThemedText style={[styles.journeyDestination, { color: theme.textSecondary }]}>
                  To: {activeJourney.destination}
                </ThemedText>
              </View>
            </View>
            <Pressable
              style={[styles.continueButton, { backgroundColor: theme.primary }]}
              onPress={handleContinueJourney}
            >
              <ThemedText style={styles.continueButtonText}>View Journey</ThemedText>
              <Feather name="arrow-right" size={18} color="#FFF" />
            </Pressable>
          </Card>
        ) : (
          <Card style={styles.journeyCard}>
            <View style={styles.startJourneyContent}>
              <View style={[styles.journeyIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="map" size={24} color={theme.primary} />
              </View>
              <View style={styles.startJourneyText}>
                <ThemedText style={styles.journeyTitle}>Start a Journey</ThemedText>
                <ThemedText style={[styles.journeySubtext, { color: theme.textSecondary }]}>
                  Share your trip with trusted contacts
                </ThemedText>
              </View>
            </View>
            <Pressable
              style={[styles.startButton, { backgroundColor: theme.primary }]}
              onPress={handleStartJourney}
            >
              <Feather name="plus" size={20} color="#FFF" />
              <ThemedText style={styles.startButtonText}>New Journey</ThemedText>
            </Pressable>
          </Card>
        )}

        <Card style={styles.quickActionsCard}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.quickActions}>
            <Pressable
              style={[styles.quickActionButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => navigation.navigate("EmergencyContacts")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: theme.danger + "20" }]}>
                <Feather name="users" size={20} color={theme.danger} />
              </View>
              <ThemedText style={styles.quickActionText}>Contacts</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.quickActionButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="user" size={20} color={theme.primary} />
              </View>
              <ThemedText style={styles.quickActionText}>Profile</ThemedText>
            </Pressable>
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Feather name="info" size={20} color={theme.primary} />
            <ThemedText style={styles.infoTitle}>Safety Tips</ThemedText>
          </View>
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Always share your journey with trusted contacts and keep your phone charged when traveling alone.
          </ThemedText>
        </Card>
      </ScrollView>

      <SOSConfirmModal
        visible={showSOSModal}
        onConfirm={handleConfirmSOS}
        onCancel={() => setShowSOSModal(false)}
        isLoading={isSendingSOS}
      />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  greeting: {
    ...Typography.small,
    opacity: 0.7,
  },
  userName: {
    ...Typography.h4,
  },
  sosButton: {
    height: 180,
    borderRadius: BorderRadius["2xl"],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
    shadowColor: "#DC3545",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sosInner: {
    alignItems: "center",
  },
  sosText: {
    color: "#FFF",
    ...Typography.h1,
    marginTop: Spacing.sm,
  },
  sosSubtext: {
    color: "rgba(255,255,255,0.8)",
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  journeyCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  journeyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  journeyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  journeyInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  journeyTitle: {
    ...Typography.h4,
  },
  journeyDestination: {
    ...Typography.small,
  },
  journeySubtext: {
    ...Typography.small,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  continueButtonText: {
    color: "#FFF",
    ...Typography.body,
    fontWeight: "600",
  },
  startJourneyContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  startJourneyText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  startButtonText: {
    color: "#FFF",
    ...Typography.body,
    fontWeight: "600",
  },
  quickActionsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  quickActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  quickActionButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  quickActionText: {
    ...Typography.small,
    fontWeight: "500",
  },
  infoCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    ...Typography.body,
    fontWeight: "600",
  },
  infoText: {
    ...Typography.small,
    lineHeight: 20,
  },
});
