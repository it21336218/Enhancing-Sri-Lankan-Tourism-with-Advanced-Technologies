import { Camera } from "react-native-vision-camera";
import { PermissionsAndroid, Platform } from "react-native";

// ✅ Request Camera Permission
export const requestCameraPermission = async () => {
  try {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );

      console.log("Android Camera Permission Result:", granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    // ✅ iOS handling (Fixes type issue)
    const permission = await Camera.requestCameraPermission();
    console.log("iOS Camera Permission Result:", permission);
    return permission === "authorized"; // ✅ Corrected from "granted"
  } catch (error) {
    console.error("Camera Permission Request Failed:", error);
    return false;
  }
};

export const takePhoto = async (cameraRef: any) => {
  try {
    if (!cameraRef || !cameraRef.current) { 
      console.warn("❌ Camera reference is null or undefined. Cannot capture photo.");
      return null;
    }

    const photo = await cameraRef.current.takePhoto();
    console.log("📸 Photo captured successfully:", photo.path);
    return `file://${photo.path}`;
  } catch (error) {
    console.error("❌ Error capturing photo:", error);
    return null;
  }
};

