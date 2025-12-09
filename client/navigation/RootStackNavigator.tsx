import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import OnboardingScreen from "@/screens/OnboardingScreen";
import JourneySetupScreen from "@/screens/JourneySetupScreen";
import ActiveJourneyScreen from "@/screens/ActiveJourneyScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import EmergencyContactsScreen from "@/screens/EmergencyContactsScreen";
import AddContactScreen from "@/screens/AddContactScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useUserStore } from "@/stores/userStore";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  JourneySetup: undefined;
  ActiveJourney: undefined;
  EditProfile: undefined;
  EmergencyContacts: undefined;
  AddContact: { editId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isOnboarded, userId, fetchUser, fetchEmergencyContacts, fetchActiveJourney } = useUserStore();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (userId) {
        await Promise.all([
          fetchUser(userId),
          fetchEmergencyContacts(),
          fetchActiveJourney(),
        ]);
      }
      setIsLoading(false);
    };
    loadUserData();
  }, [userId]);

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isOnboarded ? (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="JourneySetup"
            component={JourneySetupScreen}
            options={{ headerTitle: "Start Journey" }}
          />
          <Stack.Screen
            name="ActiveJourney"
            component={ActiveJourneyScreen}
            options={{ 
              headerTitle: "Active Journey",
              headerBackVisible: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ headerTitle: "Edit Profile" }}
          />
          <Stack.Screen
            name="EmergencyContacts"
            component={EmergencyContactsScreen}
            options={{ headerTitle: "Emergency Contacts" }}
          />
          <Stack.Screen
            name="AddContact"
            component={AddContactScreen}
            options={{ headerTitle: "Add Contact" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
