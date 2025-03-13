import React from "react";
import { View, Text, Image, ActivityIndicator, StyleSheet } from "react-native";

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("../res/tourme_logo.png")} // Ensure the correct path
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#1447e6" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF", // White background
  },
  logo: {
    width: 128, // Equivalent to w-32 in Tailwind
    height: 128, // Equivalent to h-32
    marginBottom: 16, // Equivalent to mb-4
  }
});

export default LoadingScreen;
