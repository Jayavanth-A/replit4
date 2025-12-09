[x] 1. Install the required packages
[x] 2. Restart the workflow to see if the project is working
[x] 3. Verify the project is working using the feedback tool
[x] 4. Inform user the import is completed and they can start building, mark the import as completed using the complete_project_import tool

## Feature Implementation Progress

### Vonage Voice Calls for SOS Alerts
[x] Added voice call capability to server/vonage.ts using Vonage Voice API
[x] Created sendSOSAlertCall and sendJourneyOverdueCall functions
[x] Updated routes.ts to use combined SMS + Voice alerts (sendFullSOSAlert, sendFullJourneyOverdueAlert)
[x] Voice calls use text-to-speech to deliver emergency messages
[ ] Requires VONAGE_APPLICATION_ID, VONAGE_PRIVATE_KEY, and VONAGE_PHONE_NUMBER secrets

### Map with Route Display
[x] Created JourneyMap component using react-native-maps and react-native-maps-directions
[x] Added destination coordinates (destLatitude, destLongitude) to journey schema
[x] Integrated map into ActiveJourneyScreen
[x] Shows origin, destination markers and route polyline
[x] Tracks current user location during journey
[ ] Requires EXPO_PUBLIC_GOOGLE_MAPS_API_KEY for directions

### Voice Trigger Word Detection  
[x] Created useVoiceTrigger hook with Web Speech API support
[x] Listens for trigger words: user's code word, "help me", "help", "emergency"
[x] Integrated into ActiveJourneyScreen with toggle button
[x] Works on web browsers; mobile requires development build with speech recognition

### Required Environment Variables
- VONAGE_API_KEY (for SMS)
- VONAGE_API_SECRET (for SMS)
- VONAGE_APPLICATION_ID (for voice calls)
- VONAGE_PRIVATE_KEY (for voice calls - base64 or with \n for newlines)
- VONAGE_PHONE_NUMBER (for voice calls - the Vonage virtual number)
- EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (for map directions)
