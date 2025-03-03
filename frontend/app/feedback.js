import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Text,
  View,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { Audio, Video } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import { useAuth } from "@/hooks/userAuth";

export default function Feedback() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();

  const [isRecording, setIsRecording] = useState(false);
  const [facing, setFacing] = useState("back");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [audioUri, setAudioUri] = useState(null);
  const [recording, setRecording] = useState(null);

  const cameraRef = useRef(null);
  const videoRef = useRef(null);

  // useEffect(() => {
  //   axios.get("http://192.168.8.145:3005/feedback").then((res) => {
  //     console.log(res.data);
  //   });
  // }, []);

  useEffect(() => {
    if (videoUri && videoRef.current) {
      console.log("Forcing Video Reload:", videoUri);
      videoRef.current.loadAsync({ uri: videoUri }, {}, false);
    }
  }, [videoUri]);

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text>We need camera permission</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!mediaPermission?.granted) {
    return (
      <View style={styles.container}>
        <Text>We need media library permission</Text>
        <TouchableOpacity onPress={requestMediaPermission}>
          <Text>Grant Media Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!audioPermission?.granted) {
    return (
      <View style={styles.container}>
        <Text>We need microphone permission</Text>
        <TouchableOpacity onPress={requestAudioPermission}>
          <Text>Grant Audio Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const openCamera = () => {
    setIsCameraOpen(true);
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
  };

  const toggleCameraFacing = () => {
    setFacing((prevFacing) => (prevFacing === "back" ? "front" : "back"));
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    try {
      setIsRecording(true);
      console.log("Recording started...");

      const video = await cameraRef.current.recordAsync({
        maxDuration: 5, // Stop recording after 5 seconds
        quality: "720p",
        codec: "h264",
      });

      setVideoUri(video.uri);
      console.log("Video saved at:", video.uri);

      // Save video to media library
      const asset = await MediaLibrary.createAssetAsync(video.uri);
      console.log("Video saved to gallery:", asset.uri);

      Alert.alert("Recording complete!", `Video saved at ${asset.uri}`);
      closeCamera();
    } catch (error) {
      console.error("Recording error:", error);
      Alert.alert("Recording failed", error.message);
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
    }
    setIsRecording(false);
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    console.log("Video Loaded Successfully!");
  };

  const startAudioRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need microphone access to record audio."
        );
        return;
      }

      setIsAudioRecording(true);
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await newRecording.startAsync();

      setRecording(newRecording);
      console.log("Audio Recording Started...");
    } catch (err) {
      console.error("Audio Recording Error", err);
      Alert.alert("Error", "Failed to start audio recording.");
    }
  };

  const stopAudioRecording = async () => {
    if (!recording) return;

    try {
      setIsAudioRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      console.log("Audio saved at:", uri);

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      console.log("Audio saved to gallery:", asset.uri);
      Alert.alert("Audio Recording Complete!", `Audio saved at ${asset.uri}`);
    } catch (err) {
      console.error("Audio Stopping Error", err);
      Alert.alert("Error", "Failed to stop audio recording.");
    }
  };

  const handleRating = (index) => {
    setRating(index + 1);
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("rating", rating);
    formData.append("feedback", feedback);

    if (videoUri) {
      formData.append("video", {
        uri: videoUri,
        name: "feedback-video.mp4",
        type: "video/mp4",
      });
    }

    if (audioUri) {
      formData.append("audio", {
        uri: audioUri,
        name: "feedback-audio.mp3",
        type: "audio/mp3",
      });
    }

    try {
      const token = user?.token;

      if (!token) {
        alert("You are not authenticated.");
        return;
      }

      const response = await axios.post(
        "http://192.168.8.145:3005/feedback/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`, // Pass JWT token in Authorization header
          },
        }
      );

      console.log("Feedback submitted:", response.data);
      alert("Feedback submitted successfully!");
      setVideoUri(null);
      setAudioUri(null);
    } catch (error) {
      console.log("Error response:", error.response.data);
      console.error("Error submitting feedback:", error);
      alert("Error submitting feedback!");
    }
  };
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
    >
      <View
        className="flex justify-center items-center bg-purple-50"
        style={styles.container}
      >
        <View
          className="flex flex-col col-start-2 col-span-4 justify-center items-center"
          style={{ height: "100%" }}
        >
          <View
            className="flex flex-col justify-start items-center p-3"
            style={{ height: "100%" }}
          >
            <View className="w-80 h-96 flex flex-col items-center rounded gap-2">
              <Image
                source={require("@/assets/images/Header.webp")}
                className="rounded"
                style={styles.img}
              />
              <Text className="text-center text-xl font-semibold">
                Did You Enjoy the Journey?
              </Text>

              <View
                className="flex flex-row justify-center"
                style={styles.ratingContainer}
              >
                {Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <FontAwesome
                      key={index}
                      name={index < rating ? "star" : "star-o"}
                      size={30}
                      color="#D97706"
                      style={styles.starIcon}
                      onPress={() => handleRating(index)}
                    />
                  ))}
              </View>
            </View>
            <View className="mt-5">
              <TextInput
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Add a comment"
                multiline
                numberOfLines={4}
                className="w-80 h-24 p-2 bg-violet-50 "
                style={styles.textArea}
              />
            </View>
            <View className="w-96" style={styles.orDividerContainer}>
              <View className="bg-violet-300" style={styles.divider}></View>
              <Text style={styles.orText}>OR</Text>
              <View className="bg-violet-300" style={styles.divider}></View>
            </View>
            <View
              className="flex flex-row justify-around gap-2 items-center"
              style={styles.buttonContainer}
            >
              <View>
                <TouchableOpacity
                  className="border"
                  style={[
                    styles.button,
                    { backgroundColor: isAudioRecording ? "red" : "#6200ea" },
                  ]}
                  onPress={
                    isAudioRecording ? stopAudioRecording : startAudioRecording
                  }
                >
                  <Icon name="audiotrack" size={24} color="#fff" />
                  <Text style={styles.buttonText}>
                    {isAudioRecording ? "Stop Audio" : "Record Audio"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View>
                <TouchableOpacity style={styles.button} onPress={openCamera}>
                  <Icon name="videocam" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Video</Text>
                </TouchableOpacity>
              </View>
            </View>
            {audioUri && (
              <TouchableOpacity
                style={styles.playButton}
                onPress={async () => {
                  const { sound } = await Audio.Sound.createAsync({
                    uri: audioUri,
                  });
                  await sound.playAsync();
                }}
              >
                <Text style={styles.buttonText}>Play Recorded Audio</Text>
              </TouchableOpacity>
            )}

            {videoUri && (
              <View style={styles.videoContainer}>
                <Video
                  source={{ uri: videoUri }}
                  style={styles.video}
                  useNativeControls
                  resizeMode="cover"
                  onLoad={handleVideoLoad}
                />
              </View>
            )}

            <View className="mt-5">
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Modal visible={isCameraOpen} animationType="slide" transparent={false}>
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              mode="video"
            >
              <View style={styles.controls}>
                <View className="flex flex-row items-center">
                  <TouchableOpacity
                    onPress={isRecording ? stopRecording : startRecording}
                    style={[
                      styles.recordButton,
                      { backgroundColor: isRecording ? "red" : "white" },
                    ]}
                  />

                  <TouchableOpacity
                    style={styles.switchButton}
                    onPress={toggleCameraFacing}
                  >
                    <Icon name="flip-camera-ios" size={30} color="#fff" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeCamera}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflowY: "scroll",
  },
  img: {
    width: "100%",
    height: "80%",
  },
  ratingContainer: {
    marginTop: 10,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  textArea: {
    marginTop: 10,
    height: 100,
    borderRadius: 10,
    padding: 10,
    textAlignVertical: "top",
  },
  orDividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    marginHorizontal: 10,
  },
  orText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555", // Color for the OR text
  },
  buttonContainer: {
    backgroundColor: "#f5f5f5",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#6200ea",
    borderRadius: 8,
  },
  buttonText: {
    marginLeft: 8,
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#6200ea",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cameraContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  camera: { width: "100%", height: "100%" },
  controls: { position: "absolute", bottom: 50, alignSelf: "center" },
  recordButton: { width: 70, height: 70, borderRadius: 35 },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#6200ea",
    borderRadius: 8,
  },
  closeButtonText: { color: "#fff", fontSize: 16, textAlign: "center" },

  playButton: {
    backgroundColor: "#0a9396",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },

  videoContainer: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 50,
  },
  video: {
    width: 350,
    height: 275,
  },
  videoText: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
});
