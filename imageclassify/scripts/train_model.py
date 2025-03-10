import os
import torch
import clip
from torchvision import datasets, transforms
from sklearn.metrics import accuracy_score, classification_report
from tqdm import tqdm
import pickle
import datetime
import torch.nn as nn

# Define custom categories
CATEGORIES = ['nature', 'history', 'adventure', 'urban', 'spiritual']

# Load CLIP Model
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# Data transformations for training with augmentation
transform_train = transforms.Compose([
    transforms.Resize((224, 224)),  # Ensure consistency in image size
    transforms.RandomHorizontalFlip(),  # Augmentation: Random horizontal flip
    transforms.RandomRotation(15),  # Augmentation: Random rotation
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),  # Augmentation: Color jitter
    transforms.ToTensor(),  # Convert PIL image to tensor
    transforms.Normalize((0.481, 0.457, 0.408), (0.268, 0.261, 0.275))  # Normalize to match CLIP expectations
])

# Validation and test transformations (no augmentation)
transform_val = transforms.Compose([
    transforms.Resize((224, 224)),  # Ensure consistency in image size
    transforms.ToTensor(),  # Convert PIL image to tensor
    transforms.Normalize((0.481, 0.457, 0.408), (0.268, 0.261, 0.275))  # Normalize to match CLIP expectations
])

# Load datasets
train_dataset = datasets.ImageFolder(root='C:/dev/imageclassify/dataset/train', transform=transform_train)
val_dataset = datasets.ImageFolder(root='C:/dev/imageclassify/dataset/val', transform=transform_val)
test_dataset = datasets.ImageFolder(root='C:/dev/imageclassify/dataset/test', transform=transform_val)

train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = torch.utils.data.DataLoader(val_dataset, batch_size=32, shuffle=False)
test_loader = torch.utils.data.DataLoader(test_dataset, batch_size=32, shuffle=False)

# Encode categories into text embeddings
category_prompts = [f"A photo of {category}" for category in CATEGORIES]
text_inputs = clip.tokenize(category_prompts).to(device)
with torch.no_grad():
    text_features = model.encode_text(text_inputs)
    text_features /= text_features.norm(dim=-1, keepdim=True)

# Fine-tunable CLIP model with a classification head
class CLIPClassifier(nn.Module):
    def __init__(self, clip_model, num_classes):
        super(CLIPClassifier, self).__init__()
        self.clip_model = clip_model
        self.fc = nn.Linear(clip_model.visual.output_dim, num_classes)

    def forward(self, x):
        image_features = self.clip_model.encode_image(x)
        return self.fc(image_features)

# Initialize model
num_classes = len(CATEGORIES)
clip_classifier = CLIPClassifier(model, num_classes).to(device)

# Define loss and optimizer
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(clip_classifier.parameters(), lr=1e-4)

# Function to train the model
def train_model(model, train_loader, val_loader, optimizer, criterion, num_epochs=20, log_file=None):
    best_val_acc = 0.0
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        for inputs, labels in tqdm(train_loader, desc=f"Epoch {epoch+1}/{num_epochs}"):
            inputs, labels = inputs.to(device), labels.to(device)

            # Zero the gradients
            optimizer.zero_grad()

            # Forward pass
            outputs = model(inputs)
            loss = criterion(outputs, labels)

            # Backward pass and optimization
            loss.backward()
            optimizer.step()

            running_loss += loss.item()

        avg_loss = running_loss / len(train_loader)
        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {avg_loss:.4f}")

        # Evaluate on validation set
        val_acc = evaluate(model, val_loader, split="Validation", log_file=log_file)
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            save_model_and_embeddings(model, text_features, category_prompts, path="clip_model_best")
            print(f"New Best Validation Accuracy: {best_val_acc:.4f}")

# Function to classify images
def classify_images(model, data_loader):
    all_preds = []
    all_targets = []

    model.eval()
    with torch.no_grad():
        for inputs, labels in tqdm(data_loader):
            inputs, labels = inputs.to(device), labels.to(device)

            outputs = model(inputs)
            preds = outputs.argmax(dim=1)

            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(labels.cpu().numpy())

    return all_preds, all_targets

# Evaluate model with logging
def evaluate(model, data_loader, split="Validation", log_file=None):
    preds, targets = classify_images(model, data_loader)
    accuracy = accuracy_score(targets, preds)
    class_report = classification_report(targets, preds, target_names=CATEGORIES, zero_division=0)
    log_message = f"\n=== {split} Results ===\nAccuracy: {accuracy:.4f}\nClassification Report:\n{class_report}\n"
    print(log_message)

    if log_file:
        with open(log_file, "a") as f:
            f.write(log_message)

    return accuracy

# Save model and embeddings
def save_model_and_embeddings(model, text_features, category_prompts, path="clip_model"):
    os.makedirs(path, exist_ok=True)
    torch.save(model.state_dict(), os.path.join(path, "clip_model.pth"))
    with open(os.path.join(path, "text_features.pkl"), "wb") as f:
        pickle.dump({"text_features": text_features.cpu(), "category_prompts": category_prompts}, f)
    print(f"Model and embeddings saved to '{path}'")

# Main Execution
log_file = os.path.join("C:/dev/imageclassify/logs", f"training_log_{datetime.datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.txt")
os.makedirs(os.path.dirname(log_file), exist_ok=True)

# Train the model
print("Training the model...")
train_model(clip_classifier, train_loader, val_loader, optimizer, criterion, num_epochs=20, log_file=log_file)

# Test the model
print("Testing the model...")
evaluate(clip_classifier, test_loader, split="Test", log_file=log_file)

print(f"Training log saved to: {log_file}")
