import os
import torch
import matplotlib.pyplot as plt

def save_checkpoint(state, filename="checkpoint.pth.tar"):
    """Saves training checkpoint"""
    print(f"=> Saving checkpoint to {filename}")
    torch.save(state, filename)

def load_checkpoint(checkpoint_path, model, optimizer=None):
    """Loads training checkpoint"""
    print(f"=> Loading checkpoint from {checkpoint_path}")
    checkpoint = torch.load(checkpoint_path)
    model.load_state_dict(checkpoint['state_dict'])
    if optimizer and 'optimizer' in checkpoint:
        optimizer.load_state_dict(checkpoint['optimizer'])
    return checkpoint

def plot_training_curves(train_losses, val_losses, train_accs, val_accs, save_path="training_curves.png"):
    """Generates training/validation loss & accuracy curves"""
    plt.figure(figsize=(12, 4))
    
    # Plot loss
    plt.subplot(1, 2, 1)
    plt.plot(train_losses, label="Train Loss")
    plt.plot(val_losses, label="Val Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.title("Loss Curves")
    plt.legend()
    
    # Plot accuracy
    plt.subplot(1, 2, 2)
    plt.plot(train_accs, label="Train Acc")
    plt.plot(val_accs, label="Val Acc")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.title("Accuracy Curves")
    plt.legend()
    
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()
    print(f"Saved curves to {save_path}")
