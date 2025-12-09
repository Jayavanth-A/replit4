import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, EmergencyContact, Journey } from '@shared/schema';
import { apiRequest, getApiUrl } from '@/lib/query-client';

interface UserState {
  userId: string | null;
  user: User | null;
  emergencyContacts: EmergencyContact[];
  activeJourney: Journey | null;
  isOnboarded: boolean;
  hasLocationPermission: boolean;
  
  setUserId: (id: string | null) => void;
  setUser: (user: User | null) => void;
  setEmergencyContacts: (contacts: EmergencyContact[]) => void;
  addEmergencyContact: (contact: EmergencyContact) => void;
  removeEmergencyContact: (id: string) => void;
  setActiveJourney: (journey: Journey | null) => void;
  setOnboarded: (value: boolean) => void;
  setLocationPermission: (value: boolean) => void;
  
  createUser: (name: string, avatarIndex?: number) => Promise<User>;
  fetchUser: (id: string) => Promise<User | null>;
  updateUser: (data: Partial<User>) => Promise<User | null>;
  fetchEmergencyContacts: () => Promise<void>;
  createEmergencyContact: (contact: Omit<EmergencyContact, 'id' | 'createdAt'>) => Promise<EmergencyContact | null>;
  deleteEmergencyContact: (id: string) => Promise<boolean>;
  fetchActiveJourney: () => Promise<Journey | null>;
  createJourney: (data: {
    startLocation: string;
    startLatitude?: string;
    startLongitude?: string;
    destination: string;
    estimatedDuration: number;
    bufferTime?: number;
    note?: string;
  }) => Promise<Journey | null>;
  completeJourney: (arrived: boolean) => Promise<void>;
  sendSOSAlert: (latitude?: string, longitude?: string) => Promise<boolean>;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: null,
      user: null,
      emergencyContacts: [],
      activeJourney: null,
      isOnboarded: false,
      hasLocationPermission: false,

      setUserId: (id) => set({ userId: id }),
      setUser: (user) => set({ user }),
      setEmergencyContacts: (contacts) => set({ emergencyContacts: contacts }),
      addEmergencyContact: (contact) =>
        set((state) => ({ emergencyContacts: [...state.emergencyContacts, contact] })),
      removeEmergencyContact: (id) =>
        set((state) => ({
          emergencyContacts: state.emergencyContacts.filter((c) => c.id !== id),
        })),
      setActiveJourney: (journey) => set({ activeJourney: journey }),
      setOnboarded: (value) => set({ isOnboarded: value }),
      setLocationPermission: (value) => set({ hasLocationPermission: value }),

      createUser: async (name, avatarIndex = 0) => {
        try {
          const res = await apiRequest('POST', '/api/users', { name, avatarIndex });
          const user = await res.json();
          set({ user, userId: user.id, isOnboarded: true });
          return user;
        } catch (error) {
          console.error('Failed to create user:', error);
          throw error;
        }
      },

      fetchUser: async (id) => {
        try {
          const baseUrl = getApiUrl();
          const url = new URL(`/api/users/${id}`, baseUrl);
          const res = await fetch(url.toString());
          if (!res.ok) return null;
          const user = await res.json();
          set({ user });
          return user;
        } catch (error) {
          console.error('Failed to fetch user:', error);
          return null;
        }
      },

      updateUser: async (data) => {
        const { userId } = get();
        if (!userId) return null;
        try {
          const res = await apiRequest('PATCH', `/api/users/${userId}`, data);
          const user = await res.json();
          set({ user });
          return user;
        } catch (error) {
          console.error('Failed to update user:', error);
          return null;
        }
      },

      fetchEmergencyContacts: async () => {
        const { userId } = get();
        if (!userId) return;
        try {
          const baseUrl = getApiUrl();
          const url = new URL(`/api/users/${userId}/contacts`, baseUrl);
          const res = await fetch(url.toString());
          if (!res.ok) return;
          const contacts = await res.json();
          set({ emergencyContacts: contacts });
        } catch (error) {
          console.error('Failed to fetch contacts:', error);
        }
      },

      createEmergencyContact: async (contact) => {
        const { userId } = get();
        if (!userId) return null;
        try {
          const res = await apiRequest('POST', '/api/contacts', { ...contact, userId });
          const newContact = await res.json();
          set((state) => ({ emergencyContacts: [...state.emergencyContacts, newContact] }));
          return newContact;
        } catch (error) {
          console.error('Failed to create contact:', error);
          return null;
        }
      },

      deleteEmergencyContact: async (id) => {
        try {
          await apiRequest('DELETE', `/api/contacts/${id}`);
          set((state) => ({
            emergencyContacts: state.emergencyContacts.filter((c) => c.id !== id),
          }));
          return true;
        } catch (error) {
          console.error('Failed to delete contact:', error);
          return false;
        }
      },

      fetchActiveJourney: async () => {
        const { userId } = get();
        if (!userId) return null;
        try {
          const baseUrl = getApiUrl();
          const url = new URL(`/api/users/${userId}/journeys/active`, baseUrl);
          const res = await fetch(url.toString());
          if (!res.ok) return null;
          const journey = await res.json();
          set({ activeJourney: journey });
          return journey;
        } catch (error) {
          console.error('Failed to fetch active journey:', error);
          return null;
        }
      },

      createJourney: async (data) => {
        const { userId } = get();
        if (!userId) return null;
        try {
          const expectedArrival = new Date(
            Date.now() + (data.estimatedDuration + (data.bufferTime || 10)) * 60 * 1000
          );
          const res = await apiRequest('POST', '/api/journeys', {
            ...data,
            userId,
            status: 'active',
            expectedArrival: expectedArrival.toISOString(),
          });
          const journey = await res.json();
          set({ activeJourney: journey });
          return journey;
        } catch (error) {
          console.error('Failed to create journey:', error);
          return null;
        }
      },

      completeJourney: async (arrived) => {
        const { activeJourney } = get();
        if (!activeJourney) return;
        try {
          await apiRequest('PATCH', `/api/journeys/${activeJourney.id}`, {
            status: arrived ? 'completed' : 'cancelled',
            completedAt: new Date().toISOString(),
          });
          set({ activeJourney: null });
        } catch (error) {
          console.error('Failed to complete journey:', error);
        }
      },

      sendSOSAlert: async (latitude, longitude) => {
        const { userId, activeJourney } = get();
        if (!userId) return false;
        try {
          await apiRequest('POST', '/api/alerts', {
            userId,
            journeyId: activeJourney?.id || null,
            type: 'sos',
            latitude,
            longitude,
            status: 'sent',
          });
          return true;
        } catch (error) {
          console.error('Failed to send SOS alert:', error);
          return false;
        }
      },

      reset: () =>
        set({
          userId: null,
          user: null,
          emergencyContacts: [],
          activeJourney: null,
          isOnboarded: false,
          hasLocationPermission: false,
        }),
    }),
    {
      name: 'safe-connect-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userId: state.userId,
        isOnboarded: state.isOnboarded,
        hasLocationPermission: state.hasLocationPermission,
      }),
    }
  )
);
