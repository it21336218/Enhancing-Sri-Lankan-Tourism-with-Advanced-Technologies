from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from PIL import Image
import clip
import pickle
import requests  # For making API calls (if needed for location details)
import google.generativeai as genai
from PIL import Image
import base64
import io
import json
import csv
from math import radians, sin, cos, sqrt, atan2

app = Flask(__name__)
CORS(app)

genai.configure(api_key="AIzaSyBqdDmivCCRnOXeylAX43U-C6Lay6sD70w")

# Define categories
CATEGORIES = ['nature', 'history', 'adventure', 'urban', 'spiritual']

# Set device for PyTorch
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load the CLIP model and the fine-tuned classifier
class CLIPClassifier(torch.nn.Module):
    def __init__(self, clip_model, num_classes):
        super(CLIPClassifier, self).__init__()
        self.clip_model = clip_model
        self.fc = torch.nn.Linear(clip_model.visual.output_dim, num_classes)

    def forward(self, x):
        image_features = self.clip_model.encode_image(x)
        return self.fc(image_features)

# Load the CLIP model and preprocess
clip_model, preprocess = clip.load("ViT-B/32", device=device)

# Instantiate the classifier
num_classes = len(CATEGORIES)
clip_classifier = CLIPClassifier(clip_model, num_classes).to(device)

# Load model weights
model_weights_path = 'clip_model_best/clip_model.pth'
if not torch.cuda.is_available():
    model_weights = torch.load(model_weights_path, map_location=device)
else:
    model_weights = torch.load(model_weights_path)
clip_classifier.load_state_dict(model_weights, strict=False)
clip_classifier.eval()

# Load text embeddings and prompts
text_features_path = 'clip_model_best/text_features.pkl'
with open(text_features_path, 'rb') as f:
    data = pickle.load(f)
    text_features = data['text_features'].to(device)
    category_prompts = data['category_prompts']

# Helper function to classify an image
def classify_image(image: Image.Image):
    image_tensor = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        # Compute image features
        image_features = clip_classifier.clip_model.encode_image(image_tensor)
        image_features /= image_features.norm(dim=-1, keepdim=True)

        # Compute similarity with text embeddings
        similarity = image_features @ text_features.T
        best_match_idx = similarity.argmax(dim=1).item()
        category = CATEGORIES[best_match_idx]

    return category

def encode_image_to_base64(image):
    """
    Encodes an image to Base64 format for sending to the Gemini API.

    Args:
        image (Image): Image object to be encoded.

    Returns:
        str: Base64-encoded string of the image.
    """
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG")  # Convert the image to JPEG format
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points on the Earth's surface.

    Args:
        lat1, lon1: Latitude and Longitude of point 1 (in decimal degrees)
        lat2, lon2: Latitude and Longitude of point 2 (in decimal degrees)

    Returns:
        float: Distance in kilometers
    """
    R = 6371.0  # Radius of the Earth in kilometers

    # Convert latitude and longitude from degrees to radians
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    # Distance in kilometers
    return R * c

def get_cached_location(latitude, longitude, threshold=1.0):
    """
    Check if a description for the given geolocation exists in the cache (CSV file).
    If found, increment the access count.

    Args:
        latitude (float): Latitude of the location.
        longitude (float): Longitude of the location.
        threshold (float): The maximum distance (in kilometers) to consider a location as "nearby".

    Returns:
        dict: Cached description if found, otherwise None.
    """
    cache_file = "location_cache.csv"
    rows = []
    found_location = None

    try:
        with open(cache_file, mode="r") as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Check for proximity using the Haversine formula
                distance = haversine(
                    float(row["latitude"]), float(row["longitude"]), latitude, longitude
                )
                if distance <= threshold:
                    # Increment count for the accessed location
                    row["count"] = int(row["count"]) + 1
                    found_location = {"description": row["description"]}
                rows.append(row)
    except FileNotFoundError:
        # If the cache file doesn't exist, return None
        return None

    # Rewrite the cache with updated counts
    with open(cache_file, mode="w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["latitude", "longitude", "description", "count"])
        writer.writeheader()
        writer.writerows(rows)

    return found_location

def save_location_to_cache(latitude, longitude, description):
    """
    Save or update the description and access count for a location in the cache (CSV file).

    Args:
        latitude (float): Latitude of the location.
        longitude (float): Longitude of the location.
        description (str): Description of the location.
    """
    cache_file = "location_cache.csv"
    updated = False
    rows = []

    # Read existing cache if it exists
    try:
        with open(cache_file, mode="r") as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Check if the location matches
                if (
                    float(row["latitude"]) == latitude
                    and float(row["longitude"]) == longitude
                ):
                    # Update count and description
                    row["count"] = int(row["count"]) + 1
                    row["description"] = description
                    updated = True
                rows.append(row)
    except FileNotFoundError:
        pass

    # If the location was not found, add a new entry
    if not updated:
        rows.append(
            {
                "latitude": latitude,
                "longitude": longitude,
                "description": description,
                "count": 1,  # Initial count
            }
        )

    # Write back the updated rows to the cache
    with open(cache_file, mode="w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["latitude", "longitude", "description", "count"])
        writer.writeheader()
        writer.writerows(rows)


def get_location_details(latitude, longitude, image):
    """
    Retrieves location details based on geolocation and an image.

    Args:
        latitude (float): Latitude coordinate.
        longitude (float): Longitude coordinate.
        image (Image): Image object containing the image data.

    Returns:
        dict: Dictionary containing a single description field.
    """
    print(f"Fetching location details for Latitude: {latitude}, Longitude: {longitude}")

    # Check cache first
    cached_location = get_cached_location(latitude, longitude)
    if cached_location:
        print(f"Location details found in cache for Latitude: {latitude}, Longitude: {longitude}")
        return cached_location

    # Save the image to a temporary file for uploading
    temp_image_path = "temp_image.jpg"
    image.save(temp_image_path, format="JPEG")
    print(f"Image saved for upload: {temp_image_path}")

    try:
        # Upload the image to Gemini
        myfile = genai.upload_file(temp_image_path)
        print(f"Image uploaded successfully: {myfile}")

        # Define the refined prompt for the Gemini API
        prompt = (
            f"Provide a detailed and structured description of the location shown in this image, considering its historical, geographical, "
            f"and cultural significance.Make sure that to not mention what are the inputs and give as a description of the image .Describe the location as this is to display for tourists. Include these details in a concise and descriptive format suitable for a single paragraph:\n\n"
            f"1. Historical Context: Describe the historical importance and events associated with the location.\n"
            f"2. Geographical Features: Highlight the physical and environmental characteristics of the area.\n"
            f"3. Cultural Relevance: Explain the cultural and societal significance of this place.\n\n"
            f"Additionally, use the following geolocation for context:\n"
            f"Latitude: {latitude}\n"
            f"Longitude: {longitude}\n\n"
            f"Do not format the response as a discussion or list. Combine all the information into a single descriptive paragraph."
        )

        # Use the Gemini API to generate content with the image
        model = genai.GenerativeModel("gemini-1.5-flash")
        result = model.generate_content([myfile, "\n\n", prompt])

        print("Gemini API response received.")

        # Extract the response text
        description = result.text.strip()

        # Save to cache
        save_location_to_cache(latitude, longitude, description)

        return {"description": description}

    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return {"error": "Failed to fetch location details from Gemini API."}


# Route for getting details
@app.route('/get-details', methods=['POST'])
def get_details():
    print("Request received for /get-details")
    
    if 'file' not in request.files:
        print("No image file found in the request.")
        return jsonify({'error': 'No image file uploaded'}), 400
    
    # Extract file
    file = request.files['file']

    # Extract geo_location from form data
    geo_location = request.form.get('geo_location')
    if not geo_location:
        print("Geolocation data missing in the request.")
        return jsonify({'error': 'Geolocation data missing'}), 400

    # Parse geo_location string into JSON
    try:
        geo_location = json.loads(geo_location)
        latitude = geo_location.get('latitude')
        longitude = geo_location.get('longitude')
    except Exception as e:
        print(f"Error parsing geolocation data: {e}")
        return jsonify({'error': 'Invalid geolocation data format'}), 400

    print(f"Parsed Latitude: {latitude}, Longitude: {longitude}")

    if latitude is None or longitude is None:
        print("Invalid geolocation data provided.")
        return jsonify({'error': 'Invalid geolocation data'}), 400

    # Process image
    try:
        image = Image.open(file).convert("RGB")  # Ensure RGB format
    except Exception as e:
        print(f"Error processing the image: {e}")
        return jsonify({'error': 'Invalid image file'}), 400

    # Pass the image itself to the location details function
    details = get_location_details(latitude, longitude, image)

    return jsonify({
        'location_details': details
    })

# Route for classification
@app.route('/classify', methods=['POST'])
def classify():
    try:
        # Parse the image from the request
        data = request.json
        image_base64 = data.get("image")
        if not image_base64:
            return jsonify({"error": "No image provided"}), 400

        # Decode the base64 image
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")

        # Classify the image
        category = classify_image(image)

        return jsonify({"category": category})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
