import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import JourneyMap from "@/components/JourneyMap";
import { useTheme } from "@/hooks/useTheme";
import { useVoiceTrigger } from "@/hooks/useVoiceTrigger";
import { useUserStore } from "@/stores/userStore";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import SOSConfirmModal from "@/components/SOSConfirmModal";

export default function ActiveJourneyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { activeJourney, completeJourney, sendSOSAlert, hasLocationPermission, fetchActiveJourney, user } = useUserStore();

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  const triggerWords = user?.codeWord 
    ? [user.codeWord.toLowerCase(), "help me", "help", "emergency"]
    : ["help me", "help", "emergency"];

  const handleVoiceTrigger = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowSOSModal(true);
  }, []);

  const { isListening, isSupported, startListening, stopListening, error: voiceError } = useVoiceTrigger({
    triggerWords,
    onTrigger: handleVoiceTrigger,
    enabled: voiceEnabled,
  });

  useFocusEffect(
    useCallback(() => {
      fetchActiveJourney();
      
      if (voiceEnabled && isSupported) {
        startListening();
      }
      
      return () => {
        stopListening();
      };
    }, [voiceEnabled, isSupported])
  );

  useEffect(() => {
    let mounted = true;
    
    const startLocationWatch = async () => {
      if (hasLocationPermission) {
        try {
          locationWatchRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 10000,
              distanceInterval: 50,
            },
            (location) => {
              if (mounted) {
                setCurrentLocation({
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                });
              }
            }
          );
        } catch (e) {
          console.error("Failed to watch location:", e);
        }
      }
    };

    startLocationWatch();

    return () => {
      mounted = false;
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
      }
    };
  }, [hasLocationPermission]);

  useEffect(() => {
    if (!activeJourney) {
      navigation.replace("Main");
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const arrival = new Date(activeJourney.expectedArrival).getTime();
      const diff = Math.max(0, arrival - now);
      setTimeRemaining(Math.floor(diff / 1000));
    };

    updateTimer();
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeJourney]);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "Overdue";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleArrived = async () => {
    Alert.alert(
      "Mark as Arrived?",
      "Confirm that you have arrived safely at your destination.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "I've Arrived",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsCompleting(true);
            await completeJourney(true);
            setIsCompleting(false);
            navigation.replace("Main");
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Journey?",
      "Are you sure you want to cancel this journey?",
      [
        { text: "No, Continue", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsCompleting(true);
            await completeJourney(false);
            setIsCompleting(false);
            navigation.replace("Main");
          },
        },
      ]
    );
  };

  const handleSOSPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowSOSModal(true);
  };

  const handleConfirmSOS = async () => {
    setIsSendingSOS(true);
    try {
      let latitude: string | undefined;
      let longitude: string | undefined;

      if (currentLocation) {
        latitude = currentLocation.latitude.toString();
        longitude = currentLocation.longitude.toString();
      } else if (hasLocationPermission) {
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
          "Emergency alert with SMS and phone call has been sent to your contacts. Stay safe!",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", "Failed to send SOS alert. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please call emergency services directly.");
    } finally {
      setIsSendingSOS(false);
      setShowSOSModal(false);
    }
  };

  const toggleVoiceActivation = () => {
    if (voiceEnabled) {
      stopListening();
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
      if (isSupported) {
        startListening();
      }
    }
  };

  const isOverdue = timeRemaining <= 0;

  const origin = activeJourney?.startLatitude && activeJourney?.startLongitude
    ? { latitude: parseFloat(activeJourney.startLatitude), longitude: parseFloat(activeJourney.startLongitude) }
    : undefined;

  const destination = activeJourney?.destLatitude && activeJourney?.destLongitude
    ? { latitude: parseFloat(activeJourney.destLatitude), longitude: parseFloat(activeJourney.destLongitude) }
    : undefined;

  if (!activeJourney) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content, 
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing["2xl"] }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.voiceIndicator}>
          <Pressable 
            style={[
              styles.voiceButton,
              { 
                backgroundColor: isListening ? theme.success + "20" : theme.backgroundSecondary,
                borderColor: isListening ? theme.success : theme.border,
              }
            ]}
            onPress={toggleVoiceActivation}
          >
            <Feather 
              name={isListening ? "mic" : "mic-off"} 
              size={16} 
              color={isListening ? theme.success : theme.textSecondary} 
            />
            <ThemedText style={[styles.voiceText, { color: isListening ? theme.success : theme.textSecondary }]}>
              {isListening ? "Voice Active" : "Voice Off"}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.timerSection}>
          <View
            style={[
              styles.timerCircle,
              {
                borderColor: isOverdue ? theme.danger : theme.primary,
                backgroundColor: (isOverdue ? theme.danger : theme.primary) + "10",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.timerText,
                { color: isOverdue ? theme.danger : theme.text },
              ]}
            >
              {formatTime(timeRemaining)}
            </ThemedText>
            <ThemedText style={[styles.timerLabel, { color: theme.textSecondary }]}>
              {isOverdue ? "Time's up!" : "Time remaining"}
            </ThemedText>
          </View>

          {isOverdue && (
            <View style={[styles.overdueWarning, { backgroundColor: theme.dangerLight }]}>
              <Feather name="alert-triangle" size={20} color={theme.danger} />
              <ThemedText style={[styles.overdueText, { color: theme.danger }]}>
                Your contacts will be notified soon
              </ThemedText>
            </View>
          )}
        </View>

        {(origin && destination) && (
          <View style={styles.mapContainer}>
            <JourneyMap
              origin={origin}
              destination={destination}
              currentLocation={currentLocation || undefined}
            />
          </View>
        )}

        <Card style={styles.journeyCard}>
          <View style={styles.journeyRow}>
            <View style={[styles.journeyDot, { backgroundColor: theme.success }]} />
            <View style={styles.journeyInfo}>
              <ThemedText style={[styles.journeyLabel, { color: theme.textSecondary }]}>
                From
              </ThemedText>
              <ThemedText style={styles.journeyValue}>
                {activeJourney.startLocation}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.journeyDivider, { backgroundColor: theme.border }]} />

          <View style={styles.journeyRow}>
            <View style={[styles.journeyDot, { backgroundColor: theme.primary }]} />
            <View style={styles.journeyInfo}>
              <ThemedText style={[styles.journeyLabel, { color: theme.textSecondary }]}>
                To
              </ThemedText>
              <ThemedText style={styles.journeyValue}>
                {activeJourney.destination}
              </ThemedText>
            </View>
          </View>

          {activeJourney.note ? (
            <View style={[styles.noteSection, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="file-text" size={16} color={theme.textSecondary} />
              <ThemedText style={[styles.noteText, { color: theme.textSecondary }]}>
                {activeJourney.note}
              </ThemedText>
            </View>
          ) : null}
        </Card>

        <View style={styles.buttonSection}>
          <Pressable
            style={[
              styles.arrivedButton,
              { backgroundColor: theme.success },
              isCompleting && { opacity: 0.6 },
            ]}
            onPress={handleArrived}
            disabled={isCompleting}
          >
            <Feather name="check-circle" size={24} color="#FFF" />
            <ThemedText style={styles.arrivedButtonText}>I've Arrived Safely</ThemedText>
          </Pressable>

          <View style={styles.secondaryButtons}>
            <Pressable
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={handleCancel}
              disabled={isCompleting}
            >
              <Feather name="x" size={20} color={theme.text} />
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.sosButton, { backgroundColor: theme.danger }]}
              onPress={handleSOSPress}
            >
              <Feather name="alert-circle" size={20} color="#FFF" />
              <ThemedText style={styles.sosButtonText}>SOS</ThemedText>
            </Pressable>
          </View>
        </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  voiceIndicator: {
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  voiceText: {
    fontSize: 12,
    fontWeight: "500",
  },
  timerSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  timerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  timerText: {
    fontSize: 32,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  timerLabel: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  overdueWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
  },
  overdueText: {
    ...Typography.body,
    fontWeight: "500",
  },
  mapContainer: {
    height: 200,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  journeyCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  journeyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  journeyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  journeyInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  journeyLabel: {
    ...Typography.small,
    marginBottom: Spacing.xs,
  },
  journeyValue: {
    ...Typography.body,
    fontWeight: "500",
  },
  journeyDivider: {
    width: 2,
    height: 24,
    marginLeft: 5,
    marginVertical: Spacing.sm,
  },
  noteSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  noteText: {
    ...Typography.small,
    flex: 1,
  },
  buttonSection: {
    marginTop: "auto",
  },
  arrivedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  arrivedButtonText: {
    color: "#FFF",
    ...Typography.body,
    fontWeight: "600",
    fontSize: 18,
  },
  secondaryButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  cancelButtonText: {
    ...Typography.body,
    fontWeight: "500",
  },
  sosButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  sosButtonText: {
    color: "#FFF",
    ...Typography.body,
    fontWeight: "600",
  },
});
