# Safe Connect - Personal Safety App

## Overview

Safe Connect is a personal safety mobile application built with React Native (Expo) and Express.js. The app enables users to track journeys, send emergency SOS alerts to designated contacts, and store personal identification details that can help in emergency situations.

Core features include:
- **Journey Tracking**: Users can start monitored journeys with expected arrival times, receiving alerts if they don't check in
- **SOS Emergency Alerts**: One-tap emergency alerts that send SMS and voice call notifications with location data to emergency contacts
- **Map with Route Display**: Active journey screen shows a map with origin, destination, current location, and driving route
- **Voice Trigger Detection**: Hands-free SOS activation by speaking trigger words (user's code word, "help me", "help", "emergency")
- **Personal Profile**: Storage of physical characteristics and identifying information for emergency situations
- **Emergency Contacts**: Management of trusted contacts who receive alerts during emergencies

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation with native stack and bottom tabs
  - Tab Navigation (3 tabs): Home, Journey History, Profile
  - Modal presentation for Active Journey screen
- **State Management**: Zustand with AsyncStorage persistence for user data
- **Data Fetching**: TanStack Query (React Query) for server state
- **Styling**: React Native StyleSheet with custom theming (light/dark mode support)
- **Animations**: React Native Reanimated for gesture-based interactions
- **Path Aliases**: `@/` maps to `./client`, `@shared/` maps to `./shared`

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **API Pattern**: RESTful JSON API at `/api/*` routes
- **Validation**: Zod schemas generated from Drizzle schemas via `drizzle-zod`

### Data Model
Four main entities defined in `shared/schema.ts`:
1. **Users**: Profile data including physical characteristics (height, weight, skin tone, eye color, distinguishing features, medical info, code word)
2. **Emergency Contacts**: Linked contacts with phone, relationship, and primary designation
3. **Journeys**: Trip tracking with start/end locations, timestamps, status, and coordinates
4. **Alerts**: Emergency alert records with type, location, and contact notification status

### Authentication
- Currently uses client-side user ID persistence (no OAuth implemented yet)
- Designed for future Apple Sign-In (iOS) and Google Sign-In integration
- Onboarding flow creates user profile and initial emergency contact

### Build System
- **Development**: Expo dev server with Metro bundler, separate Express server
- **Production**: Static web build with esbuild for server bundling
- **Database Migrations**: Drizzle Kit for schema management

## External Dependencies

### SMS & Voice Notifications
- **Vonage (Nexmo)**: SMS and Voice API for sending emergency alerts
- SMS Environment variables: `VONAGE_API_KEY`, `VONAGE_API_SECRET`
- Voice Environment variables: `VONAGE_APPLICATION_ID`, `VONAGE_PRIVATE_KEY`, `VONAGE_PHONE_NUMBER`
- Features: SOS alerts (SMS + voice call), journey start/complete/overdue notifications, OTP verification

### Maps & Directions
- **Google Maps**: Map display and driving directions on Active Journey screen
- Environment variable: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- Uses `react-native-maps` and `react-native-maps-directions`

### Database
- **PostgreSQL**: Primary data store
- Environment variable: `DATABASE_URL`
- ORM: Drizzle with `drizzle-orm/node-postgres`

### Location Services
- **Expo Location**: Device location for journey tracking and SOS alerts
- Permissions: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` (Android), `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysUsageDescription` (iOS)

### Key Dependencies
- `expo-location`: GPS/location services
- `expo-haptics`: Tactile feedback for SOS and actions
- `@vonage/server-sdk`: SMS and voice call delivery
- `drizzle-orm` + `pg`: Database operations
- `zustand`: Client state management with persistence
- `@tanstack/react-query`: Server state and caching
- `react-native-maps`: Map display component
- `react-native-maps-directions`: Driving route visualization

### Key Components
- `client/components/JourneyMap.tsx`: Map with route display for active journeys
- `client/hooks/useVoiceTrigger.ts`: Web Speech API hook for voice-activated SOS