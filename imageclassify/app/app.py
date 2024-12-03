from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torchvision.transforms as transforms
from PIL import Image

app = Flask(__name__)
CORS(app)

# Load the trained model
CATEGORIES = ['nature', 'history', 'adventure', 'urban', 'spiritual']
model = torch.load('../model/category_model.pth')
model.eval()

# Define image transformations
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
])

# Route for classification
@app.route('/classify', methods=['POST'])
def classify_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    image = Image.open(file)
    image = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(image)
        _, predicted = outputs.max(1)
        category = CATEGORIES[predicted.item()]

    return jsonify({'category': category})

if __name__ == '__main__':
    app.run(debug=True)
