from transformers import T5Tokenizer, T5ForConditionalGeneration, Trainer, TrainingArguments
from datasets import Dataset
import evaluate
import numpy as np

# Load the processed dataset
dataset = Dataset.from_csv("./data/processed_dataset.csv")

# Split the dataset into training and evaluation
split_dataset = dataset.train_test_split(test_size=0.2)
train_dataset = split_dataset["train"]
eval_dataset = split_dataset["test"]

# Tokenizer and model initialization
model_name = "t5-small"
tokenizer = T5Tokenizer.from_pretrained(model_name)
model = T5ForConditionalGeneration.from_pretrained(model_name)

# Preprocess data for training
def preprocess_function(examples):
    inputs = tokenizer(examples["input"], max_length=512, truncation=True, padding="max_length")
    inputs["labels"] = tokenizer(examples["output"], max_length=512, truncation=True, padding="max_length").input_ids
    return inputs

tokenized_train_dataset = train_dataset.map(preprocess_function, batched=True)
tokenized_eval_dataset = eval_dataset.map(preprocess_function, batched=True)

# Define the metric
metric = evaluate.load("accuracy")

def compute_metrics(eval_pred):
    predictions, labels = eval_pred
    predictions = np.argmax(predictions, axis=2)  # Get the most likely token IDs
    decoded_preds = tokenizer.batch_decode(predictions, skip_special_tokens=True)
    decoded_labels = tokenizer.batch_decode(labels, skip_special_tokens=True)
    
    # Strip unnecessary whitespace and align
    decoded_preds = [pred.strip() for pred in decoded_preds]
    decoded_labels = [label.strip() for label in decoded_labels]

    # Calculate accuracy
    return {"accuracy": metric.compute(predictions=decoded_preds, references=decoded_labels)}

# Training arguments
training_args = TrainingArguments(
    output_dir="./models/fine_tuned_t5",
    evaluation_strategy="steps",
    learning_rate=5e-5,
    per_device_train_batch_size=4,
    num_train_epochs=3,
    weight_decay=0.01,
    logging_dir="./logs",
    save_total_limit=2,
    eval_steps=500,
    save_steps=500,
    logging_steps=100,
)

# Trainer setup
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_train_dataset,
    eval_dataset=tokenized_eval_dataset,
    tokenizer=tokenizer,
    compute_metrics=compute_metrics,
)

# Train the model
trainer.train()

# Save the fine-tuned model
model.save_pretrained("./models/fine_tuned_t5")
tokenizer.save_pretrained("./models/fine_tuned_t5")
print("Model fine-tuned and saved to './models/fine_tuned_t5'")
