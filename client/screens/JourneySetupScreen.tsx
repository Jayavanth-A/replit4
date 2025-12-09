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
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useUserStore } from "@/stores/userStore";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export default function JourneySetupScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { createJourney, hasLocationPermission } = useUserStore();

  const [destination, setDestination] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [note, setNote] = useState("");
  const [startLocation, setStartLocation] = useState("Current Location");
  const [coordinates, setCoordinates] = useState<{ lat: string; lng: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getCurrentLocation = async () => {
      if (hasLocationPermission) {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCoordinates({
            lat: location.coords.latitude.toString(),
            lng: location.coords.longitude.toString(),
          });
          
          try {
            const [address] = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            if (address) {
              const parts = [address.street, address.city].filter(Boolean);
              if (parts.length > 0) {
                setStartLocation(parts.join(", "));
              }
            }
          } catch {}
        } catch (e) {
          console.error("Error getting location:", e);
        }
      }
    };
    getCurrentLocation();
  }, [hasLocationPermission]);

  const handleStartJourney = async () => {
    if (!destination.trim()) {
      Alert.alert("Destination Required", "Please enter where you're going.");
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      const journey = await createJourney({
        startLocation,
        startLatitude: coordinates?.lat,
        startLongitude: coordinates?.lng,
        destination: destination.trim(),
        estimatedDuration: selectedDuration,
        bufferTime: 10,
        note: note.trim() || undefined,
      });

      if (journey) {
        navigation.replace("ActiveJourney");
      } else {
        Alert.alert("Error", "Failed to start journey. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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
        <Card style={styles.locationCard}>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: theme.success }]} />
            <View style={styles.locationInfo}>
              <ThemedText style={[styles.locationLabel, { color: theme.textSecondary }]}>
                Starting from
              </ThemedText>
              <ThemedText style={styles.locationValue}>{startLocation}</ThemedText>
            </View>
          </View>

          <View style={[styles.locationDivider, { backgroundColor: theme.border }]} />

          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: theme.primary }]} />
            <View style={styles.locationInfo}>
              <ThemedText style={[styles.locationLabel, { color: theme.textSecondary }]}>
                Going to
              </ThemedText>
              <TextInput
                style={[styles.destinationInput, { color: theme.text }]}
                placeholder="Enter destination"
                placeholderTextColor={theme.textSecondary}
                value={destination}
                onChangeText={setDestination}
                autoFocus
              />
            </View>
          </View>
        </Card>

        <ThemedText style={styles.sectionTitle}>Estimated Duration</ThemedText>
        <View style={styles.durationGrid}>
          {DURATION_OPTIONS.map((duration) => (
            <Pressable
              key={duration}
              style={[
                styles.durationButton,
                { backgroundColor: theme.backgroundSecondary },
                selectedDuration === duration && { backgroundColor: theme.primary },
              ]}
              onPress={() => {
                setSelectedDuration(duration);
                Haptics.selectionAsync();
              }}
            >
              <ThemedText
                style={[
                  styles.durationText,
                  selectedDuration === duration && { color: "#FFF" },
                ]}
              >
                {formatDuration(duration)}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.sectionTitle}>Add a Note (Optional)</ThemedText>
        <TextInput
          style={[
            styles.noteInput,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="e.g., Meeting with Sarah at the coffee shop"
          placeholderTextColor={theme.textSecondary}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
        />

        <View style={styles.infoBox}>
          <Feather name="info" size={16} color={theme.primary} />
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Your contacts will be notified if you don't check in within 10 minutes of your expected arrival.
          </ThemedText>
        </View>

        <Pressable
          style={[
            styles.startButton,
            { backgroundColor: theme.primary },
            isLoading && { opacity: 0.6 },
          ]}
          onPress={handleStartJourney}
          disabled={isLoading}
        >
          <Feather name="navigation" size={20} color="#FFF" />
          <ThemedText style={styles.startButtonText}>
            {isLoading ? "Starting..." : "Start Journey"}
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
  locationCard: {
    padding: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  locationLabel: {
    ...Typography.small,
    marginBottom: Spacing.xs,
  },
  locationValue: {
    ...Typography.body,
    fontWeight: "500",
  },
  destinationInput: {
    ...Typography.body,
    fontWeight: "500",
    padding: 0,
    margin: 0,
  },
  locationDivider: {
    width: 2,
    height: 24,
    marginLeft: 5,
    marginVertical: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  durationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  durationButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    minWidth: 80,
    alignItems: "center",
  },
  durationText: {
    ...Typography.body,
    fontWeight: "500",
  },
  noteInput: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 80,
    textAlignVertical: "top",
    ...Typography.body,
    marginBottom: Spacing.xl,
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
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  startButtonText: {
    color: "#FFF",
    ...Typography.body,
    fontWeight: "600",
  },
});
