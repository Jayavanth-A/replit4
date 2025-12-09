# Design Guidelines: Safe Connect - Personal Safety App

## Architecture Decisions

### Authentication
**Auth Required**: Yes
- **Implementation**: Apple Sign-In for iOS, Google Sign-In for cross-platform
- **Rationale**: Sensitive personal data and emergency contacts require secure storage and cross-device sync
- **Auth Flow**: 
  - First-time users go through onboarding to set up profile and emergency contacts
  - Returning users authenticate via SSO
  - Account deletion requires double confirmation (Settings > Account > Delete)

### Navigation Architecture
**Root Navigation**: Tab Navigation (3 tabs)
- **Home Tab**: Emergency access and journey status
- **Journey Tab** (Center): Core action for starting/managing journeys  
- **Profile Tab**: User details, emergency contacts, settings

**Screen Stacks**:
- Home Stack: Home → Journey History → Journey Details
- Journey Stack: Journey Setup → Active Journey (modal)
- Profile Stack: Profile → Edit Profile → Emergency Contacts → Settings

## Screen Specifications

### 1. Home Screen (Tab 1)
- **Header**: Transparent, "Safe Connect" title, settings icon (right)
- **Layout**: Scrollable, safe insets: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components**:
  - Large circular SOS button (most prominent element)
  - Voice activation status card
  - Active journey card (if in progress)
  - Recent journey history (last 5)
  - "Start Journey" quick action button

### 2. Active Journey Screen (Modal)
- **Header**: Custom transparent, "Cancel Journey" button (left)
- **Layout**: Non-scrollable with map view, floating elements
- **Safe Insets**: bottom = insets.bottom + 80, top = headerHeight + Spacing.xl
- **Components**:
  - Full-screen map with route and current location
  - Floating journey info card (top): ETA, time remaining, distance
  - Floating SOS button (bottom-right, circular with shadow)
  - Voice activation indicator (top-left)
- **Interaction**: SOS requires 1-second hold to prevent accidental triggers

### 3. Journey Setup Screen (Tab 2)
- **Header**: Default, "New Journey" title, "Start" button (right, disabled until valid)
- **Layout**: Scrollable form
- **Safe Insets**: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components**:
  - Starting point (auto-filled with current location)
  - Destination (search input)
  - 3 route option cards with time estimates
  - Emergency contact multi-select
  - Expected delay slider (0-30 min)
  - Optional journey note field

### 4. Profile Screen (Tab 3)
- **Header**: Transparent, "Profile" title, "Edit" button (right)
- **Layout**: Scrollable
- **Safe Insets**: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components**:
  - User avatar (tappable to change)
  - Display name
  - Personal safety details: height, weight, skin tone, eye color, distinguishing features
  - Emergency contacts list
  - Settings sections: Voice Activation, Notifications, Privacy, Account

### 5. Edit Profile Screen
- **Header**: Default, "Edit Profile", "Cancel" (left), "Save" (right)
- **Layout**: Scrollable form
- **Components**:
  - Avatar picker grid
  - Form fields: name, height, weight, skin tone dropdown, eye color dropdown
  - Physical description text area
  - Optional medical info

### 6. Emergency Contacts Screen
- **Header**: Default, "Emergency Contacts", "Add" button (right)
- **Layout**: List view
- **Components**:
  - Contact cards with name, relationship, phone, primary toggle
  - Empty state message
  - Add/edit contact modal
- **Requirements**: Minimum 1, maximum 5 contacts

### 7. SOS Confirmation Modal
- **Layout**: Center modal, high contrast
- **Components**:
  - Warning icon
  - "Send Emergency Alert?" heading
  - Explanation text
  - "Cancel" and "Send Alert" (red, destructive) buttons
  - Auto-trigger countdown (3-2-1) for voice activation
- **Interaction**: Haptic feedback, cancelable anytime

## Design System

### Colors
- **Primary**: #DC2626 (Red-600) - SOS, emergency actions
- **Primary Light**: #FCA5A5 (Red-300) - Alert backgrounds
- **Secondary**: #2563EB (Blue-600) - Journey actions
- **Secondary Light**: #93C5FD (Blue-300) - Journey cards
- **Success**: #16A34A (Green-600) - Safe status
- **Warning**: #F59E0B (Amber-500) - Time warnings
- **Background**: #FFFFFF / #F9FAFB (Gray-50)
- **Text**: #111827 (Gray-900) / #6B7280 (Gray-500)
- **Border**: #E5E7EB (Gray-200)

### Typography
- **Display**: System Bold, 32pt - Headlines
- **Title Large**: System Semibold, 28pt - Screen titles
- **Title**: System Semibold, 20pt - Section headers
- **Body**: System Regular, 16pt - Default
- **Caption**: System Regular, 14pt - Metadata
- **Button**: System Semibold, 16pt - Buttons

### Visual Design

**SOS Button**:
- 120pt circular diameter
- Background: #DC2626
- White "SOS" text, Title Large
- Shadow: offset {width: 0, height: 2}, opacity 0.10, radius 2
- Active: Scale 0.95
- Hold-to-activate: Progress ring

**Touchable Feedback**:
- Standard buttons: Opacity 0.7
- Cards: Scale 0.98
- SOS: Heavy haptic feedback
- Emergency actions: Haptic warning pattern

**Form Inputs**:
- Height: 48pt, border radius 8pt
- Focus: 2pt border, secondary color
- Error: 2pt border, primary color with message

**Icons** (Feather from @expo/vector-icons):
- Emergency: alert-circle
- Journey: navigation, map-pin
- Profile: user
- Settings: settings
- Location: map-pin
- Contacts: users
- Voice: mic

### Critical Assets
- 8 preset user avatars (simple geometric silhouettes)
- App icon and splash screen with safety theme
- Emergency alert icons