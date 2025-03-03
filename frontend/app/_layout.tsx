import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { useAuth } from "../hooks/userAuth";
import { useRouter } from "expo-router";
import "../global.css";

export default function RootLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user && !loading) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    // Stack is wrapped in a layout context
    <Stack>
      {user ? (
        <>
          <Stack.Screen name="index" options={{ headerTitle: "Home Page" }} />
          <Stack.Screen
            name="feedback"
            options={{ headerTitle: "Feedback Page" }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="login" options={{ headerTitle: "Login" }} />
          <Stack.Screen name="register" options={{ headerTitle: "Register" }} />
        </>
      )}
    </Stack>
  );
}
