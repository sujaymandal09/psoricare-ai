import argparse
import os
import torch
from torch.utils.data import DataLoader
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np
from dataset import PsoriasisDataset, get_data_transforms
from model import PsoriasisClassifier

def evaluate_model(data_dir, model_path="best_psoriasis_model.pth", batch_size=16):
    """
    Load a trained model and generate detailed metrics (Precision, Recall, F1-Score, Confusion Matrix)
    on the test or validation set.
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Evaluating model on: {device}")
    
    # Transforms
    _, val_transform = get_data_transforms()
    
    test_dir = os.path.join(data_dir, "val") # Default to validation directory for evaluation
    if not os.path.exists(test_dir):
        print(f"Error: Evaluation directory '{test_dir}' not found.")
        return
        
    dataset = PsoriasisDataset(test_dir, transform=val_transform)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, num_workers=2)
    
    # Load Model
    model = PsoriasisClassifier(num_classes=len(dataset.classes), pretrained=False)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())
            
    # Calculate detailed metrics
    print("\n" + "="*50)
    print("           DETAILED EVALUATION REPORT           ")
    print("="*50)
    
    print("\nClassification Report:")
    print(classification_report(all_labels, all_preds, target_names=dataset.classes))
    
    print("\nConfusion Matrix:")
    cm = confusion_matrix(all_labels, all_preds)
    print(cm)
    print("="*50)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate the trained psoriasis model.")
    parser.add_argument("--data-dir", default=None, help="Path to the dataset directory containing train/val folders.")
    parser.add_argument("--model-path", default=None, help="Path to the trained model checkpoint file.")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size for evaluation data loading.")
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = args.data_dir or os.path.abspath(os.path.join(script_dir, "..", "dataset"))
    model_path = args.model_path or os.path.abspath(os.path.join(script_dir, "..", "best_psoriasis_model.pth"))

    print(f"Using dataset: {data_dir}")
    print(f"Using model: {model_path}")

    if not os.path.exists(model_path):
        print(f"Error: Model file '{model_path}' not found.")
    else:
        evaluate_model(data_dir=data_dir, model_path=model_path, batch_size=args.batch_size)
