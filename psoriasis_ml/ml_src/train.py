import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from dataset import PsoriasisDataset, get_data_transforms
from model import PsoriasisClassifier

def train_model(data_dir, num_epochs=15, batch_size=16, lr=0.001, output_path="../best_psoriasis_model.pth"):
    """
    Main training and validation loop.
    Saves the trained model state to 'best_psoriasis_model.pth'.
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")
    
    # Paths
    train_dir = os.path.join(data_dir, "train")
    val_dir = os.path.join(data_dir, "val")
    
    # Transforms & Datasets
    train_transform, val_transform = get_data_transforms()
    
    if not os.path.exists(train_dir):
        print(f"Error: Training directory '{train_dir}' not found. Please prepare your dataset structure.")
        return
        
    train_dataset = PsoriasisDataset(train_dir, transform=train_transform)
    val_dataset = PsoriasisDataset(val_dir, transform=val_transform) if os.path.exists(val_dir) else None
    
    # DataLoaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2) if val_dataset else None
    
    num_classes = len(train_dataset.classes)
    print(f"Detected Classes ({num_classes}): {train_dataset.classes}")
    
    # Initialize Model, Loss, Optimizer
    model = PsoriasisClassifier(num_classes=num_classes, pretrained=True).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    
    best_acc = 0.0
    
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        corrects = 0
        total = 0
        
        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)
            
            optimizer.zero_grad()
            
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            corrects += torch.sum(preds == labels.data)
            total += labels.size(0)
            
        epoch_loss = running_loss / total
        epoch_acc = corrects.double() / total
        print(f"Epoch {epoch+1}/{num_epochs} - Train Loss: {epoch_loss:.4f} - Train Acc: {epoch_acc:.4f}")
        
        # Validation
        if val_loader:
            model.eval()
            val_loss = 0.0
            val_corrects = 0
            val_total = 0
            
            with torch.no_grad():
                for images, labels in val_loader:
                    images = images.to(device)
                    labels = labels.to(device)
                    
                    outputs = model(images)
                    loss = criterion(outputs, labels)
                    
                    val_loss += loss.item() * images.size(0)
                    _, preds = torch.max(outputs, 1)
                    val_corrects += torch.sum(preds == labels.data)
                    val_total += labels.size(0)
                    
            v_loss = val_loss / val_total
            v_acc = val_corrects.double() / val_total
            print(f"Validation Loss: {v_loss:.4f} - Validation Acc: {v_acc:.4f}")
            
            # Save best checkpoint
            if v_acc > best_acc:
                best_acc = v_acc
                torch.save(model.state_dict(), output_path)
                print(f"Saved new best model checkpoint to {output_path}")
        else:
            # If no validation set, save current epoch weights
            torch.save(model.state_dict(), output_path)
            
    print("Training finished successfully.")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Train the psoriasis classifier.")
    parser.add_argument("--data-dir", default="../dataset_clean", help="Dataset root (must contain train/ and val/ subfolders)")
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=0.001)
    parser.add_argument("--output", default="../best_psoriasis_model.pth", help="Where to save the checkpoint")
    args = parser.parse_args()

    train_model(
        data_dir=args.data_dir,
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        output_path=args.output,
    )