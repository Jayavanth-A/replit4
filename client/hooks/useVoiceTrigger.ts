import { useState, useEffect, useCallback, useRef } from "react";
import { Platform, Alert } from "react-native";

interface UseVoiceTriggerOptions {
  triggerWords: string[];
  onTrigger: () => void;
  enabled?: boolean;
}

interface UseVoiceTriggerReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  lastTranscript: string;
  error: string | null;
}

export function useVoiceTrigger({
  triggerWords,
  onTrigger,
  enabled = true,
}: UseVoiceTriggerOptions): UseVoiceTriggerReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          const currentTranscript = (finalTranscript || interimTranscript).toLowerCase();
          setLastTranscript(currentTranscript);

          const normalizedTriggers = triggerWords.map((w) => w.toLowerCase().trim());
          const triggered = normalizedTriggers.some((trigger) =>
            currentTranscript.includes(trigger)
          );

          if (triggered && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            console.log("Voice trigger detected:", currentTranscript);
            onTrigger();
            
            setTimeout(() => {
              hasTriggeredRef.current = false;
            }, 5000);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            setError("Microphone access denied. Please enable microphone permissions.");
          } else if (event.error !== "aborted") {
            setError(`Voice recognition error: ${event.error}`);
          }
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          if (isListening && enabled) {
            try {
              recognitionRef.current?.start();
            } catch (e) {
              console.log("Recognition restart failed:", e);
            }
          }
        };
      } else {
        setIsSupported(false);
        setError("Speech recognition not supported in this browser");
      }
    } else {
      setIsSupported(false);
      setError("Voice trigger requires a development build with speech recognition. Enable in app settings for mobile.");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [triggerWords, onTrigger, enabled]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      return;
    }

    setError(null);
    hasTriggeredRef.current = false;
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e: any) {
      if (e.message?.includes("already started")) {
        setIsListening(true);
      } else {
        setError("Failed to start voice recognition");
        console.error("Failed to start recognition:", e);
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      // Ignore stop errors
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!enabled && isListening) {
      stopListening();
    }
  }, [enabled, isListening, stopListening]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    lastTranscript,
    error,
  };
}
