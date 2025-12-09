import React from "react";
import { View, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useUserStore } from "@/stores/userStore";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const AVATARS = [
  { icon: "user", color: "#007AFF" },
  { icon: "smile", color: "#34C759" },
  { icon: "heart", color: "#FF2D55" },
  { icon: "star", color: "#FF9500" },
  { icon: "sun", color: "#FFCC00" },
  { icon: "moon", color: "#5856D6" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { user, emergencyContacts, reset } = useUserStore();

  const avatarInfo = AVATARS[user?.avatarIndex || 0];

  const handleLogout = () => {
    Alert.alert(
      "Reset App",
      "This will reset all your data and return to onboarding. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            reset();
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: "user",
      title: "Edit Profile",
      subtitle: "Update your personal information",
      onPress: () => navigation.navigate("EditProfile"),
    },
    {
      icon: "users",
      title: "Emergency Contacts",
      subtitle: `${emergencyContacts.length} contact${emergencyContacts.length !== 1 ? "s" : ""} saved`,
      onPress: () => navigation.navigate("EmergencyContacts"),
    },
  ];

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
            <Feather name={avatarInfo.icon as any} size={40} color={avatarInfo.color} />
          </View>
          <ThemedText style={styles.userName}>{user?.name || "User"}</ThemedText>
          <ThemedText style={[styles.userSubtitle, { color: theme.textSecondary }]}>
            Safe Connect Member
          </ThemedText>
        </View>

        <Card style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.title}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                item.onPress();
              }}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: theme.primary + "20" }]}>
                <Feather name={item.icon as any} size={20} color={theme.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <ThemedText style={styles.menuTitle}>{item.title}</ThemedText>
                <ThemedText style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                  {item.subtitle}
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          ))}
        </Card>

        {user?.codeWord ? (
          <Card style={styles.codeWordCard}>
            <View style={styles.codeWordHeader}>
              <View style={[styles.codeWordIcon, { backgroundColor: theme.warning + "20" }]}>
                <Feather name="key" size={20} color={theme.warning} />
              </View>
              <ThemedText style={styles.codeWordTitle}>Secret Code Word</ThemedText>
            </View>
            <ThemedText style={[styles.codeWordText, { color: theme.textSecondary }]}>
              Your code word: <ThemedText style={styles.codeWordValue}>{user.codeWord}</ThemedText>
            </ThemedText>
            <ThemedText style={[styles.codeWordHint, { color: theme.textSecondary }]}>
              Share this with your contacts. They can ask for it to verify it's really you.
            </ThemedText>
          </Card>
        ) : null}

        <Card style={styles.statsCard}>
          <ThemedText style={styles.statsTitle}>App Status</ThemedText>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: theme.primary }]}>
                {emergencyContacts.length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Contacts
              </ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Feather
                name="check-circle"
                size={24}
                color={theme.success}
              />
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Protected
              </ThemedText>
            </View>
          </View>
        </Card>

        <Pressable
          style={[styles.logoutButton, { borderColor: theme.danger }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color={theme.danger} />
          <ThemedText style={[styles.logoutText, { color: theme.danger }]}>Reset App</ThemedText>
        </Pressable>
      </ScrollView>
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
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  userName: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  userSubtitle: {
    ...Typography.body,
  },
  menuCard: {
    marginBottom: Spacing.lg,
    padding: 0,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  menuTitle: {
    ...Typography.body,
    fontWeight: "600",
  },
  menuSubtitle: {
    ...Typography.small,
  },
  codeWordCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  codeWordHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  codeWordIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  codeWordTitle: {
    ...Typography.body,
    fontWeight: "600",
  },
  codeWordText: {
    ...Typography.body,
    marginBottom: Spacing.sm,
  },
  codeWordValue: {
    fontWeight: "700",
  },
  codeWordHint: {
    ...Typography.small,
    fontStyle: "italic",
  },
  statsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  statsTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    ...Typography.h3,
  },
  statLabel: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  logoutText: {
    ...Typography.body,
    fontWeight: "600",
  },
});
