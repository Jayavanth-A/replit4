import { Vonage } from "@vonage/server-sdk";

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY || "",
  apiSecret: process.env.VONAGE_API_SECRET || "",
});

const vonageVoice = process.env.VONAGE_APPLICATION_ID && process.env.VONAGE_PRIVATE_KEY
  ? new Vonage({
      applicationId: process.env.VONAGE_APPLICATION_ID,
      privateKey: process.env.VONAGE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  : null;

const VONAGE_FROM = "SafeConnect";
const VONAGE_PHONE_NUMBER = process.env.VONAGE_PHONE_NUMBER || "";

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface VoiceCallResult {
  success: boolean;
  callId?: string;
  error?: string;
}

export async function sendSMS(to: string, text: string): Promise<SMSResult> {
  try {
    const cleanPhone = to.replace(/[^\d+]/g, "");
    
    const response = await vonage.sms.send({
      to: cleanPhone,
      from: VONAGE_FROM,
      text: text,
    });

    const message = response.messages[0];
    if (message.status === "0") {
      console.log(`SMS sent successfully to ${cleanPhone}, messageId: ${(message as any)["message-id"]}`);
      return { success: true, messageId: (message as any)["message-id"] };
    } else {
      console.error(`SMS failed to ${cleanPhone}:`, (message as any).errorText || (message as any)["error-text"]);
      return { success: false, error: (message as any).errorText || (message as any)["error-text"] };
    }
  } catch (error: any) {
    console.error("Vonage SMS error:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

export async function makeEmergencyCall(
  to: string,
  message: string
): Promise<VoiceCallResult> {
  if (!vonageVoice) {
    console.warn("Vonage Voice not configured - missing VONAGE_APPLICATION_ID or VONAGE_PRIVATE_KEY");
    return { success: false, error: "Voice calling not configured" };
  }

  if (!VONAGE_PHONE_NUMBER) {
    console.warn("Vonage phone number not configured - missing VONAGE_PHONE_NUMBER");
    return { success: false, error: "Vonage phone number not configured" };
  }

  try {
    const cleanPhone = to.replace(/[^\d+]/g, "");
    
    const response = await vonageVoice.voice.createOutboundCall({
      to: [{
        type: 'phone',
        number: cleanPhone,
      }],
      from: {
        type: 'phone',
        number: VONAGE_PHONE_NUMBER,
      },
      ncco: [
        {
          action: 'talk',
          text: message,
          voiceName: 'Amy',
          language: 'en-US',
          bargeIn: false,
        },
        {
          action: 'talk',
          text: 'This message will now repeat.',
          voiceName: 'Amy',
        },
        {
          action: 'talk',
          text: message,
          voiceName: 'Amy',
          language: 'en-US',
        },
      ],
    });

    console.log(`Voice call initiated to ${cleanPhone}, callId: ${response.uuid}`);
    return { success: true, callId: response.uuid };
  } catch (error: any) {
    console.error("Vonage Voice error:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

export async function sendSOSAlertCall(
  contactPhone: string,
  contactName: string,
  userName: string,
  latitude?: string,
  longitude?: string
): Promise<VoiceCallResult> {
  let message = `Emergency Alert! This is an automated call from Safe Connect. ${userName} has triggered an emergency SOS alert and needs your help immediately.`;
  
  if (latitude && longitude) {
    message += ` Their current location has been sent to you via text message with a Google Maps link.`;
  }
  
  message += ` Please try to contact ${userName} immediately or call emergency services if you cannot reach them. This is urgent.`;
  
  return makeEmergencyCall(contactPhone, message);
}

export async function sendJourneyOverdueCall(
  contactPhone: string,
  contactName: string,
  userName: string,
  destination: string
): Promise<VoiceCallResult> {
  const message = `Attention! This is an automated call from Safe Connect. ${userName} has not arrived at their expected destination: ${destination}. They may need assistance. Please try to contact them immediately to ensure they are safe. If you cannot reach them, consider notifying emergency services.`;
  
  return makeEmergencyCall(contactPhone, message);
}

export async function sendSOSAlertSMS(
  contactPhone: string,
  contactName: string,
  userName: string,
  latitude?: string,
  longitude?: string
): Promise<SMSResult> {
  let message = `EMERGENCY ALERT from SafeConnect!\n\n${userName} has triggered an SOS emergency alert.`;
  
  if (latitude && longitude) {
    const mapsUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;
    message += `\n\nCurrent Location:\n${mapsUrl}`;
  }
  
  message += `\n\nPlease try to contact ${userName} immediately or call emergency services if needed.`;
  
  return sendSMS(contactPhone, message);
}

export async function sendFullSOSAlert(
  contactPhone: string,
  contactName: string,
  userName: string,
  latitude?: string,
  longitude?: string
): Promise<{ sms: SMSResult; call: VoiceCallResult }> {
  const smsPromise = sendSOSAlertSMS(contactPhone, contactName, userName, latitude, longitude);
  
  let callResult: VoiceCallResult;
  if (isVoiceConfigured()) {
    callResult = await sendSOSAlertCall(contactPhone, contactName, userName, latitude, longitude);
  } else {
    callResult = { success: false, error: "Voice calling not configured" };
  }
  
  const smsResult = await smsPromise;
  
  return { sms: smsResult, call: callResult };
}

export async function sendJourneyStartSMS(
  contactPhone: string,
  contactName: string,
  userName: string,
  startLocation: string,
  destination: string,
  estimatedDuration: number,
  expectedArrivalTime: Date
): Promise<SMSResult> {
  const arrivalTimeStr = expectedArrivalTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  
  const message = `SafeConnect Journey Alert\n\n${userName} has started a journey:\n\nFrom: ${startLocation}\nTo: ${destination}\n\nExpected Duration: ${estimatedDuration} minutes\nExpected Arrival: ${arrivalTimeStr}\n\nYou'll be notified if they don't arrive safely.`;
  
  return sendSMS(contactPhone, message);
}

export async function sendJourneyCompletedSMS(
  contactPhone: string,
  contactName: string,
  userName: string,
  destination: string
): Promise<SMSResult> {
  const message = `SafeConnect Update\n\n${userName} has arrived safely at ${destination}. No action needed.`;
  
  return sendSMS(contactPhone, message);
}

export async function sendJourneyOverdueSMS(
  contactPhone: string,
  contactName: string,
  userName: string,
  destination: string,
  startLocation: string,
  lastLatitude?: string,
  lastLongitude?: string
): Promise<SMSResult> {
  let message = `ATTENTION: SafeConnect Alert\n\n${userName} has not arrived at their destination.\n\nRoute: ${startLocation} to ${destination}`;
  
  if (lastLatitude && lastLongitude) {
    const mapsUrl = `https://maps.google.com/maps?q=${lastLatitude},${lastLongitude}`;
    message += `\n\nLast Known Location:\n${mapsUrl}`;
  }
  
  message += `\n\nPlease try to contact ${userName} to ensure they are safe.`;
  
  return sendSMS(contactPhone, message);
}

export async function sendFullJourneyOverdueAlert(
  contactPhone: string,
  contactName: string,
  userName: string,
  destination: string,
  startLocation: string,
  lastLatitude?: string,
  lastLongitude?: string
): Promise<{ sms: SMSResult; call: VoiceCallResult }> {
  const smsPromise = sendJourneyOverdueSMS(contactPhone, contactName, userName, destination, startLocation, lastLatitude, lastLongitude);
  
  let callResult: VoiceCallResult;
  if (isVoiceConfigured()) {
    callResult = await sendJourneyOverdueCall(contactPhone, contactName, userName, destination);
  } else {
    callResult = { success: false, error: "Voice calling not configured" };
  }
  
  const smsResult = await smsPromise;
  
  return { sms: smsResult, call: callResult };
}

const otpStore = new Map<string, { code: string; expires: number; attempts: number }>();

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  const code = generateOTP();
  const expires = Date.now() + 10 * 60 * 1000;
  
  otpStore.set(phone, { code, expires, attempts: 0 });
  
  const message = `Your SafeConnect verification code is: ${code}\n\nThis code expires in 10 minutes.`;
  
  const result = await sendSMS(phone, message);
  
  if (!result.success) {
    otpStore.delete(phone);
  }
  
  return { success: result.success, error: result.error };
}

export function verifyOTP(phone: string, code: string): { valid: boolean; error?: string } {
  const stored = otpStore.get(phone);
  
  if (!stored) {
    return { valid: false, error: "No verification code found. Please request a new code." };
  }
  
  if (Date.now() > stored.expires) {
    otpStore.delete(phone);
    return { valid: false, error: "Verification code has expired. Please request a new code." };
  }
  
  if (stored.attempts >= 3) {
    otpStore.delete(phone);
    return { valid: false, error: "Too many attempts. Please request a new code." };
  }
  
  if (stored.code !== code) {
    stored.attempts++;
    return { valid: false, error: "Invalid verification code. Please try again." };
  }
  
  otpStore.delete(phone);
  return { valid: true };
}

export function isVoiceConfigured(): boolean {
  return vonageVoice !== null && !!VONAGE_PHONE_NUMBER;
}
