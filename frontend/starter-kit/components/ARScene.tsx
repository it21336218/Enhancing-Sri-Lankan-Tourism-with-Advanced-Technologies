import React, { useEffect, useState, useRef, useMemo } from "react";
import { 
  ViroARScene, 
  Viro3DObject, 
  ViroAmbientLight, 
  ViroText, 
  ViroNode, 
  ViroARPlaneSelector 
} from "@reactvision/react-viro";
import { getCurrentLocation } from "../components/Geolocation";
import { fetchLocationDetails } from "../components/OpenAIService";

interface ApiResponse {
  title: string;
  content: string;
}

const ARScene = ({ imagePath }: { imagePath: string }) => {
  const [info, setInfo] = useState<ApiResponse>({
    title: "Loading...",
    content: "Fetching data...",
  });

  const [isPlaced, setIsPlaced] = useState(false); // Lock placement once found
  const arNodeRef = useRef(null);

  // Lazy-load and memoize the heavy asset files
  const modelSource = useMemo(
    () =>
      require("../res/A_clean_3D_banner_wit_1203163049_texture_obj/A_clean_3D_banner_wit_1203163049_texture.obj"),
    []
  );
  const modelResources = useMemo(
    () => [
      require("../res/A_clean_3D_banner_wit_1203163049_texture_obj/A_clean_3D_banner_wit_1203163049_texture.mtl"),
      require("../res/A_clean_3D_banner_wit_1203163049_texture_obj/A_clean_3D_banner_wit_1203163049_texture.png"),
    ],
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      const location = await getCurrentLocation();
      if (!location) {
        console.warn("❌ Invalid location data received");
        return;
      }

      console.log("📍 Location Data:", location);

      const data: ApiResponse | null = await fetchLocationDetails(
        location.latitude,
        location.longitude,
        imagePath
      );

      if (data) {
        console.log("✅ Location Fetched:", data);
        setInfo(data);
      } else {
        console.warn("⚠️ No location data received");
      }
    };

    fetchData();
  }, [imagePath]);

  return (
    <ViroARScene>
      {/* Ambient lighting for better visibility */}
      <ViroAmbientLight color="#FFFFFF" intensity={300} />

      {/* Detect and place banner only once to prevent lag */}
      {!isPlaced ? (
        <ViroARPlaneSelector
          onPlaneSelected={() => setIsPlaced(true)} // Lock placement
          maxPlanes={1} // Prevent multiple detections
          minHeight={0.2}
          minWidth={0.2}
        >
          <ViroNode ref={arNodeRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
            {/* 3D Banner Object */}
            <Viro3DObject
              source={modelSource}
              resources={modelResources}
              position={[0, 0, 0]}
              scale={[0.6, 0.6, 0.6]}
              type="OBJ"
            />

            {/* Title inside the banner */}
            <ViroText
              text={info.title}
              position={[0, 0.15, 0.05]} // Slightly above the content
              width={1}
              height={0.1}
              scale={[0.2, 0.2, 0.2]}
              style={{
                fontSize: 28,
                color: "#FFD700",
                textAlign: "center",
                fontWeight: "bold",
              }}
            />

            {/* Description inside the banner */}
            <ViroText
              text={info.content}
              position={[0, 0, 0.05]} // Centered in the banner
              width={1.2}
              height={0.5}
              scale={[0.2, 0.2, 0.2]}
              style={{
                fontSize: 18,
                color: "black",
                textAlign: "center",
              }}
            />
          </ViroNode>
        </ViroARPlaneSelector>
      ) : (
        <ViroNode ref={arNodeRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
          {/* Banner stays locked after placement */}
          <Viro3DObject
            source={modelSource}
            resources={modelResources}
            position={[0, 0, 0]}
            scale={[0.6, 0.6, 0.6]}
            type="OBJ"
          />

          {/* Title inside the banner */}
          <ViroText
            text={info.title}
            position={[0, 0.15, 0.05]}
            width={1}
            height={0.1}
            scale={[0.2, 0.2, 0.2]}
            style={{
              fontSize: 28,
              color: "#FFD700",
              textAlign: "center",
              fontWeight: "bold",
            }}
          />

          {/* Description inside the banner */}
          <ViroText
            text={info.content}
            position={[0, 0, 0.05]}
            width={1.2}
            height={0.5}
            scale={[0.2, 0.2, 0.2]}
            style={{
              fontSize: 18,
              color: "black",
              textAlign: "center",
            }}
          />
        </ViroNode>
      )}
    </ViroARScene>
  );
};

export default ARScene;
