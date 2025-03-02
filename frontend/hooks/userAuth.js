import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";

const BASE_URL = "http://172.28.11.162:3005";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    const token = await SecureStore.getItemAsync("userToken");
    if (token) {
      setUser({ token });
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        await SecureStore.setItemAsync("userToken", data.token);
        alert("Registration successful! Please login.");
        setUser(data.user);
        router.replace("/");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (error) {
      alert("Something went wrong");
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      console.log("Response Status:", response.status);

      const data = await response.json();
      if (response.ok) {
        alert("Registration successful! Please login.");
        router.replace("/login");
      } else {
        alert(data.message || "Registration failed");
        alert("error", data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error registering:", error);
      alert("Something went wrong");
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("userToken");
    setUser(null);
    router.replace("/login"); // Redirect to login page
  };

  return { user, loading, login, register, logout };
};
