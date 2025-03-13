import React, { useEffect, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import Geolocation from "react-native-geolocation-service";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Constants
const INITIAL_RADIUS = 2000;
const MAX_RADIUS = 40000; 
const RADIUS_STEP = 2000; 
const CACHE_LIMIT = 40000;
const API_KEY = "AIzaSyCPuk0ekiyNgMdBRIVeSTKTrdGw_D_NKWM";

const LocationFetchManager = () => {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    long: number;
  } | null>(null);
  const [radius, setRadius] = useState(INITIAL_RADIUS);
  const [networkStrength, setNetworkStrength] = useState("good");

  useEffect(() => {
    requestPermissions();
    trackNetworkStatus();
    startLocationTracking();
  }, []);

  // ✅ 1️⃣ Request Permissions (Location)
  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
    }
  };

  // ✅ 2️⃣ Track Network Status
  const trackNetworkStatus = () => {
    NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        let networkQuality = "good"; // Default

        if (state.type === "cellular" && state.details?.cellularGeneration) {
          const gen = state.details.cellularGeneration;
          if (gen === "2g") networkQuality = "poor";
          else if (gen === "3g") networkQuality = "average";
          else if (gen === "4g" || gen === "5g") networkQuality = "good";
        }

        setNetworkStrength(networkQuality);
      } else {
        setNetworkStrength("poor"); // No internet
      }
    });
  };

  // ✅ 3️⃣ Track User Location in Background
  const startLocationTracking = () => {
    Geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        handleLocationUpdate(latitude, longitude);
      },
      (error) => console.error("Location Error:", error),
      { enableHighAccuracy: true, distanceFilter: 2000 } // Update every 2km
    );
  };

  // ✅ 4️⃣ Handle Location Updates
  const handleLocationUpdate = async (lat: number, long: number) => {
    setUserLocation({ lat, long });

    // Fetch the last known location
    const lastFetchedLocation = await AsyncStorage.getItem("lastLocation");
    const lastFetchTime = await AsyncStorage.getItem("lastFetchTime");

    if (
      !lastFetchedLocation ||
      isSignificantMove(lastFetchedLocation, lat, long)
    ) {
      console.log("📍 Fetching new places...");
      await fetchNearbyPlaces(lat, long, radius);
      await AsyncStorage.setItem("lastLocation", JSON.stringify({ lat, long }));
      await AsyncStorage.setItem("lastFetchTime", String(Date.now()));
    } else if (isStationary(lastFetchTime)) {
      console.log("📍 User is stationary, expanding radius...");
      expandSearchRadius();
    }
  };

  // ✅ 5️⃣ Check if User Moved More than 2km
  const isSignificantMove = (
    lastLocation: string,
    lat: number,
    long: number
  ) => {
    const prevLocation = JSON.parse(lastLocation);
    const distance = getDistance(
      prevLocation.lat,
      prevLocation.long,
      lat,
      long
    );
    return distance >= 2000; // Returns true if user moved 2km+
  };

  // ✅ 6️⃣ Expand Search Radius if User is Stationary
  const isStationary = (lastFetchTime: string | null) => {
    if (!lastFetchTime) return false;
    const elapsedTime = Date.now() - parseInt(lastFetchTime);
    return elapsedTime >= 5 * 60 * 1000; // Expand radius if stationary for 5 mins
  };

  // ✅ 7️⃣ Fetch Nearby Places from Google Places API
  const fetchNearbyPlaces = async (
    lat: number,
    long: number,
    radius: number
  ) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${long}&radius=${radius}&type=tourist_attraction&key=${API_KEY}`
      );

      const places = response.data.results;
      console.log("📍 Places Fetched:", places.length);

      // Cache places
      await cachePlaces(places, lat, long);
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  // ✅ 8️⃣ Cache Places Efficiently
  const cachePlaces = async (places: any[], lat: number, long: number) => {
    let cachedData = await AsyncStorage.getItem("cachedPlaces");
    let cachedPlaces = cachedData ? JSON.parse(cachedData) : [];

    // Add new places
    cachedPlaces = [...cachedPlaces, ...places];

    // Remove places beyond 40km
    cachedPlaces = cachedPlaces.filter(
      (place: any) =>
        getDistance(
          place.geometry.location.lat,
          place.geometry.location.lng,
          lat,
          long
        ) <= CACHE_LIMIT
    );

    await AsyncStorage.setItem("cachedPlaces", JSON.stringify(cachedPlaces));
    console.log("✅ Cached Places:", cachedPlaces.length);
  };

  // ✅ 9️⃣ Expand Search Radius Dynamically
  const expandSearchRadius = () => {
    if (radius < MAX_RADIUS) {
      const newRadius = radius + RADIUS_STEP;
      console.log("📡 Expanding search radius to:", newRadius / 1000, "km");
      setRadius(newRadius);
    }
  };

  // ✅ 🔟 Get Distance Between Two Coordinates (Haversine Formula)
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const EARTH_RADIUS = 6371000; // Earth's radius in meters

    // Convert degrees to radians
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const deltaLatRad = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLonRad = ((lon2 - lon1) * Math.PI) / 180;

    // Haversine formula
    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLonRad / 2) *
        Math.sin(deltaLonRad / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS * c; // Returns distance in meters
  };

  return null; // No UI, only logic
};

export default LocationFetchManager;
