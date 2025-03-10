import Geolocation from "react-native-geolocation-service";
import { PermissionsAndroid, Platform } from "react-native";

// ✅ Define Interface for Location Data
export interface LocationData {
  latitude: number;
  longitude: number;
}

// ✅ Request Location Permission (Android & iOS)
export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "Allow this app to access your location.",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error("❌ Error requesting location permission:", error);
      return false;
    }
  }
  return true; // Assume iOS permission is handled separately
};

// ✅ Get current location (Only if permission granted)
export const getCurrentLocation = async (): Promise<LocationData | null> => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    console.warn("❌ Location permission not granted");
    return null;
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        if (position?.coords?.latitude && position?.coords?.longitude) {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } else {
          reject(new Error("❌ Invalid location data received"));
        }
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};
