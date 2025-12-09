import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useUserStore } from "@/stores/userStore";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import type { EmergencyContact } from "@shared/schema";

export default function EmergencyContactsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { emergencyContacts, fetchEmergencyContacts, deleteEmergencyContact } = useUserStore();

  useFocusEffect(
    useCallback(() => {
      fetchEmergencyContacts();
    }, [])
  );

  const handleDelete = (contact: EmergencyContact) => {
    Alert.alert(
      "Delete Contact",
      `Are you sure you want to remove ${contact.name} from your emergency contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await deleteEmergencyContact(contact.id);
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: EmergencyContact }) => (
    <Card style={styles.contactCard}>
      <View style={styles.contactContent}>
        <View style={[styles.avatarCircle, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="user" size={24} color={theme.primary} />
        </View>
        <View style={styles.contactInfo}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.contactName}>{item.name}</ThemedText>
            {item.isPrimary && (
              <View style={[styles.primaryBadge, { backgroundColor: theme.primary + "20" }]}>
                <ThemedText style={[styles.primaryText, { color: theme.primary }]}>
                  Primary
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={[styles.contactPhone, { color: theme.textSecondary }]}>
            {item.phone}
          </ThemedText>
          <ThemedText style={[styles.contactRelationship, { color: theme.textSecondary }]}>
            {item.relationship}
          </ThemedText>
        </View>
        <Pressable
          style={[styles.deleteButton, { backgroundColor: theme.dangerLight }]}
          onPress={() => handleDelete(item)}
        >
          <Feather name="trash-2" size={18} color={theme.danger} />
        </Pressable>
      </View>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.danger + "20" }]}>
        <Feather name="users" size={48} color={theme.danger} />
      </View>
      <ThemedText style={styles.emptyTitle}>No Emergency Contacts</ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        Add people who should be notified in case of an emergency.
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={emergencyContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: headerHeight + Spacing.xl, paddingBottom: insets.bottom + Spacing["3xl"] },
          emergencyContacts.length === 0 && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={renderEmpty}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            Haptics.selectionAsync();
            navigation.navigate("AddContact");
          }}
        >
          <Feather name="plus" size={24} color="#FFF" />
          <ThemedText style={styles.addButtonText}>Add Contact</ThemedText>
        </Pressable>
      </View>
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
  contactCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  contactContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  contactInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  contactName: {
    ...Typography.body,
    fontWeight: "600",
  },
  primaryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  primaryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  contactPhone: {
    ...Typography.body,
    marginTop: Spacing.xs,
  },
  contactRelationship: {
    ...Typography.small,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  addButtonText: {
    color: "#FFF",
    ...Typography.body,
    fontWeight: "600",
  },
});
