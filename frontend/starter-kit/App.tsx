import React, { useEffect, useState } from "react";
import { View, StyleSheet, PermissionsAndroid, Platform } from "react-native";
import LoadingScreen from "./components/LoadingScreen";
import MainScreen from "./screens/MainScreen";
import LocationFetchManager from "./components/LocationFetchManager"; // Import Background Task

export default function App() {
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        let cameraGranted = false;
        let locationGranted = false;

        if (Platform.OS === "android") {
          cameraGranted =
            (await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.CAMERA
            )) === PermissionsAndroid.RESULTS.GRANTED;

          locationGranted =
            (await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            )) === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // iOS assumes permission is granted for now
          cameraGranted = true;
          locationGranted = true;
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

  return (
    <View style={styles.container}>
      {/* ✅ Background Fetch Component - Runs in Background */}
      {hasPermissions && <LocationFetchManager />}
      
      {/* ✅ Main App Screen */}
      {hasPermissions ? <MainScreen /> : <LoadingScreen />}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFF",
  },
});

