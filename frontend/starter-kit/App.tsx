import React, { useEffect, useState } from "react";
import { View, StyleSheet, PermissionsAndroid, Platform } from "react-native";
import LoadingScreen from "./components/LoadingScreen";
import MainScreen from "./screens/MainScreen"; // Ensure this exists in 'screens' folder

export default function App() {
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        let cameraGranted = false;
        let locationGranted = false;

        if (Platform.OS === "android") {
          cameraGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA
          ) === PermissionsAndroid.RESULTS.GRANTED;

          locationGranted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          ) === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // iOS uses React Native's permission library or handles it differently
          cameraGranted = true; // Assume granted for now
          locationGranted = true; // Assume granted for now
        }

        setHasPermissions(cameraGranted && locationGranted);
      } catch (error) {
        console.error("Error requesting permissions:", error);
        setHasPermissions(false);
      }
    };

    requestPermissions();
  }, []);

  if (hasPermissions === null) {
    return <LoadingScreen />; // Show loading screen while checking permissions
  }

  return hasPermissions ? <MainScreen /> : <LoadingScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFF",
  },
});
