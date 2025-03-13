import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const MainScreen = () => {
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCachedPlaces = async () => {
      try {
        const cachedData = await AsyncStorage.getItem("cachedPlaces");
        if (cachedData) {
          setPlaces(JSON.parse(cachedData));
        }
      } catch (error) {
        console.error("Error fetching cached places:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCachedPlaces();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.photos ? getPhotoUrl(item.photos[0].photo_reference) : "https://via.placeholder.com/150" }}
        style={styles.image}
      />
      <Text style={styles.title}>{item.name}</Text>
    </View>
  );

  const getPhotoUrl = (photoReference: string) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=AIzaSyCViC7K1PIRFtpGmF-QPE5MghNBN0LK9qg`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Places You May Interested</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#6200EE" />
      ) : places.length > 0 ? (
        <FlatList
          data={places}
          renderItem={renderItem}
          keyExtractor={(item) => item.place_id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.noDataText}>No attractions found.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingLeft: 20,
    backgroundColor: "#FFFF",
    alignItems: "flex-start",
  },
  header: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 10,
  },
  card: {
    width: width * 0.5,
    backgroundColor: "#fff",
    height:230,
    borderRadius: 10,
    marginHorizontal: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 8,
  },
  noDataText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 20,
  },
});

export default MainScreen;
