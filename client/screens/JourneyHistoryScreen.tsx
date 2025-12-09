import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useUserStore } from "@/stores/userStore";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { Journey } from "@shared/schema";

export default function JourneyHistoryScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { userId } = useUserStore();

  const { data: journeys = [], isLoading, refetch } = useQuery<Journey[]>({
    queryKey: ["/api/users", userId, "journeys"],
    enabled: !!userId,
  });

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        refetch();
      }
    }, [userId])
  );

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "completed":
        return { icon: "check-circle", color: theme.success, label: "Completed" };
      case "cancelled":
        return { icon: "x-circle", color: theme.textSecondary, label: "Cancelled" };
      case "active":
        return { icon: "navigation", color: theme.primary, label: "Active" };
      default:
        return { icon: "circle", color: theme.textSecondary, label: status };
    }
  };

  const completedJourneys = journeys.filter((j) => j.status !== "active");

  const renderItem = ({ item }: { item: Journey }) => {
    const statusInfo = getStatusInfo(item.status);

    return (
      <Card style={styles.journeyCard}>
        <View style={styles.journeyHeader}>
          <View style={[styles.statusIcon, { backgroundColor: statusInfo.color + "20" }]}>
            <Feather name={statusInfo.icon as any} size={20} color={statusInfo.color} />
          </View>
          <View style={styles.journeyInfo}>
            <ThemedText style={styles.destination}>{item.destination}</ThemedText>
            <ThemedText style={[styles.dateText, { color: theme.textSecondary }]}>
              {formatDate(item.createdAt!)} at {formatTime(item.createdAt!)}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "20" }]}>
            <ThemedText style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </ThemedText>
          </View>
        </View>

        <View style={styles.journeyDetails}>
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              From: {item.startLocation}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather name="clock" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              Duration: {item.estimatedDuration} min
            </ThemedText>
          </View>
        </View>

        {item.note ? (
          <View style={[styles.noteBox, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText style={[styles.noteText, { color: theme.textSecondary }]}>
              {item.note}
            </ThemedText>
          </View>
        ) : null}
      </Card>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.primary + "20" }]}>
        <Feather name="map" size={48} color={theme.primary} />
      </View>
      <ThemedText style={styles.emptyTitle}>No Journeys Yet</ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        Start your first journey from the home screen to see your history here.
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={completedJourneys}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + Spacing["3xl"], paddingBottom: tabBarHeight + Spacing.xl },
          completedJourneys.length === 0 && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListHeaderComponent={
          <ThemedText style={styles.headerTitle}>Journey History</ThemedText>
        }
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyList: {
    flexGrow: 1,
  },
  headerTitle: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
  },
  journeyCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  journeyHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  journeyInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  destination: {
    ...Typography.body,
    fontWeight: "600",
  },
  dateText: {
    ...Typography.small,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    ...Typography.small,
    fontWeight: "500",
  },
  journeyDetails: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailText: {
    ...Typography.small,
  },
  noteBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
  },
  noteText: {
    ...Typography.small,
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h3,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    textAlign: "center",
  },
});
