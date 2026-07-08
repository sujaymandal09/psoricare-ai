# Dissertation & Technical Implementation Notes

## 1. Architectural Choice: ResNet-18
- **Why ResNet?** Residual Networks (ResNets) solve the vanishing gradient problem in deep networks using skip connections (residual blocks).
- **Why ResNet-18 specifically?** Medical skin photo datasets are typically small. Deeper networks (like ResNet-101 or ResNet-152) are prone to severe overfitting on limited data and have high computational costs. ResNet-18 maintains a light parameter footprint while capturing complex spatial features, making it highly effective for rapid training on personal hardware or CPUs.
- **Transfer Learning Strategy**: We initialize weights from ImageNet training. The feature extractor layers are fine-tuned, and the final classification head is completely replaced with a custom sequential stack:
  ```text
  Linear(in_features, 256) -> ReLU -> Dropout(0.4) -> Linear(256, num_classes)
  ```
  *Dropout* of 0.4 is applied to prevent co-adaptation of hidden units, improving generalization.

## 2. Preprocessing & Augmentation Strategy
- **Autocontrast**: Clinical photos have diverse lighting. Applying `ImageOps.autocontrast` stretches the image histogram to utilize the full dynamic range, bringing consistency across different camera sensors and ambient lights.
- **Normalizing**: Images are normalized using standard ImageNet parameters:
  - Mean: `[0.485, 0.456, 0.406]`
  - Standard Deviation: `[0.229, 0.224, 0.225]`
- **Augmentation Multipliers**: Medical data is often highly imbalanced. The `augmentation.py` script multiplies raw datasets by generating random horizontal/vertical flips, rotations, and color jitters.

## 3. Training & Convergence Guidelines
- **Batch Size**: Suggested `16` or `32` to stabilize gradients on small sample sizes.
- **Learning Rate**: `0.001` or `0.0001` with the Adam optimizer is recommended.
- **Early Stopping**: Save model checkpoints only when validation accuracy improves to avoid capturing noise at later epochs.

## 4. Academic Evaluation Metrics
- **Precision**: Of all predicted psoriasis cases, how many are actually psoriasis? (Crucial for minimizing false positives, which can lead to unnecessary patient anxiety).
- **Recall / Sensitivity**: Of all actual psoriasis cases, how many did the model find? (Crucial in medicine to ensure no patient goes untreated).
- **F1-Score**: Harmonic mean of Precision and Recall.
- **Confusion Matrix**: Helps diagnose which classes are frequently interchanged (e.g., confusing psoriasis with eczema due to shared red/scaly features).
