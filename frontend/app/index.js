import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../hooks/userAuth";

const Home = ({ navigation }) => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user && navigation) {
      navigation.navigate("Login");
    }
  }, [user, navigation]);

  return (
    <View className="border" style={styles.container}>
      <Text style={styles.title}>Welcome to the Home Page</Text>

      {/* Navigate using Expo Router */}
      <Link href="/feedback" style={styles.linkButton}>
        Go to Feedback Page
      </Link>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
  linkButton: {
    fontSize: 18,
    color: "#ffffff",
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    textAlign: "center",
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 18,
    color: "#ffffff",
  },
});

export default Home;
