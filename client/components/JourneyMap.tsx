import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface JourneyMapProps {
  origin?: Coordinates;
  destination?: Coordinates;
  currentLocation?: Coordinates;
  onRouteReady?: (result: { distance: number; duration: number }) => void;
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function JourneyMap({
  origin,
  destination,
  currentLocation,
  onRouteReady,
}: JourneyMapProps) {
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (mapRef.current && origin && destination) {
      const coordinates = [origin, destination];
      if (currentLocation) {
        coordinates.push(currentLocation);
      }
      
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 80, right: 40, bottom: 80, left: 40 },
          animated: true,
        });
      }, 500);
    }
  }, [origin, destination, currentLocation]);

  if (!origin || !destination) {
    return (
      <View style={[styles.placeholder, { backgroundColor: theme.backgroundSecondary }]}>
        <ThemedText style={[styles.placeholderText, { color: theme.textSecondary }]}>
          Location coordinates not available
        </ThemedText>
      </View>
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <View style={[styles.placeholder, { backgroundColor: theme.backgroundSecondary }]}>
        <ThemedText style={[styles.placeholderText, { color: theme.textSecondary }]}>
          Map requires Google Maps API key
        </ThemedText>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: (origin.latitude + destination.latitude) / 2,
    longitude: (origin.longitude + destination.longitude) / 2,
    latitudeDelta: Math.abs(origin.latitude - destination.latitude) * 1.5 || 0.1,
    longitudeDelta: Math.abs(origin.longitude - destination.longitude) * 1.5 || 0.1,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
      >
        <Marker
          coordinate={origin}
          title="Start"
          pinColor={theme.success}
        />
        
        <Marker
          coordinate={destination}
          title="Destination"
          pinColor={theme.primary}
        />

        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Current Location"
            pinColor={theme.warning}
          />
        )}

        <MapViewDirections
          origin={origin}
          destination={destination}
          apikey={GOOGLE_MAPS_API_KEY}
          strokeWidth={4}
          strokeColor={theme.primary}
          mode="DRIVING"
          onReady={(result) => {
            if (onRouteReady) {
              onRouteReady({
                distance: result.distance,
                duration: result.duration,
              });
            }
            
            mapRef.current?.fitToCoordinates(result.coordinates, {
              edgePadding: { top: 80, right: 40, bottom: 80, left: 40 },
              animated: true,
            });
          }}
          onError={(errorMessage) => {
            console.error("Directions API error:", errorMessage);
          }}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  placeholderText: {
    textAlign: "center",
  },
});
