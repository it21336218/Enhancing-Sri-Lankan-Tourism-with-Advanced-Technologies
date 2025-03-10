import React, { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, Image, StyleSheet } from "react-native";
import { ViroARSceneNavigator } from "@reactvision/react-viro";
import { requestLocationPermission } from "./components/Geolocation";
import { requestCameraPermission, takePhoto } from "./components/CameraHandler";
import ARScene from "./components/ARScene";
import { Camera, useCameraDevices } from "react-native-vision-camera";

// ✅ Adjust the path to your icon
const bookIcon = require("./res/images/book_icon.png");

const App = () => {
  const [hasPermissions, setHasPermissions] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [arVisible, setArVisible] = useState(false);  // ✅ Control visibility of ARScene
  const [locationDataReady, setLocationDataReady] = useState(false); // ✅ Track location data readiness

  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.back;

  useEffect(() => {
    const checkPermissions = async () => {
      const locationGranted = await requestLocationPermission();
      const cameraGranted = await requestCameraPermission();

      setHasPermissions(locationGranted && cameraGranted);
      setLoading(false);

      // Simulate fetching location data here (you can replace this with actual location fetch)
      setTimeout(() => {
        setLocationDataReady(true);  // ✅ Mock location ready (replace with real fetch logic)
      }, 2000);
    };

    checkPermissions();
  }, []);

  const handleCapture = async () => {
    if (!cameraReady || photoCaptured) {
      console.warn(`⏳ Camera is not ready yet OR photo already captured.`);
      return;
    }

    if (cameraRef.current) {
      console.log("📸 Attempting to capture photo...");
      const photoPath = await takePhoto(cameraRef);
      if (photoPath) {
        setImagePath(photoPath);
        setPhotoCaptured(true);
      }
    }
  };

  if (loading || !device) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>{loading ? "Checking permissions..." : "Loading camera..."}</Text>
      </View>
    );
  }

  if (!hasPermissions) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={{ fontSize: 18, color: "red" }}>
          Please grant Camera & Location permissions to use AR
        </Text>
      </View>
    );
  }

  // ✅ Render Camera (before AR starts) and take the initial photo
  if (!imagePath) {
    return (
      <View style={{ flex: 1 }}>
        <Camera
          ref={cameraRef}
          style={{ flex: 1 }}
          device={device}
          isActive={true}
          photo={true}
          onInitialized={() => {
            console.log("✅ Camera initialized");
            setCameraReady(true);
            handleCapture();  // ✅ Capture once
          }}
        />
        <Text style={styles.overlayText}>
          Initializing camera and capturing photo...
        </Text>
      </View>
    );
  }

  // ✅ After capturing photo, load AR scene with optional icon overlay
  return (
    <View style={{ flex: 1 }}>
      <ViroARSceneNavigator
        autofocus
        initialScene={{ scene: () => <ARScene imagePath={imagePath} /> }}
        style={{ flex: 1 }}
      />

      {/* ✅ Show book icon button after location and image are ready */}
      {locationDataReady && (
        <TouchableOpacity
          style={styles.bookIconContainer}
          onPress={() => setArVisible(true)} // Show AR banner when tapped
        >
          <Image source={bookIcon} style={styles.bookIcon} />
        </TouchableOpacity>
      )}

      {/* ✅ Optional text overlay for debugging */}
      {arVisible && (
        <View style={styles.overlayContainer}>
          <Text style={styles.overlayText}>AR Content Visible - Press Book Icon to Hide</Text>
        </View>
      )}

      {/* ✅ AR Content controlled by book icon press */}
      {arVisible && (
        <View style={styles.absoluteArContainer}>
          <ViroARSceneNavigator
            autofocus
            initialScene={{ scene: () => <ARScene imagePath={imagePath} /> }}
            style={{ flex: 1 }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bookIconContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,  // Ensure it's on top of AR view
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 30,
    padding: 5,
  },
  bookIcon: {
    width: 50,
    height: 50,
    tintColor: "#6200EE",  // Optional color adjustment
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
  },
  overlayText: {
    color: "white",
    textAlign: "center",
  },
  absoluteArContainer: {
    ...StyleSheet.absoluteFillObject,  // Full screen AR overlay when icon is pressed
    zIndex: 20,
  },
});

export default App;
