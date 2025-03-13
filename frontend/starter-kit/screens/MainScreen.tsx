import React from "react";
import { View, Text, StyleSheet } from "react-native";

const MainScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the Main Screen!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFF", 
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937", // Dark gray text
  },
});

export default MainScreen;
