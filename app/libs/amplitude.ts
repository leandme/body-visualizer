// lib/amplitude.ts
import * as amplitude from '@amplitude/analytics-browser';

// Get the Amplitude API key from environment variables
const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

if (!AMPLITUDE_API_KEY) {
  console.error('Missing Amplitude API Key');
}

// Initialize Amplitude (should be called once, typically in the app initialization)
export const initAmplitude = () => {
  if (AMPLITUDE_API_KEY) {
    amplitude.init(AMPLITUDE_API_KEY, {
      // Optional autocapture settings
      autocapture: {
        formInteractions: false,
        fileDownloads: false,
        elementInteractions: false,
      },
    });
  } else {
    console.error('Amplitude API Key is undefined');
  }
};

// Track custom events across your app
export const trackEvent = (eventName: string, properties: Record<string, any> = {}) => {
  if (!AMPLITUDE_API_KEY) return;

  try {
    amplitude.track(eventName, properties);
  } catch (error) {
    console.warn("Amplitude track failed:", error);
  }
};

// Function to identify the user in Amplitude and set properties
export const identifyUser = (user_id: string, properties: Record<string, any>) => {
  const identify = new amplitude.Identify();

  // Set user properties like email, name, etc.
  Object.keys(properties).forEach((key) => {
    identify.set(key, properties[key]);
  });

  // Set the user ID and identify the user
  amplitude.setUserId(user_id);
  amplitude.identify(identify);
};
