import axios from "axios";
import RNFS from "react-native-fs";

const OPENAI_API_KEY = "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"; 
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

interface Location {
  latitude: number;
  longitude: number;
}

interface ApiResponse {
  title: string;
  content: string;
}
export const fetchLocationDetails = async (
  latitude: number,
  longitude: number,
  imagePath: string
): Promise<ApiResponse | null> => {
  try {
    if (!OPENAI_API_KEY) {
      console.error("❌ OpenAI API Key is missing!");
      return null;
    }

    console.log("🛠️ Fetching location details...");
    const imageBase64 = await RNFS.readFile(imagePath, "base64");

    const payload = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI that analyzes images and provides geographical insights."
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this image. Latitude: ${latitude}, Longitude: ${longitude}. Return a JSON response with "title" (location name) and "content" (description).` },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ],
      max_tokens: 500
    };

    console.log("📡 Sending request to OpenAI...");
    const response = await axios.post(OPENAI_ENDPOINT, payload, {
      headers: {
        Authorization: `Bearer ${String(OPENAI_API_KEY)}`,
        "Content-Type": "application/json",
      },
    });

    console.log("🌍 OpenAI Response:", JSON.stringify(response.data, null, 2));

    let messageContent = response.data.choices[0]?.message?.content?.trim() || "";

    if (messageContent.startsWith("```json")) {
      messageContent = messageContent.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    let parsedData: ApiResponse = { title: "Unknown Location", content: "Could not determine location details." };
    try {
      parsedData = JSON.parse(messageContent);
    } catch (e) {
      console.warn("⚠️ OpenAI returned non-JSON response. Using default values.");
    }

    console.log("✅ Location Data Parsed:", parsedData);
    return parsedData;
  } catch (error: any) {
    console.error("❌ OpenAI API Error:", error?.response?.data || error.message);
    return null;
  }
};

